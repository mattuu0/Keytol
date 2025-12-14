package services

import (
	"Keytol/app/src/database"
	"Keytol/app/src/models"
)

// ApiKeyHistoryService は APIキーの履歴に関連するビジネスロジックを処理します。
type ApiKeyHistoryService struct{}

// CreateApiKeyHistory は新しいAPIキーの履歴を作成します。
func (s *ApiKeyHistoryService) CreateApiKeyHistory(apiKeyHistory *models.ApiKeyHistory) error {
	return database.DB.Create(apiKeyHistory).Error
}

// GetApiKeyHistoryByApiKeyID は APIキーIDで履歴を取得します。
func (s *ApiKeyHistoryService) GetApiKeyHistoryByApiKeyID(apiKeyID string) ([]models.ApiKeyHistory, error) {
	var apiKeyHistory []models.ApiKeyHistory
	err := database.DB.Where("api_key_id = ?", apiKeyID).Find(&apiKeyHistory).Error
	return apiKeyHistory, err
}

// GetAllApiKeyHistory は全てのAPIキーの履歴を取得します。
func (s *ApiKeyHistoryService) GetAllApiKeyHistory() ([]models.ApiKeyHistory, error) {
	var apiKeyHistory []models.ApiKeyHistory
	err := database.DB.Find(&apiKeyHistory).Error
	return apiKeyHistory, err
}
