package main

import (
	"log"
	"sync"
)

type Storage struct {
	data     map[string][]Wish
	settings map[string]Settings
	mu       sync.Mutex
}

func NewStorage() *Storage {
	return &Storage{
		data:     make(map[string][]Wish),
		settings: make(map[string]Settings),
	}
}

// Wishes

func (s *Storage) GetWishes(userId string) []Wish {
	s.mu.Lock()
	defer s.mu.Unlock()
	wishes := s.data[userId]
	log.Printf("[Storage] GetWishes for user %s: %v\n", userId, wishes)
	return wishes
}

func (s *Storage) AddWish(userId string, w Wish) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data[userId] = append([]Wish{w}, s.data[userId]...)
	log.Printf("[Storage] Added wish for user %s: %v\n", userId, w)
}

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

// Settings

func (s *Storage) GetSettings(userId string) Settings {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.settings[userId]
}

func (s *Storage) SaveSettings(userId string, set Settings) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.settings[userId] = set
}
