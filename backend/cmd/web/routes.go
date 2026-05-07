package main

import (
	"net/http"
	"time"

	"github.com/justinas/alice"
)

func (app *application) Server() error {
	server := http.Server{
		Addr:         ":7860",
		Handler:      app.routes(),
		ReadTimeout:  2 * time.Second,   // Temps max pour lire toute la requête (corps inclus)
		WriteTimeout: 10 * time.Second,  // Temps max pour envoyer la réponse au client
		IdleTimeout:  120 * time.Second, // Temps max pour garder une connexion inactive avant de la fermer (Performance ++)
	}

	return server.ListenAndServe()
}

func (app *application) routes() http.Handler {
	mux := http.NewServeMux()

	standard := alice.New(app.RecoverPanic, app.Logger, app.EnableCORS)
	dynamic := standard
	protected := dynamic.Append(app.requireAuth)

	// Routes publiques :
	mux.Handle("POST /api/register", dynamic.ThenFunc(app.registerHandler))
	mux.Handle("POST /api/verify", dynamic.ThenFunc(app.verifyOTPHandler))
	mux.Handle("POST /api/login", dynamic.ThenFunc(app.loginUserHandler))
	mux.Handle("POST /api/password-reset-request", dynamic.ThenFunc(app.requestPasswordResetHandler))
	mux.Handle("POST /api/password-reset", dynamic.ThenFunc(app.resetPasswordHandler))
	mux.Handle("POST /api/resend-otp", dynamic.ThenFunc(app.resendOTPHandler))
	mux.Handle("POST /api/refresh", dynamic.ThenFunc(app.refreshHandler))
	mux.Handle("/api/upload", dynamic.ThenFunc(app.UploadImage))

	// Routes protégées :
	mux.Handle("GET /api/check-auth", protected.ThenFunc(app.checkAuthHandler))
	mux.Handle("POST /api/logout", protected.ThenFunc(app.logoutUserHandler))
	mux.Handle("POST /api/create-product", protected.ThenFunc(app.createProductHandler))
	mux.Handle("GET /api/products", protected.ThenFunc(app.getProductsHandler))
	mux.Handle("DELETE /api/products/{id}", protected.ThenFunc(app.deleteProductHandler))
	mux.Handle("PUT /api/products/{id}", protected.ThenFunc(app.updateProductHandler))
	mux.Handle("GET /api/stats", protected.ThenFunc(app.getDashboardStatsHandler))
	mux.Handle("GET /api/user", protected.ThenFunc(app.meHandler))

	return standard.Then(mux)
}
