package main

import "github.com/gorilla/mux"

func NewRouter(storage *Storage) *mux.Router {
	r := mux.NewRouter()

	api := r.PathPrefix("/api/wishes").Subrouter()
	api.HandleFunc("/{userId}", GetWishesHandler(storage)).Methods("GET")
	api.HandleFunc("/{userId}", AddWishHandler(storage)).Methods("POST")
	api.HandleFunc("/{userId}/{wishId}", ToggleWishHandler(storage)).Methods("PUT")
	api.HandleFunc("/{userId}/{wishId}", RemoveWishHandler(storage)).Methods("DELETE")

	return r
}
