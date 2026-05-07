package service

import (
	"App-Gestion-Produits/internal/models"
	"App-Gestion-Produits/internal/repository"
	"log/slog"
)

type UserRepository interface {
	GetUserByID(id int) (*models.User, error)
}

type UserService struct {
	logger   *slog.Logger
	userRepo repository.UserRepository
}

func NewUserService(logger *slog.Logger, userRepo repository.UserRepository) *UserService {
	return &UserService{logger: logger, userRepo: userRepo}
}

func (s *UserService) GetUserByID(id int) (*models.User, error) {
	user, err := s.userRepo.GetUserByID(id)
	if err != nil {
		s.logger.Error("Erreur sur la recuperation du nom", "error", err)
		return nil, err
	}
	return user, nil
}
