package models

import (
	"time"

	"gorm.io/gorm"
)

// EncryptedDataRepository はデータベースアクセスを管理します。
type EncryptedDataRepository struct {
	db *gorm.DB
}

// NewEncryptedDataRepository は新しいリポジトリを作成します。
func NewEncryptedDataRepository(db *gorm.DB) *EncryptedDataRepository {
	return &EncryptedDataRepository{db: db}
}

// Save はユーザーIDと暗号化されたデータを保存します。
func (repo *EncryptedDataRepository) Save(encryptedData *EncryptedData) error {
	// UpdatedAtが設定されていない場合は現在時刻を設定
	if encryptedData.UpdatedAt.IsZero() {
		encryptedData.UpdatedAt = time.Now()
	}
	
	// CreatedAtが設定されていない場合は現在時刻を設定
	if encryptedData.CreatedAt.IsZero() {
		encryptedData.CreatedAt = time.Now()
	}
	
	return repo.db.Save(encryptedData).Error
}

// FindByUserID はユーザーIDで暗号化されたデータを取得します。
func (repo *EncryptedDataRepository) FindByUserID(userID string) (*EncryptedData, error) {
	var encryptedData EncryptedData
	err := repo.db.First(&encryptedData, "user_id = ?", userID).Error
	
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