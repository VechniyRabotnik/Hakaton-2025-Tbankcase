package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
)

func generateUID() string {
	return strconv.FormatInt(time.Now().UnixNano(), 36) + strconv.Itoa(rand.Intn(1000))
}

func GetWishesHandler(storage *Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId := mux.Vars(r)["userId"]
		log.Printf("[Handler] GET wishes for user %s\n", userId)
		wishes := storage.GetWishes(userId)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(wishes)
	}
}

func AddWishHandler(storage *Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId := mux.Vars(r)["userId"]
		log.Printf("[Handler] POST wish for user %s\n", userId)

		var req struct {
			Title    string  `json:"title"`
			Price    float64 `json:"price"`
			Category string  `json:"category"`
			Savings  float64 `json:"savings"`
			PerMonth float64 `json:"perMonth"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		baseCooling := 3
		recommended := baseCooling
		if req.PerMonth > 0 && req.Savings < req.Price {
			days := int(((req.Price - req.Savings) / req.PerMonth) * 30)
			recommended += days
		}

		wish := Wish{
			ID:                 generateUID(),
			Title:              req.Title,
			Price:              req.Price,
			Category:           req.Category,
			CoolingDays:        baseCooling,
			RecommendedCooling: recommended,
			StillWant:          true,
			CreatedAt:          time.Now(),
		}

		storage.AddWish(userId, wish)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(wish)
	}
}

func ToggleWishHandler(storage *Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		userId := vars["userId"]
		wishId := vars["wishId"]
		log.Printf("[Handler] PUT toggle wish %s for user %s\n", wishId, userId)

		storage.ToggleStillWant(userId, wishId)
		w.WriteHeader(http.StatusOK)
	}
}

func RemoveWishHandler(storage *Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		userId := vars["userId"]
		wishId := vars["wishId"]
		log.Printf("[Handler] DELETE wish %s for user %s\n", wishId, userId)

		storage.RemoveWish(userId, wishId)
		w.WriteHeader(http.StatusOK)
	}
}
