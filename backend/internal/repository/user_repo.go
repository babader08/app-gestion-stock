package repository

import (
	"App-Gestion-Produits/internal/models"
	"database/sql"
)

type UserRepository interface {
	GetUserByID(userId int) (*models.User, error)
}

type UserRepo struct {
	Db *sql.DB
}

func NewUserRepo(db *sql.DB) (*UserRepo, error) {
	return &UserRepo{Db: db}, nil
}

func (r *UserRepo) GetUserByID(userId int) (*models.User, error) {
	var user models.User
	query := `SELECT id, name, email FROM users WHERE id = $1`
	err := r.Db.QueryRow(query, userId).Scan(&user.ID, &user.Name, &user.Email)
	if err != nil {
		return nil, err
	}

	return &user, nil
}
