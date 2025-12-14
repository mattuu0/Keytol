package services

import (
	"app/models"
	"time"
)

// DataService は暗号化されたデータに関連するビジネスロジックを処理します。
type DataService struct {
	repo *models.EncryptedDataRepository
}

// NewDataService は新しいDataServiceを初期化します。
func NewDataService(repo *models.EncryptedDataRepository) *DataService {
	return &DataService{repo: repo}
}

// SaveData はユーザーIDと暗号化されたデータを保存します。
func (service *DataService) SaveData(userID string, data string) error {
	now := time.Now()
	
	// 既存のデータを取得
	existing, err := service.repo.FindByUserID(userID)
	if err != nil {
		return err
	}
	
	encryptedData := &models.EncryptedData{
		UserID:    userID,
		Data:      data,
		UpdatedAt: now,
	}
	
	// 新規作成の場合のみCreatedAtを設定
	if existing.Data == "" {
		encryptedData.CreatedAt = now
	} else {
		encryptedData.CreatedAt = existing.CreatedAt
	}
	
	return service.repo.Save(encryptedData)
}

// GetData はユーザーIDで暗号化されたデータを取得します。
func (service *DataService) GetData(userID string) (*models.EncryptedData, error) {
	return service.repo.FindByUserID(userID)
}