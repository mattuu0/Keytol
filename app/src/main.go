package main

import (
	"Keytol/app/src/controllers"
	"Keytol/app/src/database"
	"Keytol/app/src/models"
	"Keytol/app/src/services"
	"errors"
	"log"
	"log/slog"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// データベースに接続
	database.Connect()

	// データベースのマイグレーション
	err := database.DB.AutoMigrate(&models.ApiKey{}, &models.ApiKeyHistory{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Echo instance
	router := echo.New()

	// Middleware
	router.Use(middleware.Logger())
	router.Use(middleware.Recover())

	// サービスの初期化
	apiKeyHistoryService := services.ApiKeyHistoryService{}
	apiKeyService := services.NewApiKeyService(apiKeyHistoryService)

	// コントローラーの初期化
	apiKeyController := controllers.NewApiKeyController(*apiKeyService, apiKeyHistoryService)

	// ルーティングの登録
	apiKeyController.RegisterRoutes(router)

	// Routes
	router.GET("/", hello)

	// Start server
	if err := router.Start(":8080"); err != nil && !errors.Is(err, http.ErrServerClosed) {
		slog.Error("failed to start server", "error", err)
	}
}

// Handler
func hello(ctx echo.Context) error {
	return ctx.String(http.StatusOK, "Hello, World!")
}
