package main

import "github.com/gorilla/mux"

func NewRouter(storage *Storage) *mux.Router {
	r := mux.NewRouter()

	api := r.PathPrefix("/api").Subrouter()

	// wishes
	api.HandleFunc("/wishes/{userId}", GetWishesHandler(storage)).Methods("GET")
	api.HandleFunc("/wishes/{userId}", AddWishHandler(storage)).Methods("POST")
	api.HandleFunc("/wishes/{userId}/{wishId}", ToggleWishHandler(storage)).Methods("PUT")
	api.HandleFunc("/wishes/{userId}/{wishId}", RemoveWishHandler(storage)).Methods("DELETE")

	// settings
	api.HandleFunc("/settings/{userId}", GetSettingsHandler(storage)).Methods("GET")
	api.HandleFunc("/settings/{userId}", SaveSettingsHandler(storage)).Methods("POST")

	return r
}
