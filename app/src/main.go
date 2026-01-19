package main

import (
	"app/controllers"
	"app/database"
	"app/models"
	"app/services"
	"errors"
	"log"
	"log/slog"
	"net/http"
	"os"

	echojwt "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// データベースに接続
	database.Connect()

	// データベースのマイグレーション
	err := database.DB.AutoMigrate(&models.EncryptedData{}, &models.User{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Echo instance
	router := echo.New()

	// Middleware
	router.Use(middleware.Logger())
	router.Use(middleware.Recover())
	router.Use(middleware.CORS()) // CORSを有効化

	// JWT ミドルウェアの設定
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "default_secret_key_for_development"
	}
	authMiddleware := echojwt.WithConfig(echojwt.Config{
		SigningKey: []byte(jwtSecret),
	})

	// リポジトリを作成
	encryptedDataRepo := models.NewEncryptedDataRepository(database.DB)
	userRepo := models.NewUserRepository(database.DB)

	// サービスを作成
	dataService := services.NewDataService(encryptedDataRepo)
	authService := services.NewAuthService(userRepo)

	// コントローラーを作成
	dataController := controllers.NewDataController(dataService)
	dataController.RegisterRoutes(router, authMiddleware)

	authController := controllers.NewAuthController(authService)
	authController.RegisterRoutes(router, authMiddleware)

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
