package services

import (
	"Keytol/app/src/database"
	"Keytol/app/src/models"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// ApiKeyService は APIキーに関連するビジネスロジックを処理します。
type ApiKeyService struct {
	historyService ApiKeyHistoryService
}

// NewApiKeyService は新しいApiKeyServiceを初期化します。
func NewApiKeyService(historyService ApiKeyHistoryService) *ApiKeyService {
	return &ApiKeyService{historyService: historyService}
}

// CreateApiKey は新しいAPIキーを作成します。
func (s *ApiKeyService) CreateApiKey(apiKey *models.ApiKey) error {
	err := database.DB.Create(apiKey).Error
	if err != nil {
		return err
	}

	history := &models.ApiKeyHistory{
		ID:        uuid.New().String(),
		ApiKeyID:  apiKey.ID,
		Action:    "created",
		Timestamp: time.Now(),
	}
	return s.historyService.CreateApiKeyHistory(history)
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
	var existingApiKey models.ApiKey
	if err := database.DB.First(&existingApiKey, "id = ?", apiKey.ID).Error; err != nil {
		return err
	}

	err := database.DB.Save(apiKey).Error
	if err != nil {
		return err
	}

	changes := make(map[string]map[string]string)
	if existingApiKey.Name != apiKey.Name {
		changes["name"] = map[string]string{"old": existingApiKey.Name, "new": apiKey.Name}
	}
	if existingApiKey.Key != apiKey.Key {
		changes["key"] = map[string]string{"old": "********", "new": "********"}
	}
	if existingApiKey.URL != apiKey.URL {
		changes["url"] = map[string]string{"old": existingApiKey.URL, "new": apiKey.URL}
	}

	if len(changes) > 0 {
		changesJSON, _ := json.Marshal(changes)
		history := &models.ApiKeyHistory{
			ID:        uuid.New().String(),
			ApiKeyID:  apiKey.ID,
			Action:    "updated",
			Changes:   string(changesJSON),
			Timestamp: time.Now(),
		}
		return s.historyService.CreateApiKeyHistory(history)
	}

	return nil
}

// DeleteApiKey はAPIキーを削除します。
func (s *ApiKeyService) DeleteApiKey(id string) error {
	err := database.DB.Delete(&models.ApiKey{}, "id = ?", id).Error
	if err != nil {
		return err
	}

	history := &models.ApiKeyHistory{
		ID:        uuid.New().String(),
		ApiKeyID:  id,
		Action:    "deleted",
		Timestamp: time.Now(),
	}
	return s.historyService.CreateApiKeyHistory(history)
}
