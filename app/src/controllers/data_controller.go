package controllers

import (
	"Keytol/app/src/models"
	"Keytol/app/src/services"
	"net/http"

	"github.com/labstack/echo/v4"
)

// DataController は暗号化されたデータに関連するHTTPリクエストを処理します。
type DataController struct {
	service services.DataService
}

// NewDataController は新しいDataControllerを初期化します。
func NewDataController(service services.DataService) *DataController {
	return &DataController{service: service}
}

// SaveData は暗号化されたデータを保存します。
func (controller *DataController) SaveData(ctx echo.Context) error {
	var requestBody struct {
		UserID string `json:"user_id"`
		Data   string `json:"data"`
	}

	if err := ctx.Bind(&requestBody); err != nil {
		return ctx.JSON(http.StatusBadRequest, err.Error())
	}

	if err := controller.service.SaveData(requestBody.UserID, requestBody.Data); err != nil {
		return ctx.JSON(http.StatusInternalServerError, err.Error())
	}

	return ctx.NoContent(http.StatusCreated)
}

// GetData は暗号化されたデータを取得します。
func (controller *DataController) GetData(ctx echo.Context) error {
	userID := ctx.Param("user_id")
	encryptedData, err := controller.service.GetData(userID)
	if err != nil {
		return ctx.JSON(http.StatusNotFound, "Data not found")
	}
	return ctx.JSON(http.StatusOK, encryptedData)
}

// RegisterRoutes はルーティングを登録します。
func (controller *DataController) RegisterRoutes(echoInstance *echo.Echo) {
	group := echoInstance.Group("/data")
	group.POST("", controller.SaveData)
	group.GET("/:user_id", controller.GetData)
}
