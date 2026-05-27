package service

import (
	"App-Gestion-Produits/internal/models"
	"context"
	"io"
	"log/slog"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// --- Mock ProductRepository ---

type mockProductRepo struct {
	addProductFn     func(*models.Product) (int64, time.Time, error)
	getProductsFn    func(ctx context.Context, userID int64, filter models.ProductFilter) ([]models.Product, error)
	deleteProductsFn func(productId int, userId int) error
	updateProductFn  func(p *models.Product, userId int) error
	getDashboardFn   func(userID int) (*models.DashboardStats, error)
}

func (m *mockProductRepo) AddProduct(p *models.Product) (int64, time.Time, error) {
	return m.addProductFn(p)
}
func (m *mockProductRepo) GetProductsByUser(ctx context.Context, userID int64, filter models.ProductFilter) ([]models.Product, error) {
	return m.getProductsFn(ctx, userID, filter)
}
func (m *mockProductRepo) DeleteProducts(productId int, userId int) error {
	return m.deleteProductsFn(productId, userId)
}
func (m *mockProductRepo) UpdateProduct(p *models.Product, userId int) error {
	return m.updateProductFn(p, userId)
}
func (m *mockProductRepo) GetDashboardStats(userID int) (*models.DashboardStats, error) {
	return m.getDashboardFn(userID)
}

// --- Mock AuthRepository ---

type mockAuthRepo struct {
	createUserWithOTPFn        func(ctx context.Context, u *models.User, code string, expiry time.Time) (int64, error)
	getByEmailFn               func(email string) (*models.User, error)
	activateUserFn             func(userID int) error
	getUserIDByTokenFn         func(tokenHash []byte, scope string) (int, error)
	insertTokenFn              func(userID int, token string, expiry time.Time, scope string) error
	deleteTokensFn             func(tokenHash []byte, scope string) error
	updatePasswordFn           func(userId int, newPassword []byte) error
	deleteTokensByUserAndScope func(userID int, scope string) error
	emailExistsFn              func(email string) (bool, error)
}

func (m *mockAuthRepo) CreateUserWithOTP(ctx context.Context, u *models.User, code string, expiry time.Time) (int64, error) {
	return m.createUserWithOTPFn(ctx, u, code, expiry)
}
func (m *mockAuthRepo) GetByEmail(email string) (*models.User, error) {
	return m.getByEmailFn(email)
}
func (m *mockAuthRepo) ActivateUser(userID int) error {
	return m.activateUserFn(userID)
}
func (m *mockAuthRepo) GetUserIDByToken(tokenHash []byte, scope string) (int, error) {
	return m.getUserIDByTokenFn(tokenHash, scope)
}
func (m *mockAuthRepo) InsertToken(userID int, token string, expiry time.Time, scope string) error {
	return m.insertTokenFn(userID, token, expiry, scope)
}
func (m *mockAuthRepo) DeleteTokens(tokenHash []byte, scope string) error {
	return m.deleteTokensFn(tokenHash, scope)
}
func (m *mockAuthRepo) UpdatePassword(userId int, newPassword []byte) error {
	return m.updatePasswordFn(userId, newPassword)
}
func (m *mockAuthRepo) DeleteTokensByUserAndScope(userID int, scope string) error {
	return m.deleteTokensByUserAndScope(userID, scope)
}
func (m *mockAuthRepo) EmailExists(email string) (bool, error) {
	if m.emailExistsFn != nil {
		return m.emailExistsFn(email)
	}
	return false, nil
}

// --- Mock Mailer ---

type mockMailer struct {
	sendFn func(to, template string, data map[string]any) error
}

func (m *mockMailer) Send(to, template string, data map[string]any) error {
	if m.sendFn != nil {
		return m.sendFn(to, template, data)
	}
	return nil
}

// --- Helpers ---

func newTestProductService(repo *mockProductRepo) *ProductService {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	return NewProductService(logger, repo)
}

func newTestAuthService(repo *mockAuthRepo, mailer *mockMailer) *AuthService {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	return NewAuthService(repo, mailer, logger)
}

func hashPassword(t *testing.T, password string) []byte {
	t.Helper()
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.MinCost)
	if err != nil {
		t.Fatal(err)
	}
	return hash
}