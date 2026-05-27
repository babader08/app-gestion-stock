package service

import (
	"App-Gestion-Produits/internal/models"
	"context"
	"errors"
	"os"
	"testing"
	"time"
)

// --- RegisterUser ---

func TestRegisterUser_Success(t *testing.T) {
	repo := &mockAuthRepo{
		createUserWithOTPFn: func(_ context.Context, u *models.User, code string, expiry time.Time) (int64, error) {
			return 42, nil
		},
	}
	svc := newTestAuthService(repo, &mockMailer{})

	userID, err := svc.RegisterUser(context.Background(), "Alice", "alice@test.com", "secret123")
	if err != nil {
		t.Fatalf("attendu nil, obtenu %v", err)
	}
	if userID != 42 {
		t.Errorf("attendu userID=42, obtenu %d", userID)
	}
}

func TestRegisterUser_RepoError(t *testing.T) {
	repoErr := errors.New("email déjà utilisé")
	repo := &mockAuthRepo{
		createUserWithOTPFn: func(_ context.Context, u *models.User, code string, expiry time.Time) (int64, error) {
			return 0, repoErr
		},
	}
	svc := newTestAuthService(repo, &mockMailer{})

	_, err := svc.RegisterUser(context.Background(), "Bob", "bob@test.com", "pass")
	if !errors.Is(err, repoErr) {
		t.Errorf("attendu %v, obtenu %v", repoErr, err)
	}
}

// --- LoginUser ---

func TestLoginUser_Success(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-key")

	hash := hashPassword(t, "password123")
	repo := &mockAuthRepo{
		getByEmailFn: func(email string) (*models.User, error) {
			return &models.User{ID: 1, Email: email, HashedPassword: hash, Activated: true}, nil
		},
		insertTokenFn: func(userID int, token string, expiry time.Time, scope string) error {
			return nil
		},
	}
	svc := newTestAuthService(repo, &mockMailer{})

	accessToken, refreshToken, err := svc.LoginUser(context.Background(), "alice@test.com", "password123")
	if err != nil {
		t.Fatalf("attendu nil, obtenu %v", err)
	}
	if accessToken == "" {
		t.Error("accessToken ne doit pas être vide")
	}
	if refreshToken == "" {
		t.Error("refreshToken ne doit pas être vide")
	}
}

func TestLoginUser_WrongPassword(t *testing.T) {
	hash := hashPassword(t, "correctpassword")
	repo := &mockAuthRepo{
		getByEmailFn: func(email string) (*models.User, error) {
			return &models.User{ID: 1, HashedPassword: hash, Activated: true}, nil
		},
	}
	svc := newTestAuthService(repo, &mockMailer{})

	_, _, err := svc.LoginUser(context.Background(), "alice@test.com", "wrongpassword")
	if !errors.Is(err, ErrWrongPassword) {
		t.Errorf("attendu ErrWrongPassword, obtenu %v", err)
	}
}

func TestLoginUser_UserNotActivated(t *testing.T) {
	hash := hashPassword(t, "password123")
	repo := &mockAuthRepo{
		getByEmailFn: func(email string) (*models.User, error) {
			return &models.User{ID: 1, HashedPassword: hash, Activated: false}, nil
		},
	}
	svc := newTestAuthService(repo, &mockMailer{})

	_, _, err := svc.LoginUser(context.Background(), "alice@test.com", "password123")
	if !errors.Is(err, ErrUserNotActivated) {
		t.Errorf("attendu ErrUserNotActivated, obtenu %v", err)
	}
}

func TestLoginUser_EmailNotFound(t *testing.T) {
	repoErr := errors.New("user not found")
	repo := &mockAuthRepo{
		getByEmailFn: func(email string) (*models.User, error) {
			return nil, repoErr
		},
	}
	svc := newTestAuthService(repo, &mockMailer{})

	_, _, err := svc.LoginUser(context.Background(), "ghost@test.com", "password123")
	if !errors.Is(err, repoErr) {
		t.Errorf("attendu %v, obtenu %v", repoErr, err)
	}
}

// --- ActivateUserWithCode ---

func TestActivateUserWithCode_Success(t *testing.T) {
	repo := &mockAuthRepo{
		getUserIDByTokenFn: func(tokenHash []byte, scope string) (int, error) { return 5, nil },
		activateUserFn:     func(userID int) error { return nil },
		deleteTokensFn:     func(tokenHash []byte, scope string) error { return nil },
	}
	svc := newTestAuthService(repo, &mockMailer{})

	if err := svc.ActivateUserWithCode(context.Background(), "123456"); err != nil {
		t.Errorf("attendu nil, obtenu %v", err)
	}
}

func TestActivateUserWithCode_InvalidCode(t *testing.T) {
	repoErr := errors.New("token invalide ou expiré")
	repo := &mockAuthRepo{
		getUserIDByTokenFn: func(tokenHash []byte, scope string) (int, error) { return 0, repoErr },
	}
	svc := newTestAuthService(repo, &mockMailer{})

	if err := svc.ActivateUserWithCode(context.Background(), "000000"); !errors.Is(err, repoErr) {
		t.Errorf("attendu %v, obtenu %v", repoErr, err)
	}
}

// --- ResetPassword ---

func TestResetPassword_Success(t *testing.T) {
	repo := &mockAuthRepo{
		getUserIDByTokenFn: func(tokenHash []byte, scope string) (int, error) { return 7, nil },
		updatePasswordFn:   func(userId int, newPassword []byte) error { return nil },
		deleteTokensFn:     func(tokenHash []byte, scope string) error { return nil },
	}
	svc := newTestAuthService(repo, &mockMailer{})

	if err := svc.ResetPassword(context.Background(), "123456", "newpassword"); err != nil {
		t.Errorf("attendu nil, obtenu %v", err)
	}
}

func TestResetPassword_InvalidCode(t *testing.T) {
	repoErr := errors.New("code expiré")
	repo := &mockAuthRepo{
		getUserIDByTokenFn: func(tokenHash []byte, scope string) (int, error) { return 0, repoErr },
	}
	svc := newTestAuthService(repo, &mockMailer{})

	if err := svc.ResetPassword(context.Background(), "badcode", "newpassword"); !errors.Is(err, repoErr) {
		t.Errorf("attendu %v, obtenu %v", repoErr, err)
	}
}

// --- RefreshAccessToken ---

func TestRefreshAccessToken_Success(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret-key")

	repo := &mockAuthRepo{
		getUserIDByTokenFn: func(tokenHash []byte, scope string) (int, error) { return 3, nil },
		deleteTokensFn:     func(tokenHash []byte, scope string) error { return nil },
		insertTokenFn:      func(userID int, token string, expiry time.Time, scope string) error { return nil },
	}
	svc := newTestAuthService(repo, &mockMailer{})

	newAccess, newRefresh, err := svc.RefreshAccessToken(context.Background(), "some-valid-refresh-token")
	if err != nil {
		t.Fatalf("attendu nil, obtenu %v", err)
	}
	if newAccess == "" {
		t.Error("newAccessToken ne doit pas être vide")
	}
	if newRefresh == "" {
		t.Error("newRefreshToken ne doit pas être vide")
	}
}

func TestRefreshAccessToken_InvalidToken(t *testing.T) {
	repo := &mockAuthRepo{
		getUserIDByTokenFn: func(tokenHash []byte, scope string) (int, error) {
			return 0, errors.New("token invalide")
		},
	}
	svc := newTestAuthService(repo, &mockMailer{})

	if _, _, err := svc.RefreshAccessToken(context.Background(), "bad-token"); !errors.Is(err, ErrInvalidToken) {
		t.Errorf("attendu ErrInvalidToken, obtenu %v", err)
	}
}

// --- LogoutUser ---

func TestLogoutUser_Success(t *testing.T) {
	repo := &mockAuthRepo{
		deleteTokensFn: func(tokenHash []byte, scope string) error { return nil },
	}
	svc := newTestAuthService(repo, &mockMailer{})

	if err := svc.LogoutUser(context.Background(), "my-refresh-token"); err != nil {
		t.Errorf("attendu nil, obtenu %v", err)
	}
}

// --- ResendOTP ---

func TestResendOTP_Success(t *testing.T) {
	repo := &mockAuthRepo{
		getByEmailFn: func(email string) (*models.User, error) {
			return &models.User{ID: 1, Email: email}, nil
		},
		deleteTokensByUserAndScope: func(userID int, scope string) error { return nil },
		insertTokenFn:              func(userID int, token string, expiry time.Time, scope string) error { return nil },
	}
	svc := newTestAuthService(repo, &mockMailer{})

	if err := svc.ResendOTP(context.Background(), "alice@test.com"); err != nil {
		t.Errorf("attendu nil, obtenu %v", err)
	}
}

func TestResendOTP_EmailNotFound(t *testing.T) {
	repoErr := errors.New("email introuvable")
	repo := &mockAuthRepo{
		getByEmailFn: func(email string) (*models.User, error) { return nil, repoErr },
	}
	svc := newTestAuthService(repo, &mockMailer{})

	if err := svc.ResendOTP(context.Background(), "ghost@test.com"); !errors.Is(err, repoErr) {
		t.Errorf("attendu %v, obtenu %v", repoErr, err)
	}
}