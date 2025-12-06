package main

import "github.com/gorilla/mux"

// NewRouter создает маршрутизатор с API-эндпоинтами.
// @Summary Создает новый маршрутизатор с API-эндпоинтами
// @Description Маршрутизатор с маршрутами для желаний и настроек.
// @Tags router
// @Accept  json
// @Produce  json
func NewRouter(storage *Storage) *mux.Router {
	r := mux.NewRouter()

	api := r.PathPrefix("/api").Subrouter()

	// wishes
	// @Summary Получить желания пользователя
	// @Description Возвращает список желаний указанного пользователя
	// @Tags wishes
	// @Accept  json
	// @Produce  json
	// @Param userId path string true "ID пользователя"
	// @Success 200 {array} Wish
	// @Router /api/wishes/{userId} [get]
	api.HandleFunc("/wishes/{userId}", GetWishesHandler(storage)).Methods("GET")
	// @Summary Добавить желание
	// @Description Добавляет новое желание для пользователя
	// @Tags wishes
	// @Accept  json
	// @Produce  json
	// @Param userId path string true "ID пользователя"
	// @Param wish body Wish true "Объект желания"
	// @Success 200 {object} Wish
	// @Router /api/wishes/{userId} [post]
	api.HandleFunc("/wishes/{userId}", AddWishHandler(storage)).Methods("POST")
	// @Summary Переключить статус желания
	// @Description Меняет статус желания (актуально/неактуально)
	// @Tags wishes
	// @Accept  json
	// @Produce  json
	// @Param userId path string true "ID пользователя"
	// @Param wishId path string true "ID желания"
	// @Success 200 {object} Wish
	// @Router /api/wishes/{userId}/{wishId} [put]
	api.HandleFunc("/wishes/{userId}/{wishId}", ToggleWishHandler(storage)).Methods("PUT")
	// @Summary Удалить желание
	// @Description Удаляет желание пользователя
	// @Tags wishes
	// @Accept  json
	// @Produce  json
	// @Param userId path string true "ID пользователя"
	// @Param wishId path string true "ID желания"
	// @Success 204
	// @Router /api/wishes/{userId}/{wishId} [delete]
	api.HandleFunc("/wishes/{userId}/{wishId}", RemoveWishHandler(storage)).Methods("DELETE")

	// settings
	// @Summary Получить настройки пользователя
	// @Description Возвращает настройки пользователя по ID
	// @Tags settings
	// @Accept  json
	// @Produce  json
	// @Param userId path string true "ID пользователя"
	// @Success 200 {object} Settings
	// @Router /api/settings/{userId} [get]
	api.HandleFunc("/settings/{userId}", GetSettingsHandler(storage)).Methods("GET")
	// @Summary Сохранить настройки пользователя
	// @Description Обновляет настройки пользователя
	// @Tags settings
	// @Accept  json
	// @Produce  json
	// @Param userId path string true "ID пользователя"
	// @Param settings body Settings true "Объект настроек"
	// @Success 200 {object} Settings
	// @Router /api/settings/{userId} [post]
	api.HandleFunc("/settings/{userId}", SaveSettingsHandler(storage)).Methods("POST")

	return r
}
