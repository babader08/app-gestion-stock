package repository

import (
	"App-Gestion-Produits/internal/models"
	"context"
	"crypto/sha256"
	"database/sql"
	"time"
)

type AuthRepository interface {
	CreateUserWithOTP(ctx context.Context, u *models.User, code string, expiry time.Time) (int64, error)
	EmailExists(email string) (bool, error)
	ActivateUser(userID int) error
	GetUserIDByToken(tokenHash []byte, scope string) (int, error)
	GetByEmail(email string) (*models.User, error)
	InsertToken(userID int, token string, expiry time.Time, scope string) error
	DeleteTokens(tokenHash []byte, scope string) error
	UpdatePassword(userId int, newPassword []byte) error
	DeleteTokensByUserAndScope(userID int, scope string) error
}

type AuthRepo struct {
	DB                             *sql.DB
	InsertUserStmt                 *sql.Stmt
	InsertProfileStmt              *sql.Stmt
	GetUsersStmt                   *sql.Stmt
	DeleteTokensStmt               *sql.Stmt
	EmailExistsStmt                *sql.Stmt
	ActivateUserStmt               *sql.Stmt
	GetTokenUserStmt               *sql.Stmt
	GetUserByEmailStmt             *sql.Stmt
	InsertTokenUserStmt            *sql.Stmt
	UpdatePasswordStmt             *sql.Stmt
	DeleteTokensByUserAndScopeStmt *sql.Stmt
	InsertStockStmt                *sql.Stmt
}

func NewAuthRepo(db *sql.DB) (*AuthRepo, error) {
	InsertStmt, err := db.Prepare("INSERT INTO users (name, email, hashed_password)VALUES ($1, $2, $3) RETURNING id")
	if err != nil {
		return nil, err
	}
	ProfileStmt, err := db.Prepare("INSERT INTO profile (user_id, avatar) VALUES ($1, $2)")
	if err != nil {
		return nil, err
	}
	EmailStmt, err := db.Prepare("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)")
	if err != nil {
		return nil, err
	}
	ActivateStmt, err := db.Prepare("UPDATE users SET activated = true WHERE id = $1")
	if err != nil {
		return nil, err
	}
	GetTokenStmt, err := db.Prepare("SELECT user_id FROM tokens WHERE hash = $1 AND scope = $2 AND expiry > NOW()")
	if err != nil {
		return nil, err
	}
	GetByEmailStmt, err := db.Prepare("SELECT id, name, email, hashed_password, activated FROM users WHERE email = $1")
	if err != nil {
		return nil, err
	}
	InsertTokenStmt, err := db.Prepare("INSERT INTO tokens (hash, user_id, expiry, scope) VALUES ($1, $2, $3, $4)")
	if err != nil {
		return nil, err
	}
	logoutStmt, err := db.Prepare("DELETE FROM tokens WHERE hash = $1 AND scope = $2")
	if err != nil {
		return nil, err
	}
	UpdatePasswordStmt, err := db.Prepare("UPDATE users SET hashed_password = $1 WHERE id = $2")
	if err != nil {
		return nil, err
	}
	TokensByUserAndScopeStmt, err := db.Prepare("DELETE FROM tokens WHERE user_id = $1 AND scope = $2")
	if err != nil {
		return nil, err
	}

	return &AuthRepo{
		DB:                             db,
		InsertUserStmt:                 InsertStmt,
		InsertProfileStmt:              ProfileStmt,
		EmailExistsStmt:                EmailStmt,
		ActivateUserStmt:               ActivateStmt,
		GetTokenUserStmt:               GetTokenStmt,
		GetUserByEmailStmt:             GetByEmailStmt,
		InsertTokenUserStmt:            InsertTokenStmt,
		DeleteTokensStmt:               logoutStmt,
		UpdatePasswordStmt:             UpdatePasswordStmt,
		DeleteTokensByUserAndScopeStmt: TokensByUserAndScopeStmt,
	}, nil
}

func (r *AuthRepo) Close() {
	_ = r.InsertUserStmt.Close()
	_ = r.InsertProfileStmt.Close()
	_ = r.DeleteTokensStmt.Close()
	_ = r.EmailExistsStmt.Close()
	_ = r.ActivateUserStmt.Close()
	_ = r.GetUserByEmailStmt.Close()
	_ = r.InsertTokenUserStmt.Close()
	_ = r.GetTokenUserStmt.Close()
	_ = r.UpdatePasswordStmt.Close()
	_ = r.DeleteTokensByUserAndScopeStmt.Close()

}

// CreateUserWithOTP : une methode transaction pour créer un user en envoyer le code en meme temps :
func (r *AuthRepo) CreateUserWithOTP(ctx context.Context, u *models.User, code string, expiry time.Time) (int64, error) {
	tx, err := r.DB.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	// 1. Créer l'utilisateur
	var userId int64
	stmtUser := tx.Stmt(r.InsertUserStmt)
	err = stmtUser.QueryRowContext(ctx, u.Name, u.Email, u.HashedPassword).Scan(&userId)
	if err != nil {
		return 0, err
	}

	// 2. Stocker le code OTP :
	hash := sha256.Sum256([]byte(code))
	stmtCode := tx.Stmt(r.InsertTokenUserStmt)
	_, err = stmtCode.ExecContext(ctx, hash[:], userId, expiry, "activation") //  "activation" c'est juste une étiquette pour savoir ce code correspond à quoi
	if err != nil {
		return 0, err
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}

	u.ID = int(userId)
	return userId, nil
}

func (r *AuthRepo) EmailExists(email string) (bool, error) {
	var exists bool
	err := r.EmailExistsStmt.QueryRow(email).Scan(&exists)
	return exists, err
}

func (r *AuthRepo) ActivateUser(userID int) error {
	_, err := r.ActivateUserStmt.Exec(userID)
	return err
}

func (r *AuthRepo) GetByEmail(email string) (*models.User, error) {
	user := &models.User{}
	err := r.GetUserByEmailStmt.QueryRow(email).Scan(&user.ID, &user.Name, &user.Email, &user.HashedPassword, &user.Activated)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *AuthRepo) InsertToken(userID int, token string, expiry time.Time, scope string) error {
	hash := sha256.Sum256([]byte(token))
	_, err := r.InsertTokenUserStmt.Exec(hash[:], userID, expiry, scope)
	return err
}

func (r *AuthRepo) GetUserIDByToken(tokenHash []byte, scope string) (int, error) {
	var userID int
	err := r.GetTokenUserStmt.QueryRow(tokenHash, scope).Scan(&userID)

	if err != nil {
		return 0, err
	}
	return userID, nil
}

func (r *AuthRepo) DeleteTokens(tokenHash []byte, scope string) error {
	_, err := r.DeleteTokensStmt.Exec(tokenHash, scope)
	return err
}

func (r *AuthRepo) UpdatePassword(userId int, newPassword []byte) error {
	_, err := r.UpdatePasswordStmt.Exec(newPassword, userId)
	return err
}

func (r *AuthRepo) DeleteTokensByUserAndScope(userID int, scope string) error {
	_, err := r.DeleteTokensByUserAndScopeStmt.Exec(userID, scope)
	return err
}
