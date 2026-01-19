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

// LoginRequest はログインリクエストの構造体です。
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"` // これはクライアントで生成されたArgon2idハッシュ
}

// AuthResponse は認証成功時のレスポンス構造体です。
type AuthResponse struct {
	User  interface{} `json:"user"`
	Token string      `json:"token"`
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
	userToken, ok := ctx.Get("user").(*jwt.Token)
	if !ok {
		return ctx.JSON(http.StatusUnauthorized, map[string]string{"error": "認証が必要です"})
	}
	claims := userToken.Claims.(jwt.MapClaims)
	userID := claims["user_id"].(string)

	user, err := controller.authService.GetUserByID(userID)
	if err != nil {
		return ctx.JSON(http.StatusNotFound, map[string]string{"error": "ユーザーが見つかりません"})
	}

	return ctx.JSON(http.StatusOK, user)
}

// Logout はログアウトを処理します。
func (controller *AuthController) Logout(ctx echo.Context) error {
	// クライアント側でトークンを破棄するのが基本ですが、サーバー側でも必要なら処理を行います。
	// 今回は200 OKを返すだけにします。
	return ctx.NoContent(http.StatusOK)
}

// ChangePasswordRequest はパスワード変更リクエストの構造体です。
type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

// ChangePassword はパスワード変更を処理します。
func (controller *AuthController) ChangePassword(ctx echo.Context) error {
	// JWTからユーザーIDを取得
	userToken, ok := ctx.Get("user").(*jwt.Token)
	if !ok {
		return ctx.JSON(http.StatusUnauthorized, map[string]string{"error": "認証が必要です"})
	}
	claims := userToken.Claims.(jwt.MapClaims)
	userID := claims["user_id"].(string)

	var req ChangePasswordRequest
	if err := ctx.Bind(&req); err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "リクエスト形式が不正です"})
	}

	if req.CurrentPassword == "" || req.NewPassword == "" {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "現在のパスワードと新しいパスワードの両方が必要です"})
	}

	// AuthServiceを呼び出してパスワード変更を実行
	err := controller.authService.ChangePassword(userID, req.CurrentPassword, req.NewPassword)
	if err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	return ctx.NoContent(http.StatusOK)
}

// RegisterRoutes は認証関連のルーティングを登録します。
func (controller *AuthController) RegisterRoutes(echoInstance *echo.Echo, authMiddleware echo.MiddlewareFunc) {
	group := echoInstance.Group("/auth")
	group.GET("/salt", controller.GetSalt) // ソルト取得用
	group.POST("/register", controller.Register)
	group.POST("/login", controller.Login)
	group.POST("/logout", controller.Logout) // ログアウト
	group.GET("/me", controller.Me, authMiddleware)
	group.POST("/change-password", controller.ChangePassword, authMiddleware) // パスワード変更
}