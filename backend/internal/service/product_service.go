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

func (s *ProductService) GetProductsByUser(ctx context.Context, userID int64, limit int, cursor int, status, category, search string) (map[string]any, error) {

	if limit < 1 || limit > 100 {
		limit = 20
	}
	if cursor < 0 {
		cursor = 0
	}

	//  Validation des filtres :
	validStatus := map[string]bool{
		"En Stock": true,
		"Rupture":  true,
	}
	if status != "" && !validStatus[status] {
		status = ""
	}

	// le champ de recherche :
	search = strings.TrimSpace(search)
	if len(search) > 100 {
		search = search[:100]
	}

	products, err := s.productRepo.GetProductsByUser(ctx, userID, limit+1, cursor, status, category, search)
	if err != nil {
		s.logger.Error("cannot get the products", "error", err)
		return nil, err
	}

	hasMore := false
	nextCursor := 0

	if len(products) > limit {
		hasMore = true
		products = products[:limit]
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
