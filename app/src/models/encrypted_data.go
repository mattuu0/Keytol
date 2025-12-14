package models

import (
	"time"
)

// EncryptedData はユーザーごとに暗号化されたJSON文字列を保存するモデルです。
type EncryptedData struct {
	UserID    string     `gorm:"primaryKey;type:varchar(191)"`
	Data      string     `gorm:"type:text"`
	CreatedAt time.Time  `gorm:"type:datetime;default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time  `gorm:"type:datetime;default:CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"`
	DeletedAt *time.Time `gorm:"index;type:datetime"`
}