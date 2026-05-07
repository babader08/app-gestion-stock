package models

import "time"

type User struct {
	ID             int       `json:"id"`
	Name           string    `json:"name"`
	Email          string    `json:"email"`
	HashedPassword []byte    `json:"-"`         // Le "-" cache le mot de passe dans le JSON envoyé à React
	Activated      bool      `json:"activated"` // Ajoute cette ligne
	Created        time.Time `json:"created"`
}

type Profile struct {
	UserID    int       `json:"user_id"`
	Avatar    string    `json:"avatar"`
	CreatedAt time.Time `json:"created"`
}

type Product struct {
	ID            int64     `json:"id"`
	UserID        int64     `json:"userId"` // Clé étrangère
	ProductName   string    `json:"productName"`
	Etiquette     string    `json:"etiquette"`
	Category      string    `json:"category"`
	PurchasePrice float64   `json:"purchasePrice"`
	SellingPrice  float64   `json:"SellingPrice"`
	Stock         int       `json:"stock"`
	Status        string    `json:"status"`
	ImageURL      string    `json:"imageUrl"`
	CreatedAt     time.Time `json:"createdAt"`
}

type GetProductsRequest struct {
	UserID   int `json:"-"`
	Limit    int `cursor:"limit"`
	Cursor   int `cursor:"cursor"`
	Status   int `query:"status"`
	Category int `query:"category"`
	Search   int `query:"search"`
}

type ProductsResponse struct {
	Products   []Product `json:"products"`
	NextCursor int       `json:"next_cursor"` // ← ID du prochain curseur
	HasMore    bool      `json:"has_more"`
}

type DashboardStats struct {
	TotalProduits    int     `json:"total_produits"`
	TotalStock       int     `json:"total_stock"`
	DepensesEstimees float64 `json:"depenses_estimees"`
	RevenusEstimes   float64 `json:"revenus_estimes"`
	EnStock          int     `json:"en_stock"`
	EnRupture        int     `json:"en_rupture"`
}
