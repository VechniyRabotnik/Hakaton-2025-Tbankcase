package main

import "time"

// Wish представляет желание пользователя.
// @Description Информация о желании пользователя.
type Wish struct {
	// ID — уникальный идентификатор
	// example: "123e4567-e89b-12d3-a456-426614174000"
	ID string `json:"id"`
	// Title — название желания
	// example: "Новый Ноутбук"
	Title string `json:"title"`
	// Price — цена в рублях
	// example: 10 000
	Price float64 `json:"price"`
	// Category — категория желания
	// example: "Электроника"
	Category string `json:"category"`
	// CoolingDays — количество дней на "остывание"
	// example: 5
	CoolingDays int `json:"coolingDays"`
	// RecommendedCooling — рекомендованное количество дней на "остывание"
	// example: 7
	RecommendedCooling int `json:"recommendedCooling"`
	// StillWant — флаг, указывающий, хочет ли пользователь всё ещё это желание
	// example: true
	StillWant bool `json:"stillWant"`
	// CreatedAt — дата и время создания желания
	// example: "2024-01-01T12:00:00Z"
	CreatedAt time.Time `json:"createdAt"`
}

// CooldownRange представляет диапазон охлаждения.
// @Description Диапазон охлаждения для настроек.
type CooldownRange struct {
	// Min — минимальное значение
	// example: 1
	Min float64 `json:"min"`
	// Max — максимальное значение
	// example: 10000
	Max float64 `json:"max"`
	// Period — период охлаждения в днях
	// example: 7
	Period int `json:"period"`
}

// Settings представляет настройки пользователя.
// @Description Настройки пользователя.
type Settings struct {
	// Cooldowns — диапазоны охлаждения
	Cooldowns []CooldownRange `json:"cooldowns"`
	// NotificationFreq — частота уведомлений
	// example: "еженедельно"
	NotificationFreq string `json:"notificationFrequency"`
	// ExcludedProducts — исключённые продукты
	// example: "алкоголь"
	ExcludedProducts string `json:"excludedProducts"`
	// NotificationChannel — канал уведомлений
	// example: "email"
	NotificationChannel string `json:"notificationChannel"`
	// TotalSpent — потрачено всего
	// example: 1500
	TotalSpent float64 `json:"totalSpent"`
	// TotalPurchases — всего покупок
	// example: 25
	TotalPurchases int `json:"totalPurchases"`
	// MonthlySaving — ежемесячая сумма
	// example: 300
	MonthlySaving float64 `json:"monthlySaving"`
}
