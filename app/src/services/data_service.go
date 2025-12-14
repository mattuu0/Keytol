package services

import (
	"Keytol/app/src/database"
	"Keytol/app/src/models"
)

// DataService は暗号化されたデータに関連するビジネスロジックを処理します。
type DataService struct{}

// SaveData はユーザーIDと暗号化されたデータを保存します。
func (service *DataService) SaveData(userID string, data string) error {
	encryptedData := &models.EncryptedData{
		UserID: userID,
		Data:   data,
	}
	return database.DB.Save(encryptedData).Error
}

// GetData はユーザーIDで暗号化されたデータを取得します。
func (service *DataService) GetData(userID string) (*models.EncryptedData, error) {
	var encryptedData models.EncryptedData
	err := database.DB.First(&encryptedData, "user_id = ?", userID).Error
	return &encryptedData, err
}
