package models

import (
	"time"

	"gorm.io/gorm"
)

// User はユーザー情報を保存するモデルです。
type User struct {
	ID           string         `gorm:"primaryKey;type:varchar(191)" json:"id"`
	Username     string         `gorm:"uniqueIndex;type:varchar(191)" json:"username"`
	PasswordHash string         `gorm:"type:varchar(255)" json:"-"` // クライアント側で生成されたAuthKeyのハッシュ
	Name         string         `gorm:"type:varchar(255)" json:"name"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}
