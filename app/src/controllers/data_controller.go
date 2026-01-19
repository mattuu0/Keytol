package controllers

import (
	"app/services"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

// DataController は暗号化されたデータに関連するHTTPリクエストを処理します。
type DataController struct {
	service *services.DataService
}

// NewDataController は新しいDataControllerを初期化します。
func NewDataController(service *services.DataService) *DataController {
	return &DataController{service: service}
}

// SaveData は暗号化されたデータを保存します。
func (controller *DataController) SaveData(ctx echo.Context) error {
	// JWTからユーザーIDを取得
	userToken, ok := ctx.Get("user").(*jwt.Token)
	if !ok {
		return ctx.JSON(http.StatusUnauthorized, map[string]string{"error": "認証が必要です"})
	}
	claims := userToken.Claims.(jwt.MapClaims)
	userID := claims["user_id"].(string)

	var requestBody struct {
		Data string `json:"data"`
	}

	if err := ctx.Bind(&requestBody); err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	if err := controller.service.SaveData(userID, requestBody.Data); err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return ctx.NoContent(http.StatusCreated)
}

// GetData は暗号化されたデータを取得します。
func (controller *DataController) GetData(ctx echo.Context) error {
	// JWTからユーザーIDを取得
	userToken, ok := ctx.Get("user").(*jwt.Token)
	if !ok {
		return ctx.JSON(http.StatusUnauthorized, map[string]string{"error": "認証が必要です"})
	}
	claims := userToken.Claims.(jwt.MapClaims)
	userID := claims["user_id"].(string)

	encryptedData, err := controller.service.GetData(userID)
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	
	return ctx.JSON(http.StatusOK, encryptedData)
}

// RegisterRoutes はルーティングを登録します。
func (controller *DataController) RegisterRoutes(echoInstance *echo.Echo, authMiddleware echo.MiddlewareFunc) {
	group := echoInstance.Group("/data")
	group.Use(authMiddleware)
	group.POST("/save", controller.SaveData)
	group.GET("/get", controller.GetData)
}