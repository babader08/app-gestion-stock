package main

import (
	"encoding/json"
	"net/http"
	"runtime/debug"
	"strconv"
)

// JSONResponse est la structure standard pour toutes les réponses API
type JSONResponse struct {
	Data   any    `json:"data,omitempty"`
	Error  string `json:"error,omitempty"`
	Status int    `json:"status"`
}

// serverError logs les erreurs serveur sans les exposer au client
func (app *application) serverError(w http.ResponseWriter, r *http.Request, err error) {
	var (
		method = r.Method
		uri    = r.URL.RequestURI()
		trace  = string(debug.Stack())
	)
	app.logger.Error("server error",
		"method", method,
		"uri", uri,
		"error", err.Error(),
		"trace", trace,
	)
	http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
}

// sendJSON envoie une réponse JSON au client
func (app *application) sendJSON(w http.ResponseWriter, status int, data any) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	response := JSONResponse{
		Data:   data,
		Status: status,
	}

	return json.NewEncoder(w).Encode(response)
}

// sendError envoie une erreur JSON au client
func (app *application) sendError(w http.ResponseWriter, status int, message string) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	response := JSONResponse{
		Error:  message,
		Status: status,
	}

	return json.NewEncoder(w).Encode(response)
}

// sendFieldErrors envoie les erreurs de validation au client
func (app *application) sendFieldErrors(w http.ResponseWriter, errors map[string][]string) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnprocessableEntity)

	response := JSONResponse{
		Data:   errors,
		Status: http.StatusUnprocessableEntity,
	}

	return json.NewEncoder(w).Encode(response)
}

func getIntQuery(r *http.Request, key string, defaultVal int) int {
	val := r.URL.Query().Get(key)
	if val == "" {
		return defaultVal
	}
	i, err := strconv.Atoi(val)
	if err != nil {
		return defaultVal
	}
	return i
}
