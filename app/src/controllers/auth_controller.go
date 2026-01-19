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
	Password string `json:"password"` // これはクライアントで生成されたauthKey
}

// LoginRequest はログインリクエストの構造体です。
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"` // これはクライアントで生成されたauthKey
}

// AuthResponse は認証成功時のレスポンス構造体です。
type AuthResponse struct {
	User  interface{} `json:"user"`
	Token string      `json:"token"`
}

// Register は新規ユーザー登録を処理します。
func (controller *AuthController) Register(ctx echo.Context) error {
	var req RegisterRequest
	if err := ctx.Bind(&req); err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "リクエスト形式が不正です"})
	}

	if req.Username == "" || req.Password == "" {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "ユーザー名とパスワードは必須です"})
	}

	user, token, err := controller.authService.Register(req.Name, req.Username, req.Password)
	if err != nil {
		return ctx.JSON(http.StatusConflict, map[string]string{"error": err.Error()})
	}

	return ctx.JSON(http.StatusOK, AuthResponse{
		User:  user,
		Token: token,
	})
}

// Login はログインを処理します。
func (controller *AuthController) Login(ctx echo.Context) error {
	var req LoginRequest
	if err := ctx.Bind(&req); err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "リクエスト形式が不正です"})
	}

	user, token, err := controller.authService.Login(req.Username, req.Password)
	if err != nil {
		return ctx.JSON(http.StatusUnauthorized, map[string]string{"error": err.Error()})
	}

	return ctx.JSON(http.StatusOK, AuthResponse{
		User:  user,
		Token: token,
	})
}

// Me は現在のログインユーザー情報を返します。
func (controller *AuthController) Me(ctx echo.Context) error {
	// JWTミドルウェアによってセットされたユーザーIDを取得
	userToken := ctx.Get("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)
	userID := claims["user_id"].(string)

	user, err := controller.authService.GetUserByID(userID)
	if err != nil {
		return ctx.JSON(http.StatusNotFound, map[string]string{"error": "ユーザーが見つかりません"})
	}

	return ctx.JSON(http.StatusOK, user)
}

// RegisterRoutes は認証関連のルーティングを登録します。
func (controller *AuthController) RegisterRoutes(echoInstance *echo.Echo, authMiddleware echo.MiddlewareFunc) {
	group := echoInstance.Group("/auth")
	group.POST("/register", controller.Register)
	group.POST("/login", controller.Login)
	group.GET("/me", controller.Me, authMiddleware)
}
