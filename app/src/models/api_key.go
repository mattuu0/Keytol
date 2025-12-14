package models

import (
	"time"

	"gorm.io/gorm"
)

// ApiKey はデータベースに保存されるAPIキーのモデルです。
type ApiKey struct {
	ID        string    `gorm:"primaryKey"`
	Name      string    `gorm:"not null"`
	Key       string    `gorm:"not null"` // e2eeで暗号化されたJSON文字列
	URL       string
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}
