// cmd/web/auth_handler.go
package main

import (
	"App-Gestion-Produits/internal/validator"
	"encoding/json"
	"net/http"
	"net/url"
)

// 1️⃣ REGISTER
func (app *application) registerHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		if err := app.sendError(w, http.StatusUnauthorized, "json invalide"); err != nil {
			app.serverError(w, r, err)
		}
		return
	}

	// Validation
	v := url.Values{}
	v.Add("name", input.Name)
	v.Add("email", input.Email)
	v.Add("password", input.Password)

	form := validator.NewForm(v)
	form.Required("name", "email", "password").
		MaxLength("name", 100).
		ValidEmail("email").
		MinLength("password", 8)

	if !form.Valid() {
		if err := app.sendFieldErrors(w, form.Errors); err != nil {
			app.serverError(w, r, err)
		}
		return
	}

	// Vérifier email existe déjà
	exist, err := app.repo.EmailExists(input.Email)
	if err != nil {
		app.serverError(w, r, err)
		return
	}
	if exist {
		form.Errors.Add("email", "cet email est déjà utilisé")
		if err := app.sendFieldErrors(w, form.Errors); err != nil {
			app.serverError(w, r, err)
		}
		return
	}

	// ✨ Appeler le service
	userId, err := app.authService.RegisterUser(r.Context(), input.Name, input.Email, input.Password)
	if err != nil {
		app.serverError(w, r, err)
		return
	}

	if err := app.sendJSON(w, http.StatusCreated, map[string]any{
		"message": "Compte créé. Veuillez saisir le code reçu par email.",
		"userId":  userId, // ← int peut passer maintenant
	}); err != nil {
		app.serverError(w, r, err)
	}
}

// 2️⃣ VERIFY OTP (activation)
func (app *application) verifyOTPHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Code string `json:"code"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		if err := app.sendError(w, http.StatusBadRequest, "json invalide"); err != nil {
			app.serverError(w, r, err)
		}
		return
	}

	// ✨ Appeler le service
	if err := app.authService.ActivateUserWithCode(r.Context(), input.Code); err != nil {
		if err := app.sendError(w, http.StatusUnauthorized, "Code incorrect ou expiré"); err != nil {
			app.serverError(w, r, err)
		}
		return
	}

	if err := app.sendJSON(w, http.StatusOK, map[string]string{
		"message": "Compte activé ! Vous pouvez maintenant vous connecter.",
	}); err != nil {
		app.serverError(w, r, err)
	}
}

// 3️⃣ LOGIN
func (app *application) loginUserHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		if err := app.sendError(w, http.StatusBadRequest, "json invalide"); err != nil {
			app.serverError(w, r, err)
		}
		return
	}

	// Validation
	v := url.Values{}
	v.Add("email", input.Email)
	v.Add("password", input.Password)

	form := validator.NewForm(v)
	form.Required("email", "password").ValidEmail("email")

	if !form.Valid() {
		if err := app.sendFieldErrors(w, form.Errors); err != nil {
			app.serverError(w, r, err)
		}
		return
	}

	// ✨ Appeler le service — maintenant 3 valeurs retournées
	accessToken, refreshToken, err := app.authService.LoginUser(r.Context(), input.Email, input.Password)
	if err != nil {
		if err := app.sendError(w, http.StatusBadRequest, "Email ou mot de passe incorrect"); err != nil {
			app.serverError(w, r, err)
		}
		return
	}

	// Cookie access token : 15 minutes
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    accessToken,
		HttpOnly: true,
		Secure:   true, // true en production
		SameSite: http.SameSiteNoneMode,
		Path:     "/",
		MaxAge:   15 * 60, // 15 minutes
	})

	// Cookie refresh token : 30 jours
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HttpOnly: true,
		Secure:   true, // true en production
		SameSite: http.SameSiteNoneMode,
		Path:     "/",
		MaxAge:   30 * 24 * 60 * 60, // 30 jours
	})

	if err := app.sendJSON(w, http.StatusOK, map[string]string{"message": "Connecté"}); err != nil {
		app.serverError(w, r, err)
	}
}

// 4️⃣ REQUEST PASSWORD RESET
func (app *application) requestPasswordResetHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email string `json:"email"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		if err := app.sendError(w, http.StatusBadRequest, "json invalide"); err != nil {
			app.serverError(w, r, err)
		}
		return
	}

	// ✨ Appeler le service (même si email n'existe pas, on retourne le même message)
	_ = app.authService.RequestPasswordReset(r.Context(), input.Email)

	if err := app.sendJSON(w, http.StatusOK, map[string]string{
		"message": "Si l'email existe, un code a été envoyé.",
	}); err != nil {
		app.serverError(w, r, err)
	}
}

// 5️⃣ RESET PASSWORD
func (app *application) resetPasswordHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Code        string `json:"code"`
		NewPassword string `json:"newPassword"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		if err := app.sendError(w, http.StatusBadRequest, "json invalide"); err != nil {
			app.serverError(w, r, err)
		}
		return
	}

	// Validation
	v := url.Values{}
	v.Add("new_password", input.NewPassword)

	form := validator.NewForm(v)
	form.Required("new_password").MinLength("new_password", 8)

	if !form.Valid() {
		if err := app.sendFieldErrors(w, form.Errors); err != nil {
			app.serverError(w, r, err)
		}
		return
	}

	// ✨ Appeler le service
	if err := app.authService.ResetPassword(r.Context(), input.Code, input.NewPassword); err != nil {
		if err := app.sendError(w, http.StatusBadRequest, "Code incorrect ou expiré"); err != nil {
			app.serverError(w, r, err)
		}
		return
	}

	if err := app.sendJSON(w, http.StatusOK, map[string]string{
		"message": "Mot de passe modifié avec succès",
	}); err != nil {
		app.serverError(w, r, err)
	}
}

// 7️⃣ CHECK AUTH
func (app *application) checkAuthHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userContextKey).(int)

	if err := app.sendJSON(w, http.StatusOK, map[string]any{
		"authenticated": true,
		"userID":        userID,
	}); err != nil {
		app.serverError(w, r, err)
	}
}

// 9️⃣ RESEND OTP
func (app *application) resendOTPHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email string `json:"email"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		if err := app.sendError(w, http.StatusBadRequest, "json invalide"); err != nil {
			app.serverError(w, r, err)
		}
		return
	}

	// ✨ Appelle le SERVICE (pas le repo directement) :
	if err := app.authService.ResendOTP(r.Context(), input.Email); err != nil {
		if err := app.sendJSON(w, http.StatusOK, map[string]string{
			"message": "Si l'email existe, un code a été envoyé.",
		}); err != nil {
			app.serverError(w, r, err)
		}
		return
	}

	if err := app.sendJSON(w, http.StatusOK, map[string]string{
		"message": "Code d'activation renvoyé",
	}); err != nil {
		app.serverError(w, r, err)
	}
}

// 🔄 REFRESH — nouvelle route MODIFIÉE
func (app *application) refreshHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Lire le refresh token depuis le cookie
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		if err := app.sendError(w, http.StatusUnauthorized, "refresh token manquant"); err != nil {
			app.serverError(w, r, err)
		}
		return
	}

	// 2. Appelle le service (retourne maintenant 2 tokens)
	newAccessToken, newRefreshToken, err := app.authService.RefreshAccessToken(r.Context(), cookie.Value)
	if err != nil {
		if err := app.sendError(w, http.StatusUnauthorized, "refresh token invalide ou expiré"); err != nil {
			app.serverError(w, r, err)
		}
		return
	}

	// 3. ✅ Envoie le nouvel ACCESS TOKEN en Cookie (15 min)
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    newAccessToken,
		HttpOnly: true,
		Secure:   true, // true en production
		SameSite: http.SameSiteNoneMode,
		Path:     "/",
		MaxAge:   15 * 60, // 15 minutes
	})

	// 4. ✅ Envoie le nouveau REFRESH TOKEN en Cookie (30 jours)
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    newRefreshToken,
		HttpOnly: true,
		Secure:   true, // true en production
		SameSite: http.SameSiteNoneMode,
		Path:     "/",
		MaxAge:   30 * 24 * 60 * 60, // 30 jours
	})

	if err := app.sendJSON(w, http.StatusOK, map[string]string{"message": "Token rafraîchi"}); err != nil {
		app.serverError(w, r, err)
	}
}

// 6️⃣ LOGOUT — supprimer les 2 cookies
func (app *application) logoutUserHandler(w http.ResponseWriter, r *http.Request) {
	// Récupérer le refresh token pour le supprimer en DB
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		if err := app.sendError(w, http.StatusUnauthorized, "Pas de section active"); err != nil {
			app.serverError(w, r, err)
		}
		return
	}

	// Supprimer les 2 cookies côté navigateur
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
		Path:     "/",
		MaxAge:   -1,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
		Path:     "/",
		MaxAge:   -1,
	})

	// Supprimer le refresh token en DB
	if err := app.authService.LogoutUser(r.Context(), cookie.Value); err != nil {
		app.serverError(w, r, err)
		return
	}

	if err := app.sendJSON(w, http.StatusOK, map[string]string{
		"message": "Déconnexion réussie",
	}); err != nil {
		app.serverError(w, r, err)
	}
}
