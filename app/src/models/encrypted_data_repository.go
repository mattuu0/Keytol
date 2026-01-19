package models

import (
	"time"

	"gorm.io/gorm"
)

// EncryptedDataRepository はデータベースアクセスを管理します。
type EncryptedDataRepository struct {
	database *gorm.DB
}

// NewEncryptedDataRepository は新しいリポジトリを作成します。
func NewEncryptedDataRepository(database *gorm.DB) *EncryptedDataRepository {
	return &EncryptedDataRepository{database: database}
}

// Save はユーザーIDと暗号化されたデータを保存します。
func (repository *EncryptedDataRepository) Save(encryptedData *EncryptedData) error {
	// UpdatedAtが設定されていない場合は現在時刻を設定
	if encryptedData.UpdatedAt.IsZero() {
		encryptedData.UpdatedAt = time.Now()
	}
	
	// CreatedAtが設定されていない場合は現在時刻を設定
	if encryptedData.CreatedAt.IsZero() {
		encryptedData.CreatedAt = time.Now()
	}
	
	return repository.database.Save(encryptedData).Error
}

// FindByUserID はユーザーIDで暗号化されたデータを取得します。
func (repository *EncryptedDataRepository) FindByUserID(userID string) (*EncryptedData, error) {
	var encryptedData EncryptedData
	err := repository.database.First(&encryptedData, "user_id = ?", userID).Error
	
	// レコードが見つからない場合は空のデータを返す
	if err == gorm.ErrRecordNotFound {
		return &EncryptedData{
			UserID:    userID,
			Data:      "",
			CreatedAt: time.Time{}, // ゼロ値
			UpdatedAt: time.Time{}, // ゼロ値
		}, nil
	}
	
	return &encryptedData, err
}