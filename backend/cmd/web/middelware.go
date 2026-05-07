package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type responseWriter struct {
	statusCode int
	http.ResponseWriter
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

type contextKey string

const userContextKey contextKey = "userID"

// Logger : Ce middleware sert à afficher chaque requête du client qui arrive sur ton serveur.
func (app *application) Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		start := time.Now()

		rw := &responseWriter{http.StatusOK, w}

		next.ServeHTTP(rw, r) // next.ServeHTTP(w, r) est le "bouton Suivant" qui permet à la requête de passer au middleware d'après (ou à la page finale).

		duration := time.Since(start)

		app.logger.Info("request processed",
			"remote_addr", r.RemoteAddr,
			"status_code", rw.statusCode,
			"duration", duration.String(),
			"method", r.Method,
			"uri", r.URL.RequestURI(),
		)
	})
}

// RecoverPanic : cette fonction permet d'éviter la crashe du site quand il y a une erreur de panic :
func (app *application) RecoverPanic(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				w.Header().Set("Connection", "close")
				app.serverError(w, r, fmt.Errorf("%s", err))
			}
		}()

		next.ServeHTTP(w, r)
	})
}

// EnableCORS : cette fonction de middleware CORS permet faire la liaison entre deux ports localhost different.
func (app *application) EnableCORS(next http.Handler) http.Handler {
	allowedOrigins := map[string]bool{
		"http://localhost:5173":                     true,
		"http://localhost:5174":                     true,
		"https://app-gestion-stock-opal.vercel.app": true,
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		if allowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}

		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Middleware pour verifier si l'user est connectée, si le token, le cookie et tout sont valides.
func (app *application) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. ce code permet de lire le cookie
		cookie, err := r.Cookie("auth_token")
		if err != nil {
			if err := app.sendError(w, http.StatusUnauthorized, "authentification requise"); err != nil {
				app.serverError(w, r, err)
			}
			return
		}

		// 2. ce code permet de verifier si le token est valide ou pas.
		parsedToken, err := jwt.Parse(cookie.Value, func(t *jwt.Token) (any, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("méthode de signature invalide")
			}
			return []byte(os.Getenv("JWT_SECRET")), nil
		})
		if err != nil || !parsedToken.Valid {
			if err := app.sendError(w, http.StatusUnauthorized, "token invalide ou expiré"); err != nil {
				app.serverError(w, r, err)
			}
			return
		}

		// 3. On extraire ici le userID
		claims, ok := parsedToken.Claims.(jwt.MapClaims)
		if !ok {
			if err := app.sendError(w, http.StatusUnauthorized, "token invalide"); err != nil {
				app.serverError(w, r, err)
			}
			return
		}
		userID := int(claims["user_id"].(float64))

		// 4. On ajoute le userId de l'user dans le contexte
		ctx := context.WithValue(r.Context(), userContextKey, userID)
		r = r.WithContext(ctx)

		w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
		next.ServeHTTP(w, r)
	})
}
