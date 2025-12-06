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

// generateUID генерирует уникальный идентификатор
func generateUID() string {
	return strconv.FormatInt(time.Now().UnixNano(), 36) + strconv.Itoa(rand.Intn(1000))
}

// calcRecommendedCooling рассчитывает рекомендуемый период охлаждения
func calcRecommendedCooling(price float64, settings Settings) int {
	for _, r := range settings.Cooldowns {
		if price >= r.Min && price <= r.Max {
			return r.Period
		}
	}
	return 7 // дефолт
}

// GetWishesHandler возвращает обработчик для получения желаний пользователя
// @Summary Получить список желаний пользователя
// @Description Возвращает все желания пользователя по его ID
// @Tags wishes
// @Param userId path string true "ID пользователя"
// @Produce json
// @Success 200 {array} Wish
// @Router /users/{userId}/wishes [get]
func GetWishesHandler(storage *Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId := mux.Vars(r)["userId"]
		wishes := storage.GetWishes(userId)

		json.NewEncoder(w).Encode(wishes)
	}
}

// AddWishHandler создает обработчик для добавления нового желания
// @Summary Добавить желание
// @Description Создает новое желание для пользователя
// @Tags wishes
// @Param userId path string true "ID пользователя"
// @Produce json
// @Success 200 {object} Wish
// @Router /users/{userId}/wishes [post]
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

// ToggleWishHandler создает обработчик для переключения статуса желания
// @Summary Переключить статус желания
// @Description Инвертирует поле StillWant желания по его ID
// @Tags wishes
// @Param userId path string true "ID пользователя"
// @Param wishId path string true "ID желания"
// @Success 200 {string} string "успешно обновлено"
// @Router /users/{userId}/wishes/{wishId}/toggle [post]
func ToggleWishHandler(storage *Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId := mux.Vars(r)["userId"]
		wishId := mux.Vars(r)["wishId"]

		storage.ToggleStillWant(userId, wishId)
		w.WriteHeader(http.StatusOK)
	}
}

// RemoveWishHandler создает обработчик для удаления желания
// @Summary Удалить желание
// @Description Удаляет желание пользователя по его ID
// @Tags wishes
// @Param userId path string true "ID пользователя"
// @Param wishId path string true "ID желания"
// @Success 200 {string} string "успешно удалено"
// @Router /users/{userId}/wishes/{wishId} [delete]
func RemoveWishHandler(storage *Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId := mux.Vars(r)["userId"]
		wishId := mux.Vars(r)["wishId"]

		storage.RemoveWish(userId, wishId)
		w.WriteHeader(http.StatusOK)
	}
}

// GetSettingsHandler создает обработчик для получения настроек пользователя
// @Summary Получить настройки пользователя
// @Description Возвращает настройки по ID пользователя
// @Tags settings
// @Param userId path string true "ID пользователя"
// @Produce json
// @Success 200 {object} Settings
// @Router /users/{userId}/settings [get]
func GetSettingsHandler(storage *Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId := mux.Vars(r)["userId"]
		json.NewEncoder(w).Encode(storage.GetSettings(userId))
	}
}

// SaveSettingsHandler создает обработчик для сохранения настроек пользователя
// @Summary Сохранить настройки пользователя
// @Description Обновляет настройки по ID пользователя
// @Tags settings
// @Param userId path string true "ID пользователя"
// @Param settings body Settings true "Объект настроек"
// @Success 200 {string} string "успешно сохранено"
// @Router /users/{userId}/settings [post]
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
