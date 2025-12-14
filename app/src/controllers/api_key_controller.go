package controllers

import (
	"Keytol/app/src/models"
	"Keytol/app/src/services"
	"net/http"

	"github.com/labstack/echo/v4"
)

// ApiKeyController は APIキーに関連するHTTPリクエストを処理します。
type ApiKeyController struct {
	service services.ApiKeyService
}

// NewApiKeyController は新しいApiKeyControllerを初期化します。
func NewApiKeyController() *ApiKeyController {
	return &ApiKeyController{}
}

// CreateApiKey は新しいAPIキーを作成します。
func (c *ApiKeyController) CreateApiKey(ctx echo.Context) error {
	var apiKey models.ApiKey
	if err := ctx.Bind(&apiKey); err != nil {
		return ctx.JSON(http.StatusBadRequest, err.Error())
	}

	if err := c.service.CreateApiKey(&apiKey); err != nil {
		return ctx.JSON(http.StatusInternalServerError, err.Error())
	}

	return ctx.JSON(http.StatusCreated, apiKey)
}

// GetApiKey は IDでAPIキーを取得します。
func (c *ApiKeyController) GetApiKey(ctx echo.Context) error {
	id := ctx.Param("id")
	apiKey, err := c.service.GetApiKeyByID(id)
	if err != nil {
		return ctx.JSON(http.StatusNotFound, "API key not found")
	}
	return ctx.JSON(http.StatusOK, apiKey)
}

// GetAllApiKeys は全てのAPIキーを取得します。
func (c *ApiKeyController) GetAllApiKeys(ctx echo.Context) error {
	apiKeys, err := c.service.GetAllApiKeys()
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, err.Error())
	}
	return ctx.JSON(http.StatusOK, apiKeys)
}

// UpdateApiKey はAPIキーを更新します。
func (c *ApiKeyController) UpdateApiKey(ctx echo.Context) error {
	var apiKey models.ApiKey
	if err := ctx.Bind(&apiKey); err != nil {
		return ctx.JSON(http.StatusBadRequest, err.Error())
	}

	if err := c.service.UpdateApiKey(&apiKey); err != nil {
		return ctx.JSON(http.StatusInternalServerError, err.Error())
	}

	return ctx.JSON(http.StatusOK, apiKey)
}

// DeleteApiKey はAPIキーを削除します。
func (c *ApiKeyController) DeleteApiKey(ctx echo.Context) error {
	id := ctx.Param("id")
	if err := c.service.DeleteApiKey(id); err != nil {
		return ctx.JSON(http.StatusInternalServerError, err.Error())
	}
	return ctx.NoContent(http.StatusNoContent)
}

// RegisterRoutes はルーティングを登録します。
func (c *ApiKeyController) RegisterRoutes(e *echo.Echo) {
	g := e.Group("/api/keys")
	g.POST("", c.CreateApiKey)
	g.GET("", c.GetAllApiKeys)
	g.GET("/:id", c.GetApiKey)
	g.PUT("/:id", c.UpdateApiKey)
	g.DELETE("/:id", c.DeleteApiKey)
}
