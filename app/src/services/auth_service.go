package services

import (
	"app/models"
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// AuthService は認証に関連するビジネスロジックを処理します。
type AuthService struct {
	userRepo *models.UserRepository
}

// NewAuthService は新しいAuthServiceを初期化します。
func NewAuthService(userRepo *models.UserRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

// Register は新しいユーザーを登録します。
func (service *AuthService) Register(name, email, password string) (*models.User, string, error) {
	// 既にメールアドレスが登録されているか確認
	existingUser, _ := service.userRepo.FindByEmail(email)
	if existingUser != nil {
		return nil, "", errors.New("このメールアドレスは既に登録されています")
	}

	// パスワードをハッシュ化
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", err
	}

	// ユーザーを作成
	user := &models.User{
		ID:       uuid.New().String(),
		Name:     name,
		Email:    email,
		Password: string(hashedPassword),
	}

	if err := service.userRepo.Create(user); err != nil {
		return nil, "", err
	}

	// JWTを生成
	token, err := service.generateToken(user)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

// Login はユーザーのログインを処理します。
func (service *AuthService) Login(email, password string) (*models.User, string, error) {
	// ユーザーを検索
	user, err := service.userRepo.FindByEmail(email)
	if err != nil {
		return nil, "", errors.New("メールアドレスまたはパスワードが正しくありません")
	}

	// パスワードを検証
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, "", errors.New("メールアドレスまたはパスワードが正しくありません")
	}

	// JWTを生成
	token, err := service.generateToken(user)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

// generateToken はユーザーのJWTを生成します。
func (service *AuthService) generateToken(user *models.User) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "default_secret_key_for_development" // 開発用のデフォルト値
	}

	claims := jwt.MapClaims{
		"user_id": user.ID,
		"exp":     time.Now().Add(time.Hour * 72).Unix(), // 3日間有効
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// GetUserByID はIDからユーザー情報を取得します。
func (service *AuthService) GetUserByID(id string) (*models.User, error) {
	return service.userRepo.FindByID(id)
}
