package main

import (
	"log"
	"sync"
)

// Storage хранит данные и настройки пользователей
type Storage struct {
	data     map[string][]Wish
	settings map[string]Settings
	mu       sync.Mutex
}

// NewStorage создает новый хранилище
func NewStorage() *Storage {
	return &Storage{
		data:     make(map[string][]Wish),
		settings: make(map[string]Settings),
	}
}

// GetWishes возвращает список желаний пользователя
// @Summary Получить список желаний пользователя
// @Description Возвращает все желания пользователя по его ID
// @Tags wishes
// @Param userId path string true "ID пользователя"
// @Success 200 {array} Wish
// @Router /users/{userId}/wishes [get]
func (s *Storage) GetWishes(userId string) []Wish {
	s.mu.Lock()
	defer s.mu.Unlock()
	wishes := s.data[userId]
	log.Printf("[Storage] GetWishes for user %s: %v\n", userId, wishes)
	return wishes
}

// AddWish добавляет новое желание пользователя
// @Summary Добавить желание
// @Description Добавляет новое желание пользователя
// @Tags wishes
// @Param userId path string true "ID пользователя"
// @Param wish body Wish true "Желание"
// @Success 200 {string} string "успешно добавлено"
// @Router /users/{userId}/wishes [post]
func (s *Storage) AddWish(userId string, w Wish) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data[userId] = append([]Wish{w}, s.data[userId]...)
	log.Printf("[Storage] Added wish for user %s: %v\n", userId, w)
}

// ToggleStillWant переключает статус желания
// @Summary Переключить статус желания
// @Description Переключает статус StillWant для желания по его ID
// @Tags wishes
// @Param userId path string true "ID пользователя"
// @Param wishId path string true "ID желания"
// @Success 200 {string} string "успешно обновлено"
// @Router /users/{userId}/wishes/{wishId}/toggle [post]
func (s *Storage) ToggleStillWant(userId, wishId string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	wishes := s.data[userId]
	for i, w := range wishes {
		if w.ID == wishId {
			wishes[i].StillWant = !w.StillWant
			break
		}
	}
	s.data[userId] = wishes
}

// RemoveWish удаляет желание по его ID
// @Summary Удалить желание
// @Description Удаляет желание пользователя по его ID
// @Tags wishes
// @Param userId path string true "ID пользователя"
// @Param wishId path string true "ID желания"
// @Success 200 {string} string "успешно удалено"
// @Router /users/{userId}/wishes/{wishId} [delete]
func (s *Storage) RemoveWish(userId, wishId string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	newWishes := []Wish{}
	for _, w := range s.data[userId] {
		if w.ID != wishId {
			newWishes = append(newWishes, w)
		}
	}
	s.data[userId] = newWishes
}

// GetSettings возвращает настройки пользователя
// @Summary Получить настройки пользователя
// @Description Возвращает настройки пользователя по его ID
// @Tags settings
// @Param userId path string true "ID пользователя"
// @Success 200 {object} Settings
// @Router /users/{userId}/settings [get]
func (s *Storage) GetSettings(userId string) Settings {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.settings[userId]
}

// SaveSettings сохраняет настройки пользователя
// @Summary Сохранить настройки пользователя
// @Description Сохраняет настройки пользователя по его ID
// @Tags settings
// @Param userId path string true "ID пользователя"
// @Param settings body Settings true "Настройки"
// @Success 200 {string} string "успешно сохранено"
// @Router /users/{userId}/settings [post]
func (s *Storage) SaveSettings(userId string, set Settings) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.settings[userId] = set
}
