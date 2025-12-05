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

func calcRecommendedCooling(price float64, settings Settings) int {
	for _, r := range settings.Cooldowns {
		if price >= r.Min && price <= r.Max {
			return r.Period
		}
	}
	return 7 // дефолт
}

// Wishes

func GetWishesHandler(storage *Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId := mux.Vars(r)["userId"]
		wishes := storage.GetWishes(userId)

		json.NewEncoder(w).Encode(wishes)
	}
}

func AddWishHandler(storage *Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId := mux.Vars(r)["userId"]

		var body struct {
			Title    string  `json:"title"`
			Price    float64 `json:"price"`
			Category string  `json:"category"`
		}
		json.NewDecoder(r.Body).Decode(&body)

		settings := storage.GetSettings(userId)

		wish := Wish{
			ID:                 generateUID(),
			Title:              body.Title,
			Price:              body.Price,
			Category:           body.Category,
			CoolingDays:        0,
			RecommendedCooling: calcRecommendedCooling(body.Price, settings),
			StillWant:          true,
			CreatedAt:          time.Now(),
		}

		storage.AddWish(userId, wish)
		json.NewEncoder(w).Encode(wish)
	}
}

func ToggleWishHandler(storage *Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId := mux.Vars(r)["userId"]
		wishId := mux.Vars(r)["wishId"]

		storage.ToggleStillWant(userId, wishId)
		w.WriteHeader(http.StatusOK)
	}
}

func RemoveWishHandler(storage *Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId := mux.Vars(r)["userId"]
		wishId := mux.Vars(r)["wishId"]

		storage.RemoveWish(userId, wishId)
		w.WriteHeader(http.StatusOK)
	}
}

// Settings

func GetSettingsHandler(storage *Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId := mux.Vars(r)["userId"]
		json.NewEncoder(w).Encode(storage.GetSettings(userId))
	}
}

func SaveSettingsHandler(storage *Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId := mux.Vars(r)["userId"]

		var set Settings
		json.NewDecoder(r.Body).Decode(&set)

		storage.SaveSettings(userId, set)

		log.Println("[Settings] Saved:", set)
		w.WriteHeader(http.StatusOK)
	}
}
