package models

import (
	"time"

	"gorm.io/gorm"
)

// User はユーザー情報を保存するモデルです。
type User struct {
	ID        string         `gorm:"primaryKey;type:varchar(191)" json:"id"`
	Email     string         `gorm:"uniqueIndex;type:varchar(191)" json:"email"`
	Password  string         `gorm:"type:varchar(255)" json:"-"` // パスワードはJSONレスポンスに含めない
	Name      string         `gorm:"type:varchar(255)" json:"name"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
