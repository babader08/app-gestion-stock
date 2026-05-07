package main

import "net/http"

func (app *application) meHandler(w http.ResponseWriter, r *http.Request) {
	// On récupère l'ID déjà présent dans le contexte grâce à ton middleware
	userID, ok := r.Context().Value(userContextKey).(int)
	if !ok {
		app.sendError(w, http.StatusUnauthorized, "Non autorisé")
		return
	}

	user, err := app.userService.GetUserByID(userID)
	if err != nil {
		app.sendError(w, http.StatusInternalServerError, "Erreur serveur")
		return
	}

	if err := app.sendJSON(w, http.StatusOK, map[string]any{
		"message": "info user récupérer avec succès",
		"data":    user,
	}); err != nil {
		app.serverError(w, r, err)
	}
}
