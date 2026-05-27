package service

import (
	"App-Gestion-Produits/internal/models"
	"context"
)

type Mailer interface {
	Send(to, template string, data map[string]any) error
}

type ProductServicer interface {
	AddProduct(userID int64, name, etiquette, category, status, imageURL string, purchasePrice, sellingPrice float64, stock int) (*models.Product, error)
	GetProductsByUser(ctx context.Context, userID int64, filter models.ProductFilter) (map[string]any, error)
	DeleteProduct(productId int, userId int) error
	UpdateProduct(p *models.Product, userId int) error
	GetDashboardStats(userID int) (*models.DashboardStats, error)
}
