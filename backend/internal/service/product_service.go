package service

import (
	"App-Gestion-Produits/internal/models"
	"App-Gestion-Produits/internal/repository"
	"context"
	"log/slog"
	"strings"
)

type ProductService struct {
	logger      *slog.Logger
	productRepo repository.ProductRepository
}

func NewProductService(logger *slog.Logger, productRepo repository.ProductRepository) *ProductService {
	return &ProductService{logger: logger, productRepo: productRepo}
}

func (s *ProductService) AddProduct(UserID int64, ProductName, Etiquette, Category, status, ImageURL string, PurchasePrice, SellingPrice float64, Stock int) (*models.Product, error) {
	products := models.Product{
		UserID:        UserID,
		ProductName:   ProductName,
		Etiquette:     Etiquette,
		Category:      Category,
		Status:        status,
		PurchasePrice: PurchasePrice,
		SellingPrice:  SellingPrice,
		ImageURL:      ImageURL,
		Stock:         Stock,
	}

	id, createdAt, err := s.productRepo.AddProduct(&products)
	if err != nil {
		s.logger.Error("Erreur lors de l'ajout du produit", "error", err)
		return nil, err
	}

	products.ID = id
	products.CreatedAt = createdAt
	return &products, err
}

func (s *ProductService) GetProductsByUser(ctx context.Context, userID int64, filter models.ProductFilter) (map[string]any, error) {

	if filter.Limit < 1 || filter.Limit > 100 {
		filter.Limit = 20
	}

	if filter.Cursor <= 0 {
		filter.Cursor = 0
	}

	//  Validation des filtres :
	validStatus := map[string]bool{
		"En Stock": true,
		"Rupture":  true,
	}
	
	if filter.Status != "" && !validStatus[filter.Status] {
		filter.Status = ""
	}

	// le champ de recherche :
	filter.Search = strings.TrimSpace(filter.Search)
	if len(filter.Search) > 100 {
		filter.Search = filter.Search[:100]
	}

	products, err := s.productRepo.GetProductsByUser(ctx, userID, filter)
	if err != nil {
		s.logger.Error(
			"cannot get the products",
			"error", err,
			"user_id", userID,
			"filter", filter,
		)
		return nil, err
	}

	hasMore := false
	nextCursor := 0

	if len(products) > filter.Limit {
		hasMore = true
		products = products[:filter.Limit]
	}

	if len(products) > 0 {
		nextCursor = int(products[len(products)-1].ID)
	}

	return map[string]any{
		"products":      products,
		"next_cursor":   nextCursor,
		"has_more":      hasMore,
		"product_count": len(products),
	}, nil
}

// DeleteProduct : service pour suppression de produit
func (s *ProductService) DeleteProduct(productId int, userId int) error {
	return s.productRepo.DeleteProducts(productId, userId)
}

// UpdateProduct : service pour la modification d'un produit
func (s *ProductService) UpdateProduct(p *models.Product, userId int) error {
	return s.productRepo.UpdateProduct(p, userId)
}

func (s *ProductService) GetDashboardStats(userID int) (*models.DashboardStats, error) {
	stats, err := s.productRepo.GetDashboardStats(userID)
	if err != nil {
		return nil, err
	}
	return stats, nil
}
