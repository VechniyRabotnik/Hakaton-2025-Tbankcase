package main

import (
	"log"
	"sync"
)

type Storage struct {
	data map[string][]Wish
	mu   sync.Mutex
}

func NewStorage() *Storage {
	return &Storage{
		data: make(map[string][]Wish),
	}
}

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
			log.Printf("[Storage] Toggled StillWant for user %s, wish %s -> %v\n", userId, wishId, wishes[i].StillWant)
			break
		}
	}
	s.data[userId] = wishes
}

func (s *Storage) RemoveWish(userId, wishId string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	wishes := s.data[userId]
	newWishes := []Wish{}
	for _, w := range wishes {
		if w.ID != wishId {
			newWishes = append(newWishes, w)
		}
	}
	s.data[userId] = newWishes
	log.Printf("[Storage] Removed wish for user %s, wish %s\n", userId, wishId)
}
