package main

import (
	"App-Gestion-Produits/internal/models"
	"App-Gestion-Produits/internal/validator"
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"strconv"

	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

// UploadImage : handler qui gère l'image du stock :
func (app *application) UploadImage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if app.Cloudinary == nil {
		http.Error(w, "Cloudinary non configuré", http.StatusInternalServerError)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 5<<20) // 5MB

	if err := r.ParseMultipartForm(5 << 20); err != nil {
		http.Error(w, "Fichier trop volumineux", http.StatusBadRequest)
		return
	}

	file, _, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "Image requise", http.StatusBadRequest)
		return
	}
	defer file.Close()

	buffer := make([]byte, 512)
	_, err = file.Read(buffer)
	if err != nil {
		http.Error(w, "Erreur lecture fichier", http.StatusBadRequest)
		return
	}

	fileType := http.DetectContentType(buffer)
	if fileType != "image/jpeg" && fileType != "image/png" {
		if err := app.sendError(w, http.StatusBadRequest, "format non supporté"); err != nil {
			app.serverError(w, r, err)
		}
		return
	}

	file.Seek(0, 0)

	ctx := context.Background()
	uploadResult, err := app.Cloudinary.Upload.Upload(ctx, file, uploader.UploadParams{
		Folder:         "storepro/products",
		Transformation: "w_800,h_800,c_fill",
	})
	if err != nil {
		app.serverError(w, r, err)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"url": uploadResult.SecureURL,
	})
}

// handler pour ajouter un stock :
func (app *application) createProductHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		ProductName   string  `json:"product_name"`
		Etiquette     string  `json:"etiquette"`
		Category      string  `json:"category"`
		Status        string  `json:"status"`
		PurchasePrice float64 `json:"purchase_price"`
		SellingPrice  float64 `json:"selling_price"`
		Stock         int     `json:"stock"`
		ImageURL      string  `json:"image_url"` // ← Juste l'URL !
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		if err := app.sendError(w, http.StatusUnauthorized, "json invalide"); err != nil {
			app.serverError(w, r, err)
		}
		return
	}
	// ✅ Validation simple
	v := url.Values{}
	v.Add("product_name", input.ProductName)
	v.Add("sku", input.Etiquette)
	v.Add("image_url", input.ImageURL)

	form := validator.NewForm(v)
	form.Required("product_name", "sku", "image_url")

	if !form.Valid() {
		if err := app.sendFieldErrors(w, form.Errors); err != nil {
			app.serverError(w, r, err)
		}
		return
	}

	userId, ok := r.Context().Value(userContextKey).(int)
	if !ok {
		if err := app.sendError(w, http.StatusUnauthorized, "non autorisé"); err != nil {
			app.serverError(w, r, err)
		}
		return
	}

	// ✅ Stocke simplement en DB
	product := &models.Product{
		ProductName:   input.ProductName,
		Etiquette:     input.Etiquette,
		Category:      input.Category,
		Status:        input.Status,
		PurchasePrice: input.PurchasePrice,
		SellingPrice:  input.SellingPrice,
		Stock:         input.Stock,
		ImageURL:      input.ImageURL, // ← C'est tout !
		UserID:        int64(userId),
	}

	product, err := app.productService.AddProduct(int64(userId), input.ProductName, input.Etiquette, input.Category, input.Status, input.ImageURL, input.PurchasePrice, input.SellingPrice, input.Stock)
	if err != nil {
		app.serverError(w, r, err)
		return
	}

	if err := app.sendJSON(w, http.StatusCreated, map[string]any{
		"message": "Votre produit a été ajouté avec succès",
		"time":    product.CreatedAt,
		"stockId": product.ID,
	}); err != nil {
		app.serverError(w, r, err)
	}
}

// handler pour récupérer les stock :
func (app *application) getProductsHandler(w http.ResponseWriter, r *http.Request) {

	userID := r.Context().Value(userContextKey).(int)

	limit := getIntQuery(r, "limit", 20)
	cursor := getIntQuery(r, "cursor", 0)
	status := r.URL.Query().Get("status")
	category := r.URL.Query().Get("category")
	search := r.URL.Query().Get("search")

	results, err := app.productService.GetProductsByUser(r.Context(), int64(userID), limit, cursor, status, category, search)
	if err != nil {
		app.serverError(w, r, err)
		return
	}

	if err := app.sendJSON(w, http.StatusOK, map[string]any{
		"message": "Produit récupéré avec succès",
		"data":    results,
	}); err != nil {
		app.serverError(w, r, err)
	}
}

// handler pour supprimer :
func (app *application) deleteProductHandler(w http.ResponseWriter, r *http.Request) {
	idParam := r.PathValue("id")
	id, err := strconv.Atoi(idParam)
	if err != nil || id < 1 {
		app.sendError(w, http.StatusBadRequest, "ID de produit invalide")
		return
	}

	userID, ok := r.Context().Value(userContextKey).(int)
	if !ok {
		app.sendError(w, http.StatusUnauthorized, "Utilisateur non authentifié")
		return
	}

	// 3. Appel au service que tu as déjà créé
	err = app.productService.DeleteProduct(id, userID)
	if err != nil {
		app.serverError(w, r, err)
		return
	}

	// 4. Réponse de succès avec ton format standard JSONResponse
	if err := app.sendJSON(w, http.StatusOK, map[string]any{
		"message": "Produit supprimé avec succès",
	}); err != nil {
		app.serverError(w, r, err)
	}
}

func (app *application) updateProductHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Récupérer l'ID dans l'URL
	idParam := r.PathValue("id")
	id, err := strconv.Atoi(idParam)
	if err != nil || id < 1 {
		app.sendError(w, http.StatusBadRequest, "ID de produit invalide")
		return
	}

	var input struct {
		ProductName   string  `json:"productName"`
		Etiquette     string  `json:"etiquette"`
		Category      string  `json:"category"`
		PurchasePrice float64 `json:"purchasePrice"`
		SellingPrice  float64 `json:"sellingPrice"`
		Stock         int     `json:"stock"`
		Status        string  `json:"status"`
	}

	err = json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		app.sendError(w, http.StatusBadRequest, "Format de données invalide")
		return
	}

	// 3. Récupérer l'utilisateur (via ton middleware Alice)
	userID, ok := r.Context().Value(userContextKey).(int)
	if !ok {
		app.sendError(w, http.StatusUnauthorized, "Utilisateur non authentifié")
		return
	}

	product := &models.Product{
		ID:            int64(id),
		ProductName:   input.ProductName,
		Etiquette:     input.Etiquette,
		Category:      input.Category,
		PurchasePrice: input.PurchasePrice,
		SellingPrice:  input.SellingPrice,
		Stock:         input.Stock,
		Status:        input.Status,
	}

	err = app.productService.UpdateProduct(product, userID)
	if err != nil {
		if err.Error() == "aucune modification effectuée (produit introuvable ou accès refusé)" {
			app.sendError(w, http.StatusNotFound, "Produit introuvable ou vous n'avez pas les droits")
			return
		}
		app.serverError(w, r, err)
		return
	}

	// 6. Réponse de succès
	if err := app.sendJSON(w, http.StatusOK, map[string]any{
		"message": "Produit mis à jour avec succès",
	}); err != nil {
		app.serverError(w, r, err)
	}
}

func (app *application) getDashboardStatsHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(userContextKey).(int)
	if !ok {
		app.sendError(w, http.StatusUnauthorized, "Non autorisé")
		return
	}

	stats, err := app.productService.GetDashboardStats(userID)
	if err != nil {
		app.serverError(w, r, err)
		return
	}

	if err := app.sendJSON(w, http.StatusOK, map[string]any{
		"message": "stats récupérer avec succès",
		"data":    stats,
	}); err != nil {
		app.serverError(w, r, err)
	}
}
