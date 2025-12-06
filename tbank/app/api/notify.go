package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

// Notification представляет структуру уведомления
type Notification struct {
	Title   string `json:"title"`
	Message string `json:"message"`
	Type    string `json:"type"`
}

// notifyHandler обрабатывает входящие уведомления
// @Summary Отправить уведомление пользователю
// @Description Отправляет уведомление пользователю по его ID
// @Tags notify
// @Accept json
// @Produce json
// @Param userId path string true "ID пользователя"
// @Param notification body Notification true "Объект уведомления"
// @Success 200 {object} map[string]string
// @Router /api/notify/{userId} [post]
func notifyHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Path[len("/api/notify/"):]

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var notif Notification
	if err := json.NewDecoder(r.Body).Decode(&notif); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	log.Printf("[NOTIFY] User: %s | Type: %s | Title: %s | Message: %s\n", userID, notif.Type, notif.Title, notif.Message)

	sendTelegram(userID, notif)
	sendEmail(userID, notif)
	sendWebNotification(userID, notif)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}

// Функции отправки уведомлений (заглушки)
// В реальном приложении здесь будет интеграция с соответствующими сервисами
// Например, с Telegram API, SMTP сервером и веб-сокетами
// для веб-уведомлений.
func sendTelegram(userID string, notif Notification) {
	fmt.Printf("[TG] %s -> %s: %s\n", userID, notif.Title, notif.Message)
}

func sendEmail(userID string, notif Notification) {
	fmt.Printf("[EMAIL] %s -> %s: %s\n", userID, notif.Title, notif.Message)
}

func sendWebNotification(userID string, notif Notification) {
	fmt.Printf("[WEB] %s -> %s: %s (при клике открыть localhost:3000)\n", userID, notif.Title, notif.Message)
}
