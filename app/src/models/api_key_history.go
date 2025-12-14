package models

import (
	"time"

	"gorm.io/gorm"
)

// ApiKeyHistory はAPIキーの操作履歴のモデルです。
type ApiKeyHistory struct {
	ID        string `gorm:"primaryKey"`
	ApiKeyID  string `gorm:"not null"`
	ApiKey    ApiKey
	Action    string `gorm:"not null"` // "created", "updated", "deleted", "viewed"
	Changes   string // JSON a string of Record<string, { old: string; new: string }>
	Timestamp time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}
