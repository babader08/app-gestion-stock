package service

import (
	"App-Gestion-Produits/internal/models"
	"context"
	"errors"
	"strings"
	"testing"
	"time"
)

// --- AddProduct ---

func TestAddProduct_Success(t *testing.T) {
	now := time.Now()
	repo := &mockProductRepo{
		addProductFn: func(p *models.Product) (int64, time.Time, error) {
			return 42, now, nil
		},
	}
	svc := newTestProductService(repo)

	product, err := svc.AddProduct(1, "Stylo", "ETQ-01", "Papeterie", "En Stock", "http://img.png", 1.5, 3.0, 100)
	if err != nil {
		t.Fatalf("attendu nil, obtenu %v", err)
	}
	if product.ID != 42 {
		t.Errorf("attendu ID=42, obtenu %d", product.ID)
	}
	if product.CreatedAt != now {
		t.Errorf("attendu CreatedAt=%v, obtenu %v", now, product.CreatedAt)
	}
}

func TestAddProduct_RepoError(t *testing.T) {
	repoErr := errors.New("erreur db")
	repo := &mockProductRepo{
		addProductFn: func(p *models.Product) (int64, time.Time, error) {
			return 0, time.Time{}, repoErr
		},
	}
	svc := newTestProductService(repo)

	_, err := svc.AddProduct(1, "Stylo", "ETQ-01", "Papeterie", "En Stock", "", 1.5, 3.0, 10)
	if !errors.Is(err, repoErr) {
		t.Errorf("attendu %v, obtenu %v", repoErr, err)
	}
}

// --- GetProductsByUser ---

func TestGetProductsByUser_DefaultLimit(t *testing.T) {
	var capturedFilter models.ProductFilter
	repo := &mockProductRepo{
		getProductsFn: func(_ context.Context, _ int64, f models.ProductFilter) ([]models.Product, error) {
			capturedFilter = f
			return []models.Product{}, nil
		},
	}
	svc := newTestProductService(repo)

	_, err := svc.GetProductsByUser(context.Background(), 1, models.ProductFilter{Limit: 0})
	if err != nil {
		t.Fatal(err)
	}
	if capturedFilter.Limit != 20 {
		t.Errorf("attendu Limit=20, obtenu %d", capturedFilter.Limit)
	}
}

func TestGetProductsByUser_LimitTooHigh(t *testing.T) {
	var capturedFilter models.ProductFilter
	repo := &mockProductRepo{
		getProductsFn: func(_ context.Context, _ int64, f models.ProductFilter) ([]models.Product, error) {
			capturedFilter = f
			return []models.Product{}, nil
		},
	}
	svc := newTestProductService(repo)

	_, err := svc.GetProductsByUser(context.Background(), 1, models.ProductFilter{Limit: 200})
	if err != nil {
		t.Fatal(err)
	}
	if capturedFilter.Limit != 20 {
		t.Errorf("attendu Limit=20, obtenu %d", capturedFilter.Limit)
	}
}

func TestGetProductsByUser_InvalidStatus(t *testing.T) {
	var capturedFilter models.ProductFilter
	repo := &mockProductRepo{
		getProductsFn: func(_ context.Context, _ int64, f models.ProductFilter) ([]models.Product, error) {
			capturedFilter = f
			return []models.Product{}, nil
		},
	}
	svc := newTestProductService(repo)

	_, err := svc.GetProductsByUser(context.Background(), 1, models.ProductFilter{Limit: 10, Status: "Inconnu"})
	if err != nil {
		t.Fatal(err)
	}
	if capturedFilter.Status != "" {
		t.Errorf("attendu Status vide, obtenu %q", capturedFilter.Status)
	}
}

func TestGetProductsByUser_ValidStatus(t *testing.T) {
	var capturedFilter models.ProductFilter
	repo := &mockProductRepo{
		getProductsFn: func(_ context.Context, _ int64, f models.ProductFilter) ([]models.Product, error) {
			capturedFilter = f
			return []models.Product{}, nil
		},
	}
	svc := newTestProductService(repo)

	_, err := svc.GetProductsByUser(context.Background(), 1, models.ProductFilter{Limit: 10, Status: "En Stock"})
	if err != nil {
		t.Fatal(err)
	}
	if capturedFilter.Status != "En Stock" {
		t.Errorf("attendu Status=%q, obtenu %q", "En Stock", capturedFilter.Status)
	}
}

func TestGetProductsByUser_SearchTrimmed(t *testing.T) {
	var capturedFilter models.ProductFilter
	repo := &mockProductRepo{
		getProductsFn: func(_ context.Context, _ int64, f models.ProductFilter) ([]models.Product, error) {
			capturedFilter = f
			return []models.Product{}, nil
		},
	}
	svc := newTestProductService(repo)

	_, err := svc.GetProductsByUser(context.Background(), 1, models.ProductFilter{Limit: 10, Search: "  stylo  "})
	if err != nil {
		t.Fatal(err)
	}
	if capturedFilter.Search != "stylo" {
		t.Errorf("attendu Search=%q, obtenu %q", "stylo", capturedFilter.Search)
	}
}

func TestGetProductsByUser_SearchTruncatedAt100(t *testing.T) {
	var capturedFilter models.ProductFilter
	repo := &mockProductRepo{
		getProductsFn: func(_ context.Context, _ int64, f models.ProductFilter) ([]models.Product, error) {
			capturedFilter = f
			return []models.Product{}, nil
		},
	}
	svc := newTestProductService(repo)

	longSearch := strings.Repeat("a", 150)
	_, err := svc.GetProductsByUser(context.Background(), 1, models.ProductFilter{Limit: 10, Search: longSearch})
	if err != nil {
		t.Fatal(err)
	}
	if len(capturedFilter.Search) != 100 {
		t.Errorf("attendu Search tronqué à 100 chars, obtenu %d", len(capturedFilter.Search))
	}
}

func TestGetProductsByUser_HasMore(t *testing.T) {
	repo := &mockProductRepo{
		getProductsFn: func(_ context.Context, _ int64, f models.ProductFilter) ([]models.Product, error) {
			products := make([]models.Product, f.Limit+1)
			for i := range products {
				products[i] = models.Product{ID: int64(i + 1)}
			}
			return products, nil
		},
	}
	svc := newTestProductService(repo)

	result, err := svc.GetProductsByUser(context.Background(), 1, models.ProductFilter{Limit: 5})
	if err != nil {
		t.Fatal(err)
	}
	if result["has_more"] != true {
		t.Error("attendu has_more=true")
	}
	if result["product_count"] != 5 {
		t.Errorf("attendu product_count=5, obtenu %v", result["product_count"])
	}
}

func TestGetProductsByUser_NoMore(t *testing.T) {
	repo := &mockProductRepo{
		getProductsFn: func(_ context.Context, _ int64, f models.ProductFilter) ([]models.Product, error) {
			return []models.Product{{ID: 10}, {ID: 9}}, nil
		},
	}
	svc := newTestProductService(repo)

	result, err := svc.GetProductsByUser(context.Background(), 1, models.ProductFilter{Limit: 5})
	if err != nil {
		t.Fatal(err)
	}
	if result["has_more"] != false {
		t.Error("attendu has_more=false")
	}
	if result["next_cursor"] != 9 {
		t.Errorf("attendu next_cursor=9, obtenu %v", result["next_cursor"])
	}
}

func TestGetProductsByUser_EmptyResult(t *testing.T) {
	repo := &mockProductRepo{
		getProductsFn: func(_ context.Context, _ int64, f models.ProductFilter) ([]models.Product, error) {
			return []models.Product{}, nil
		},
	}
	svc := newTestProductService(repo)

	result, err := svc.GetProductsByUser(context.Background(), 1, models.ProductFilter{Limit: 10})
	if err != nil {
		t.Fatal(err)
	}
	if result["next_cursor"] != 0 {
		t.Errorf("attendu next_cursor=0, obtenu %v", result["next_cursor"])
	}
	if result["has_more"] != false {
		t.Error("attendu has_more=false pour résultat vide")
	}
}

func TestGetProductsByUser_RepoError(t *testing.T) {
	repoErr := errors.New("erreur db")
	repo := &mockProductRepo{
		getProductsFn: func(_ context.Context, _ int64, f models.ProductFilter) ([]models.Product, error) {
			return nil, repoErr
		},
	}
	svc := newTestProductService(repo)

	_, err := svc.GetProductsByUser(context.Background(), 1, models.ProductFilter{Limit: 10})
	if !errors.Is(err, repoErr) {
		t.Errorf("attendu %v, obtenu %v", repoErr, err)
	}
}

// --- DeleteProduct ---

func TestDeleteProduct_Success(t *testing.T) {
	repo := &mockProductRepo{
		deleteProductsFn: func(productId int, userId int) error { return nil },
	}
	svc := newTestProductService(repo)

	if err := svc.DeleteProduct(1, 10); err != nil {
		t.Errorf("attendu nil, obtenu %v", err)
	}
}

func TestDeleteProduct_Error(t *testing.T) {
	repoErr := errors.New("produit introuvable")
	repo := &mockProductRepo{
		deleteProductsFn: func(productId int, userId int) error { return repoErr },
	}
	svc := newTestProductService(repo)

	if err := svc.DeleteProduct(99, 1); !errors.Is(err, repoErr) {
		t.Errorf("attendu %v, obtenu %v", repoErr, err)
	}
}

// --- UpdateProduct ---

func TestUpdateProduct_Success(t *testing.T) {
	repo := &mockProductRepo{
		updateProductFn: func(p *models.Product, userId int) error { return nil },
	}
	svc := newTestProductService(repo)

	if err := svc.UpdateProduct(&models.Product{ID: 1, ProductName: "Cahier"}, 10); err != nil {
		t.Errorf("attendu nil, obtenu %v", err)
	}
}

func TestUpdateProduct_Error(t *testing.T) {
	repoErr := errors.New("accès refusé")
	repo := &mockProductRepo{
		updateProductFn: func(p *models.Product, userId int) error { return repoErr },
	}
	svc := newTestProductService(repo)

	if err := svc.UpdateProduct(&models.Product{ID: 1}, 99); !errors.Is(err, repoErr) {
		t.Errorf("attendu %v, obtenu %v", repoErr, err)
	}
}

// --- GetDashboardStats ---

func TestGetDashboardStats_Success(t *testing.T) {
	expected := &models.DashboardStats{
		TotalProduits:    10,
		TotalStock:       200,
		DepensesEstimees: 1500.0,
		RevenusEstimes:   3000.0,
		EnStock:          8,
		EnRupture:        2,
	}
	repo := &mockProductRepo{
		getDashboardFn: func(userID int) (*models.DashboardStats, error) { return expected, nil },
	}
	svc := newTestProductService(repo)

	stats, err := svc.GetDashboardStats(1)
	if err != nil {
		t.Fatal(err)
	}
	if stats.TotalProduits != expected.TotalProduits {
		t.Errorf("attendu TotalProduits=%d, obtenu %d", expected.TotalProduits, stats.TotalProduits)
	}
	if stats.RevenusEstimes != expected.RevenusEstimes {
		t.Errorf("attendu RevenusEstimes=%.2f, obtenu %.2f", expected.RevenusEstimes, stats.RevenusEstimes)
	}
}

func TestGetDashboardStats_Error(t *testing.T) {
	repoErr := errors.New("erreur db")
	repo := &mockProductRepo{
		getDashboardFn: func(userID int) (*models.DashboardStats, error) { return nil, repoErr },
	}
	svc := newTestProductService(repo)

	if _, err := svc.GetDashboardStats(1); !errors.Is(err, repoErr) {
		t.Errorf("attendu %v, obtenu %v", repoErr, err)
	}
}
