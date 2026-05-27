package repository

import (
	"App-Gestion-Produits/internal/models"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"time"
)

type ProductRepository interface {
	AddProduct(u *models.Product) (int64, time.Time, error)
	GetProductsByUser(ctx context.Context, userID int64, filter models.ProductFilter) ([]models.Product, error)
	DeleteProducts(productId int, userId int) error
	UpdateProduct(p *models.Product, userId int) error
	GetDashboardStats(userID int) (*models.DashboardStats, error)
}

type ProductRepo struct {
	DB                    *sql.DB
	InsertStockStmt       *sql.Stmt
	DeleteProductByIdStmt *sql.Stmt
	UpdateProductStmt     *sql.Stmt
}

func NewProductRepo(db *sql.DB) (*ProductRepo, error) {
	InsertStockStmt, err := db.Prepare("INSERT INTO stock (product_name, etiquette, category, purchase_price, selling_price, stock, status, image_url, user_id )  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, created_at")
	if err != nil {
		return nil, err
	}
	// Dans ton repo, remplace par :
	DeleteProductStmt, err := db.Prepare("DELETE FROM stock WHERE id = $1 AND user_id = $2")
	if err != nil {
		return nil, err
	}
	UpdateProductStmt, err := db.Prepare(`UPDATE stock  SET product_name = $1, etiquette = $2, category = $3, purchase_price = $4, selling_price = $5, stock = $6, status = $7 WHERE id = $8 AND user_id = $9`)
	if err != nil {
		return nil, err
	}
	return &ProductRepo{
		DB:                    db,
		InsertStockStmt:       InsertStockStmt,
		DeleteProductByIdStmt: DeleteProductStmt,
		UpdateProductStmt:     UpdateProductStmt,
	}, nil
}

func (r *ProductRepo) CloseProducts() {
	_ = r.InsertStockStmt.Close()
	_ = r.DeleteProductByIdStmt.Close()
	_ = r.UpdateProductStmt.Close()
}

func (r *ProductRepo) AddProduct(u *models.Product) (int64, time.Time, error) {
	var stockId int64
	var timeCreate time.Time
	err := r.InsertStockStmt.QueryRow(u.ProductName, u.Etiquette, u.Category, u.PurchasePrice, u.SellingPrice, u.Stock, u.Status, u.ImageURL, u.UserID).Scan(&stockId, &timeCreate)
	if err != nil {
		return 0, time.Time{}, err
	}
	u.ID = stockId
	return stockId, timeCreate, nil
}

// GetProductsByUser : repository pour récupérer les donnees :
func (r *ProductRepo) GetProductsByUser(ctx context.Context, userID int64, filter models.ProductFilter) ([]models.Product, error) {
	query := `SELECT id, product_name, etiquette, category, purchase_price, selling_price, 
    stock, status, image_url, user_id, created_at FROM stock  WHERE user_id = $1`

	args := []any{userID}
	paramCount := 2

	if filter.Cursor > 0 {
		query += ` AND id < $` + strconv.Itoa(paramCount)
		args = append(args, filter.Cursor)
		paramCount++
	}

	if filter.Status != "" {
		query += ` AND status = $` + strconv.Itoa(paramCount)
		args = append(args, filter.Status)
		paramCount++
	}

	if filter.Category != "" {
		query += ` AND category = $` + strconv.Itoa(paramCount)
		args = append(args, filter.Category)
		paramCount++
	}

	if filter.Search != "" {
		query += ` AND product_name ILIKE $` + strconv.Itoa(paramCount)
		args = append(args, "%"+filter.Search+"%")
		paramCount++
	}

	query += ` ORDER BY id DESC LIMIT $` + strconv.Itoa(paramCount)
	args = append(args, filter.Limit+1)

	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []models.Product

	for rows.Next() {
		var p models.Product
		if err := rows.Scan(
			&p.ID, &p.ProductName, &p.Etiquette, &p.Category,
			&p.PurchasePrice, &p.SellingPrice, &p.Stock, &p.Status,
			&p.ImageURL, &p.UserID, &p.CreatedAt,
		); err != nil {
			return nil, err
		}
		products = append(products, p)
	}

	return products, rows.Err()

}

// DeleteProducts : repo pour supprimer un produit
func (r *ProductRepo) DeleteProducts(productId int, userId int) error {
	res, err := r.DeleteProductByIdStmt.Exec(productId, userId)
	if err != nil {
		return err
	}

	rowsAffected, _ := res.RowsAffected() //vérifie si une ligne a vraiment été supprimée
	if rowsAffected == 0 {
		return errors.New("aucun produit supprimé (id inexistant ou non autorisé)")
	}

	return nil
}

// UpdateProduct : modifier un produit
func (r *ProductRepo) UpdateProduct(p *models.Product, userId int) error {
	res, err := r.UpdateProductStmt.Exec(p.ProductName, p.Etiquette, p.Category, p.PurchasePrice, p.SellingPrice, p.Stock, p.Status, p.ID, userId)
	if err != nil {
		return err
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return errors.New("aucune modification effectuée (produit introuvable ou accès refusé)")
	}
	return nil
}

func (r *ProductRepo) GetDashboardStats(userID int) (*models.DashboardStats, error) {
	query := `
		SELECT 
			COUNT(*) as total_produits,
			COALESCE(SUM(stock), 0) as total_stock,
			COALESCE(SUM(purchase_price * stock), 0) as depenses_estimees,
			COALESCE(SUM(selling_price * stock), 0) as revenus_estimes,
			COUNT(*) FILTER (WHERE status = 'En Stock') as en_stock,
			COUNT(*) FILTER (WHERE status = 'Rupture') as en_rupture
		FROM stock 
		WHERE user_id = $1
	`

	stats := &models.DashboardStats{}

	err := r.DB.QueryRow(query, userID).Scan(
		&stats.TotalProduits,
		&stats.TotalStock,
		&stats.DepensesEstimees,
		&stats.RevenusEstimes,
		&stats.EnStock,
		&stats.EnRupture,
	)

	if err != nil {
		return nil, fmt.Errorf("erreur GetDashboardStats: %w", err)
	}

	return stats, nil
}
