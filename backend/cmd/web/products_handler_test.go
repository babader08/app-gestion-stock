package main

import (
	"App-Gestion-Produits/internal/models"
	"App-Gestion-Produits/internal/repository"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

// --- Mock ProductService ---

type mockProductService struct {
	addProductFn     func(userID int64, name, etiquette, category, status, imageURL string, purchasePrice, sellingPrice float64, stock int) (*models.Product, error)
	getProductsFn    func(ctx context.Context, userID int64, filter models.ProductFilter) (map[string]any, error)
	deleteProductFn  func(productId int, userId int) error
	updateProductFn  func(p *models.Product, userId int) error
	getDashboardFn   func(userID int) (*models.DashboardStats, error)
}

func (m *mockProductService) AddProduct(userID int64, name, etiquette, category, status, imageURL string, purchasePrice, sellingPrice float64, stock int) (*models.Product, error) {
	return m.addProductFn(userID, name, etiquette, category, status, imageURL, purchasePrice, sellingPrice, stock)
}
func (m *mockProductService) GetProductsByUser(ctx context.Context, userID int64, filter models.ProductFilter) (map[string]any, error) {
	return m.getProductsFn(ctx, userID, filter)
}
func (m *mockProductService) DeleteProduct(productId int, userId int) error {
	return m.deleteProductFn(productId, userId)
}
func (m *mockProductService) UpdateProduct(p *models.Product, userId int) error {
	return m.updateProductFn(p, userId)
}
func (m *mockProductService) GetDashboardStats(userID int) (*models.DashboardStats, error) {
	return m.getDashboardFn(userID)
}

// --- Helpers ---

func newTestApp(svc *mockProductService) *application {
	return &application{
		logger:         slog.New(slog.NewTextHandler(io.Discard, nil)),
		productService: svc,
	}
}

// injectUser adds userID into request context to simulate authenticated middleware.
func injectUser(r *http.Request, userID int) *http.Request {
	ctx := context.WithValue(r.Context(), userContextKey, userID)
	return r.WithContext(ctx)
}

func decodeBody(t *testing.T, body []byte) map[string]any {
	t.Helper()
	var result map[string]any
	if err := json.Unmarshal(body, &result); err != nil {
		t.Fatalf("impossible de décoder la réponse JSON: %v", err)
	}
	return result
}

// --- createProductHandler ---

func TestCreateProductHandler_InvalidJSON(t *testing.T) {
	app := newTestApp(&mockProductService{})

	req := httptest.NewRequest(http.MethodPost, "/api/create-product", bytes.NewBufferString("not-json"))
	req = injectUser(req, 1)
	w := httptest.NewRecorder()

	app.createProductHandler(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d", w.Code)
	}
}

func TestCreateProductHandler_MissingFields(t *testing.T) {
	app := newTestApp(&mockProductService{})

	body, _ := json.Marshal(map[string]any{"category": "Papeterie"})
	req := httptest.NewRequest(http.MethodPost, "/api/create-product", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = injectUser(req, 1)
	w := httptest.NewRecorder()

	app.createProductHandler(w, req)

	if w.Code != http.StatusUnprocessableEntity {
		t.Errorf("attendu 422, obtenu %d", w.Code)
	}
}

func TestCreateProductHandler_Success(t *testing.T) {
	svc := &mockProductService{
		addProductFn: func(userID int64, name, etiquette, category, status, imageURL string, purchasePrice, sellingPrice float64, stock int) (*models.Product, error) {
			return &models.Product{ID: 10, CreatedAt: time.Now()}, nil
		},
	}
	app := newTestApp(svc)

	body, _ := json.Marshal(map[string]any{
		"product_name": "Stylo",
		"etiquette":    "ETQ-01",
		"image_url":    "http://img.png",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/create-product", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = injectUser(req, 1)
	w := httptest.NewRecorder()

	app.createProductHandler(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("attendu 201, obtenu %d", w.Code)
	}
	result := decodeBody(t, w.Body.Bytes())
	data := result["data"].(map[string]any)
	if data["stockId"].(float64) != 10 {
		t.Errorf("attendu stockId=10, obtenu %v", data["stockId"])
	}
}

// --- getProductsHandler ---

func TestGetProductsHandler_Success(t *testing.T) {
	svc := &mockProductService{
		getProductsFn: func(_ context.Context, _ int64, _ models.ProductFilter) (map[string]any, error) {
			return map[string]any{"products": []models.Product{}, "has_more": false}, nil
		},
	}
	app := newTestApp(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/products", nil)
	req = injectUser(req, 1)
	w := httptest.NewRecorder()

	app.getProductsHandler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("attendu 200, obtenu %d", w.Code)
	}
}

func TestGetProductsHandler_ServiceError(t *testing.T) {
	svc := &mockProductService{
		getProductsFn: func(_ context.Context, _ int64, _ models.ProductFilter) (map[string]any, error) {
			return nil, errors.New("db error")
		},
	}
	app := newTestApp(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/products", nil)
	req = injectUser(req, 1)
	w := httptest.NewRecorder()

	app.getProductsHandler(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("attendu 500, obtenu %d", w.Code)
	}
}

// --- deleteProductHandler ---

func TestDeleteProductHandler_InvalidID(t *testing.T) {
	app := newTestApp(&mockProductService{})

	req := httptest.NewRequest(http.MethodDelete, "/api/products/abc", nil)
	req.SetPathValue("id", "abc")
	req = injectUser(req, 1)
	w := httptest.NewRecorder()

	app.deleteProductHandler(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d", w.Code)
	}
}

func TestDeleteProductHandler_NotFound(t *testing.T) {
	svc := &mockProductService{
		deleteProductFn: func(productId int, userId int) error {
			return repository.ErrProductNotFound
		},
	}
	app := newTestApp(svc)

	req := httptest.NewRequest(http.MethodDelete, "/api/products/99", nil)
	req.SetPathValue("id", "99")
	req = injectUser(req, 1)
	w := httptest.NewRecorder()

	app.deleteProductHandler(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("attendu 500, obtenu %d", w.Code)
	}
}

func TestDeleteProductHandler_Success(t *testing.T) {
	svc := &mockProductService{
		deleteProductFn: func(productId int, userId int) error { return nil },
	}
	app := newTestApp(svc)

	req := httptest.NewRequest(http.MethodDelete, "/api/products/1", nil)
	req.SetPathValue("id", "1")
	req = injectUser(req, 1)
	w := httptest.NewRecorder()

	app.deleteProductHandler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("attendu 200, obtenu %d", w.Code)
	}
}

// --- updateProductHandler ---

func TestUpdateProductHandler_InvalidID(t *testing.T) {
	app := newTestApp(&mockProductService{})

	req := httptest.NewRequest(http.MethodPut, "/api/products/abc", nil)
	req.SetPathValue("id", "abc")
	req = injectUser(req, 1)
	w := httptest.NewRecorder()

	app.updateProductHandler(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("attendu 400, obtenu %d", w.Code)
	}
}

func TestUpdateProductHandler_NotFound(t *testing.T) {
	svc := &mockProductService{
		updateProductFn: func(p *models.Product, userId int) error {
			return repository.ErrProductNotFound
		},
	}
	app := newTestApp(svc)

	body, _ := json.Marshal(map[string]any{"productName": "Cahier"})
	req := httptest.NewRequest(http.MethodPut, "/api/products/99", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.SetPathValue("id", "99")
	req = injectUser(req, 1)
	w := httptest.NewRecorder()

	app.updateProductHandler(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("attendu 404, obtenu %d", w.Code)
	}
}

func TestUpdateProductHandler_Success(t *testing.T) {
	svc := &mockProductService{
		updateProductFn: func(p *models.Product, userId int) error { return nil },
	}
	app := newTestApp(svc)

	body, _ := json.Marshal(map[string]any{"productName": "Cahier", "stock": 10})
	req := httptest.NewRequest(http.MethodPut, "/api/products/1", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.SetPathValue("id", "1")
	req = injectUser(req, 1)
	w := httptest.NewRecorder()

	app.updateProductHandler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("attendu 200, obtenu %d", w.Code)
	}
}

// --- getDashboardStatsHandler ---

func TestGetDashboardStatsHandler_Success(t *testing.T) {
	svc := &mockProductService{
		getDashboardFn: func(userID int) (*models.DashboardStats, error) {
			return &models.DashboardStats{TotalProduits: 5}, nil
		},
	}
	app := newTestApp(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/stats", nil)
	req = injectUser(req, 1)
	w := httptest.NewRecorder()

	app.getDashboardStatsHandler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("attendu 200, obtenu %d", w.Code)
	}
}

func TestGetDashboardStatsHandler_ServiceError(t *testing.T) {
	svc := &mockProductService{
		getDashboardFn: func(userID int) (*models.DashboardStats, error) {
			return nil, errors.New("db error")
		},
	}
	app := newTestApp(svc)

	req := httptest.NewRequest(http.MethodGet, "/api/stats", nil)
	req = injectUser(req, 1)
	w := httptest.NewRecorder()

	app.getDashboardStatsHandler(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("attendu 500, obtenu %d", w.Code)
	}
}