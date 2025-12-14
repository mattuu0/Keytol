package services

import (
	"Keytol/app/src/database"
	"Keytol/app/src/models"
)

// ApiKeyService は APIキーに関連するビジネスロジックを処理します。
type ApiKeyService struct{}

// CreateApiKey は新しいAPIキーを作成します。
func (s *ApiKeyService) CreateApiKey(apiKey *models.ApiKey) error {
	return database.DB.Create(apiKey).Error
}

// GetApiKeyByID は IDでAPIキーを取得します。
func (s *ApiKeyService) GetApiKeyByID(id string) (*models.ApiKey, error) {
	var apiKey models.ApiKey
	err := database.DB.First(&apiKey, "id = ?", id).Error
	return &apiKey, err
}

// GetApiKeys は全てのAPIキーを取得します。
func (s *ApiKeyService) GetAllApiKeys() ([]models.ApiKey, error) {
	var apiKeys []models.ApiKey
	err := database.DB.Find(&apiKeys).Error
	return apiKeys, err
}

// UpdateApiKey はAPIキーを更新します。
func (s *ApiKeyService) UpdateApiKey(apiKey *models.ApiKey) error {
	return database.DB.Save(apiKey).Error
}

// DeleteApiKey はAPIキーを削除します。
func (s *ApiKeyService) DeleteApiKey(id string) error {
	return database.DB.Delete(&models.ApiKey{}, "id = ?", id).Error
}
