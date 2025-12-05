package main

import "time"

type Wish struct {
	ID                 string    `json:"id"`
	Title              string    `json:"title"`
	Price              float64   `json:"price"`
	Category           string    `json:"category"`
	CoolingDays        int       `json:"coolingDays"`
	RecommendedCooling int       `json:"recommendedCooling"`
	StillWant          bool      `json:"stillWant"`
	CreatedAt          time.Time `json:"createdAt"`
}
