package main

import (
	"encoding/json"
	"log"
	"math"
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

// CalculateComfortMonths рассчитывает количество месяцев комфорта для желания
func CalculateComfortMonths(profile UserProfile, price float64) int {

	remainCoef := 1 - profile.ComfortPercent
	if remainCoef <= 0 {
		return -1 // Как?
	}

	leftPart := price - profile.TotalSavingsProfile*remainCoef
	if leftPart <= 0 {
		return 0 // можно покупать
	}

	if profile.MonthlySavingProfile <= 0 {
		return -1 // невозможно
	}

	months := leftPart / (profile.MonthlySavingProfile * remainCoef)

	// округляем чтоб было красиво
	return int(math.Ceil(months))
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
		status := r.URL.Query().Get("status") // optional: active/completed/cancelled
		log.Printf("[Handler] GET wishes for %s (status=%s)\n", userId, status)
		out := storage.GetWishes(userId, status)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(out)
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
			Status:             "active",
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
		vars := mux.Vars(r)
		userId := vars["userId"]
		wishId := vars["wishId"]
		action := r.URL.Query().Get("action") // "complete" or "cancel"
		target := "active"
		if action == "complete" {
			target = "completed"
		} else if action == "cancel" {
			target = "canceled"
		}
		ok := storage.UpdateWishStatus(userId, wishId, target)
		if !ok {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
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
		vars := mux.Vars(r)
		userId := vars["userId"]
		wishId := vars["wishId"]
		ok := storage.RemoveWish(userId, wishId)
		if !ok {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusNoContent)
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
		log.Printf("[Handler] GET settings for %s\n", userId)
		set := storage.GetSettings(userId)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(set)
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
		if err := json.NewDecoder(r.Body).Decode(&set); err != nil {
			http.Error(w, "invalid json", http.StatusBadRequest)
			return
		}
		storage.SaveSettings(userId, set)
		w.WriteHeader(http.StatusOK)
	}
}

// GetProfileHandler создает обработчик для получения профиля пользователя
// @Summary Получить профиль пользователя
// @Description Возвращает профиль по нику пользователя
// @Tags profile
// @Param nick path string true "Ник пользователя"
// @Produce json
// @Success 200 {object} UserProfile
// @Router /users/{nick}/profile [get]
func GetProfileHandler(storage *Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		nick := mux.Vars(r)["nick"]
		log.Printf("[Handler] GET profile for %s\n", nick)
		if p, ok := storage.GetProfile(nick); ok {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(p)
			return
		}
		// return
		def := UserProfile{
			Nick:                 nick,
			Salary:               0,
			TotalSavingsProfile:  0,
			MonthlySavingProfile: 0,
			BlockedCategories:    []string{},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(def)
	}
}

// SaveProfileHandler создает обработчик для сохранения профиля пользователя
// @Summary Сохранить профиль пользователя
// @Description Сохраняет профиль по нику пользователя
// @Tags profile
// @Param nick path string true "Ник пользователя"
// @Param profile body UserProfile true "Объект профиля"
// @Success 200 {string} string "успешно сохранено"
// @Router /users/{nick}/profile [post]
func SaveProfileHandler(storage *Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		nick := mux.Vars(r)["nick"]
		var p UserProfile
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			http.Error(w, "invalid json", http.StatusBadRequest)
			return
		}
		p.Nick = nick
		storage.SaveProfile(nick, p)
		w.WriteHeader(http.StatusOK)
		log.Printf("[Handler] Saved profile for %s: %+v\n", nick, p)
	}
}
