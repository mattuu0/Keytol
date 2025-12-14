package models

import (
	"gorm.io/gorm"
)

// EncryptedData はユーザーごとに暗号化されたJSON文字列を保存するモデルです。
type EncryptedData struct {
	UserID    string `gorm:"primaryKey"`
	Data      string `gorm:"type:text"`
	gorm.Model
}