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

// Настройки пользователя
type CooldownRange struct {
	Min    float64 `json:"min"`
	Max    float64 `json:"max"`
	Period int     `json:"period"` // в днях
}

type Settings struct {
	Cooldowns           []CooldownRange `json:"cooldowns"`
	NotificationFreq    string          `json:"notificationFrequency"`
	ExcludedProducts    string          `json:"excludedProducts"`
	NotificationChannel string          `json:"notificationChannel"`
	TotalSpent          float64         `json:"totalSpent"`
	TotalPurchases      int             `json:"totalPurchases"`
	MonthlySaving       float64         `json:"monthlySaving"`
}
