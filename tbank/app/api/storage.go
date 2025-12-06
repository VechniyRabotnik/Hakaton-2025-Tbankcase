package main

import (
	"log"
	"sync"
	"time"
)

// Storage хранит данные и настройки пользователей
type Storage struct {
	wishes    map[string][]Wish
	settings  map[string]Settings
	profiles  map[string]UserProfile
	completed map[string][]Wish
	canceled  map[string][]Wish
	mu        sync.Mutex
}

// NewStorage создает новый хранилище
func NewStorage() *Storage {
	return &Storage{
		wishes:    make(map[string][]Wish),
		settings:  make(map[string]Settings),
		profiles:  make(map[string]UserProfile),
		completed: make(map[string][]Wish),
		canceled:  make(map[string][]Wish),
	}
}

// copyWishes создает копию среза желаний
func copyWishes(src []Wish) []Wish {
	out := make([]Wish, len(src))
	copy(out, src)
	return out
}

// GetWishes возвращает список желаний пользователя
// @Summary Получить список желаний пользователя
// @Description Возвращает все желания пользователя по его ID
// @Tags wishes
// @Param userId path string true "ID пользователя"
// @Success 200 {array} Wish
// @Router /users/{userId}/wishes [get]
func (s *Storage) GetWishes(userId string, status string) []Wish {
	s.mu.Lock()
	defer s.mu.Unlock()

	switch status {
	case "":

		return copyWishes(s.wishes[userId])

	case "active":
		return copyWishes(s.wishes[userId])

	case "completed":
		return copyWishes(s.completed[userId])

	case "canceled":
		return copyWishes(s.canceled[userId])

	default:
		return []Wish{}
	}
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

	profile := s.profiles[userId]
	w.ComfortMonths = CalculateComfortMonths(profile, w.Price)

	now := time.Now()
	w.CreatedAt = now
	w.UpdateAt = now

	if w.Status == "" {
		w.Status = "active"
	}

	s.wishes[userId] = append([]Wish{w}, s.wishes[userId]...)
	log.Printf("[Storage] Added wish (%s) for user %s: %+v", w.ID, userId, w)
}

// ToggleStillWant переключает статус желания
// @Summary Переключить статус желания
// @Description Переключает статус StillWant для желания по его ID
// @Tags wishes
// @Param userId path string true "ID пользователя"
// @Param wishId path string true "ID желания"
// @Success 200 {string} string "успешно обновлено"
// @Router /users/{userId}/wishes/{wishId}/toggle [post]
func (s *Storage) ToggleStillWant(userId, wishId string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	list := s.wishes[userId]
	for i := range list {
		if list[i].ID == wishId {
			list[i].StillWant = !list[i].StillWant
			list[i].UpdateAt = time.Now()
			s.wishes[userId] = list
			log.Printf("[Storage] Toggled StillWant for wish %s (%v)", wishId, list[i].StillWant)
			return true
		}
	}
	return false
}

// UpdateWishStatus обновляет статус желания
// @Summary Обновить статус желания
// @Description Обновляет статус желания (active, completed, canceled)
// @Tags wishes
// @Param userId path string true "ID пользователя"
// @Param wishId path string true "ID желания"
// @Param status path string true "Новый статус желания"
// @Success 200 {string} string "успешно обновлено"
// @Router /users/{userId}/wishes/{wishId}/status [put]
func (s *Storage) UpdateWishStatus(userId, wishId, status string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.wishes[userId] {
		if s.wishes[userId][i].ID == wishId {

			w := s.wishes[userId][i]
			w.Status = status
			w.UpdateAt = time.Now()

			// убираем из активного списка
			s.wishes[userId] = append(
				s.wishes[userId][:i],
				s.wishes[userId][i+1:]...,
			)

			if status == "completed" {
				s.completed[userId] = append(s.completed[userId], w)
			}
			if status == "canceled" {
				s.canceled[userId] = append(s.canceled[userId], w)
			}

			log.Printf("[Storage] Wish %s set to %s", wishId, status)
			return true
		}
	}
	return false
}

// RemoveWish удаляет желание по его ID
// @Summary Удалить желание
// @Description Удаляет желание пользователя по его ID
// @Tags wishes
// @Param userId path string true "ID пользователя"
// @Param wishId path string true "ID желания"
// @Success 200 {string} string "успешно удалено"
// @Router /users/{userId}/wishes/{wishId} [delete]
func (s *Storage) RemoveWish(userId, wishId string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	newList := []Wish{}
	found := false

	for _, w := range s.wishes[userId] {
		if w.ID == wishId {
			found = true
			continue
		}
		newList = append(newList, w)
	}

	s.wishes[userId] = newList

	if found {
		log.Printf("[Storage] Removed wish %s for user %s", wishId, userId)
	}

	return found
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
	log.Printf("[Storage] Saved settings for %s: %v\n", userId, set)
}

// GetProfile возвращает профиль пользователя
// @Summary Получить профиль пользователя
// @Description Возвращает профиль по нику пользователя
// @Tags profile
// @Param nick path string true "Ник пользователя"
// @Success 200 {object} UserProfile
// @Router /users/{nick}/profile [get]
func (s *Storage) GetProfile(nick string) (UserProfile, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	p, ok := s.profiles[nick]
	return p, ok
}

// SaveProfile сохраняет профиль пользователя
// @Summary Сохранить профиль пользователя
// @Description Сохраняет профиль по нику пользователя
// @Tags profile
// @Param nick path string true "Ник пользователя"
// @Param profile body UserProfile true "Объект профиля"
// @Success 200 {string} string "успешно сохранено"
// @Router /users/{nick}/profile [post]
func (s *Storage) SaveProfile(nick string, p UserProfile) {
	s.mu.Lock()
	defer s.mu.Unlock()
	p.Nick = nick
	s.profiles[nick] = p

	list := s.wishes[nick]
	for i := range list {
		list[i].ComfortMonths = CalculateComfortMonths(p, list[i].Price)
	}
	s.wishes[nick] = list

	log.Printf("[Storage] Saved profile for %s: %+v\n", nick, p)
}
