package controllers

import (
	"app/services"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

// AuthController は認証に関連するHTTPリクエストを処理します。
type AuthController struct {
	authService *services.AuthService
}

// NewAuthController は新しいAuthControllerを初期化します。
func NewAuthController(authService *services.AuthService) *AuthController {
	return &AuthController{authService: authService}
}

// RegisterRequest は登録リクエストの構造体です。
type RegisterRequest struct {
	Name     string `json:"name"`
	Username string `json:"username"`
	Password string `json:"password"` // これはクライアントで生成されたArgon2idハッシュ
	Salt     string `json:"salt"`     // クライアントが使用したソルト
}

// GetSalt はユーザー名に基づいてソルトを返します。
func (controller *AuthController) GetSalt(ctx echo.Context) error {
	username := ctx.QueryParam("username")
	if username == "" {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "ユーザー名は必須です"})
	}

	salt, err := controller.authService.GetSalt(username)
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": "ソルトの取得に失敗しました"})
	}

	return ctx.JSON(http.StatusOK, map[string]string{"salt": salt})
}

// Register は新規ユーザー登録を処理します。
func (controller *AuthController) Register(ctx echo.Context) error {
	var req RegisterRequest
	if err := ctx.Bind(&req); err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "リクエスト形式が不正です"})
	}

	if req.Username == "" || req.Password == "" || req.Salt == "" {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "ユーザー名、パスワード、ソルトは必須です"})
	}

	user, token, err := controller.authService.Register(req.Name, req.Username, req.Password, req.Salt)
	if err != nil {
		return ctx.JSON(http.StatusConflict, map[string]string{"error": err.Error()})
	}

	return ctx.JSON(http.StatusOK, AuthResponse{
		User:  user,
		Token: token,
	})
}

// RegisterRoutes は認証関連のルーティングを登録します。
func (controller *AuthController) RegisterRoutes(echoInstance *echo.Echo, authMiddleware echo.MiddlewareFunc) {
	group := echoInstance.Group("/auth")
	group.GET("/salt", controller.GetSalt) // ソルト取得用
	group.POST("/register", controller.Register)
	group.POST("/login", controller.Login)
	group.GET("/me", controller.Me, authMiddleware)
}
