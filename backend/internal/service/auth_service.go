package service

import (
	"App-Gestion-Produits/internal/models"
	"App-Gestion-Produits/internal/repository"
	"App-Gestion-Produits/internal/validator"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"log/slog"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	repo   repository.AuthRepository
	mailer Mailer
	logger *slog.Logger
}

func NewAuthService(repo repository.AuthRepository, mailer Mailer, logger *slog.Logger) *AuthService {
	return &AuthService{
		repo:   repo,
		mailer: mailer,
		logger: logger,
	}
}

func (s *AuthService) RegisterUser(ctx context.Context, name, email, password string) (int64, error) {
	// 1. Hash le password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return 0, err
	}

	// 2. Créer l'user
	user := &models.User{
		Name:           name,
		Email:          email,
		HashedPassword: hashedPassword,
	}

	// 3. Générer OTP
	code := validator.GenerateOTP()
	expiry := time.Now().Add(1 * time.Hour)

	// 4. Créer user + OTP en transaction
	userId, err := s.repo.CreateUserWithOTP(ctx, user, code, expiry)
	if err != nil {
		return 0, err
	}

	// 5. Envoyer email (async)
	go func() {
		data := map[string]any{"OTP": code}
		if err := s.mailer.Send(email, "user_welcome.tmpl", data); err != nil {
			s.logger.Error("failed to send email", "err", err)
		}
	}()

	return userId, nil
}

func (s *AuthService) LoginUser(ctx context.Context, email, password string) (string, string, error) {
	user, err := s.repo.GetByEmail(email)
	if err != nil {
		return "", "", err
	}

	if err := bcrypt.CompareHashAndPassword(user.HashedPassword, []byte(password)); err != nil {
		return "", "", ErrWrongPassword
	}

	if !user.Activated {
		return "", "", ErrUserNotActivated
	}

	// Access token : 15 minutes
	accessToken, err := s.generateJWT(user.ID, 15*time.Minute)
	if err != nil {
		return "", "", err
	}

	// Refresh token : 30 jours
	refreshToken, err := s.generateRefreshToken(ctx, user.ID)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func (s *AuthService) ActivateUserWithCode(ctx context.Context, code string) error {
	// 1. Hasher le code
	hash := sha256.Sum256([]byte(code))

	// 2. Récupérer l'userID
	userID, err := s.repo.GetUserIDByToken(hash[:], "activation")
	if err != nil {
		return err
	}

	// 3. Activer
	if err := s.repo.ActivateUser(userID); err != nil {
		return err
	}

	// 4. Supprimer le code
	if err := s.repo.DeleteTokens(hash[:], "activation"); err != nil {
		s.logger.Error("failed to delete token", "err", err)
	}

	return nil
}

func (s *AuthService) RequestPasswordReset(ctx context.Context, email string) error {
	user, err := s.repo.GetByEmail(email)
	if err != nil {
		s.logger.Error("email not found", "err", err)
		return nil
	}

	// Générer OTP (code à 6 chiffres) au lieu d'un token
	code := validator.GenerateOTP()
	expiry := time.Now().Add(45 * time.Minute)

	// Stocker dans la DB
	err = s.repo.InsertToken(user.ID, code, expiry, "password-reset")
	if err != nil {
		return err
	}

	// Envoyer email (async)
	go func() {
		data := map[string]any{"ResetCode": code}
		if err := s.mailer.Send(email, "password_reset.tmpl", data); err != nil {
			s.logger.Error("failed to send email", "err", err)
		}
	}()

	return nil
}

func (s *AuthService) ResetPassword(ctx context.Context, code, newPassword string) error {

	// 2. Récupérer l'userID
	hash := sha256.Sum256([]byte(code))
	userID, err := s.repo.GetUserIDByToken(hash[:], "password-reset")
	if err != nil {
		return err
	}

	// 3. Hasher le new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), 12)
	if err != nil {
		return err
	}

	// 4. Update
	if err := s.repo.UpdatePassword(userID, hashedPassword); err != nil {
		return err
	}

	// 5. Supprimer le token
	if err := s.repo.DeleteTokens(hash[:], "password-reset"); err != nil {
		s.logger.Error("failed to delete token", "err", err)
	}

	return nil
}

func (s *AuthService) ResendOTP(ctx context.Context, email string) error {
	// 1. Récupérer l'user
	user, err := s.repo.GetByEmail(email)
	if err != nil {
		return err // Email n'existe pas
	}

	// 2. Supprimer l'ancien code OTP ✅
	// ✅ Supprime TOUS les anciens tokens d'activation de cet user
	if err := s.repo.DeleteTokensByUserAndScope(user.ID, "activation"); err != nil {
		s.logger.Error("failed to delete old tokens", "err", err)
	}

	// 3. Générer nouveau code OTP
	code := validator.GenerateOTP()
	expiry := time.Now().Add(1 * time.Hour)

	// 4. Insérer dans DB
	if err := s.repo.InsertToken(user.ID, code, expiry, "activation"); err != nil {
		return err
	}

	// 5. Envoyer email (async)
	go func() {
		data := map[string]any{"OTP": code}
		if err := s.mailer.Send(email, "user_welcome.tmpl", data); err != nil {
			s.logger.Error("failed to send email", "err", err)
		}
	}()

	return nil
}

// generateJWT : accepte maintenant une durée en paramètre
func (s *AuthService) generateJWT(userID int, duration time.Duration) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(duration).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

// generateRefreshToken : token aléatoire stocké en DB (30 jours) :
func (s *AuthService) generateRefreshToken(ctx context.Context, userID int) (string, error) {
	randomBytes := make([]byte, 32)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", err
	}
	token := base64.URLEncoding.EncodeToString(randomBytes)
	expiry := time.Now().Add(30 * 24 * time.Hour) // 30 jours

	if err := s.repo.InsertToken(userID, token, expiry, "refresh"); err != nil {
		return "", err
	}
	return token, nil
}

// RefreshAccessToken : vérifie le refresh token et génère un nouvel access token
func (s *AuthService) RefreshAccessToken(ctx context.Context, refreshToken string) (string, string, error) {
	// 1. Hash le refresh token
	hash := sha256.Sum256([]byte(refreshToken))

	// 2. Vérifie en DB que le refresh token est valide
	userID, err := s.repo.GetUserIDByToken(hash[:], "refresh")
	if err != nil {
		return "", "", ErrInvalidToken
	}

	// 3. ✅ SUPPRIME l'ancien refresh token (token rotation)
	if err := s.repo.DeleteTokens(hash[:], "refresh"); err != nil {
		s.logger.Error("failed to delete old refresh token", "err", err)
		return "", "", err
	}

	// 4. Génère un nouvel access token (15 minutes)
	newAccessToken, err := s.generateJWT(userID, 15*time.Minute)
	if err != nil {
		return "", "", err
	}

	// 5. Génère un nouveau refresh token (30 jours)
	newRefreshToken, err := s.generateRefreshToken(ctx, userID)
	if err != nil {
		return "", "", err
	}

	// 6. Retourne les 2 tokens
	return newAccessToken, newRefreshToken, nil
}

// LogoutUser : supprime aussi le refresh token en DB
func (s *AuthService) LogoutUser(ctx context.Context, refreshToken string) error {
	hash := sha256.Sum256([]byte(refreshToken))
	return s.repo.DeleteTokens(hash[:], "refresh")
}
