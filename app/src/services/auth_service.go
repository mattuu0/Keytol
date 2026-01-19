package services

import (
	"app/models"
	"crypto/rand"
	"encoding/base64"
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

// GetSalt は指定されたユーザーのソルトを取得します。
// ユーザーが存在しない場合は、ユーザー列挙攻撃を防ぐために決定論的な偽のソルトを返すのが理想ですが、
// 今回はシンプルに新規ユーザー用にランダムなソルトを生成して返すことも許容します。
func (service *AuthService) GetSalt(username string) (string, error) {
	user, err := service.userRepo.FindByUsername(username)
	if err == nil {
		return user.AuthSalt, nil
	}

	// 新規ユーザー登録用、あるいは存在しないユーザーに対してランダムなソルトを生成
	saltBytes := make([]byte, 16)
	if _, err := rand.Read(saltBytes); err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(saltBytes), nil
}

// Register は新しいユーザーを登録します。
func (service *AuthService) Register(name, username, authKey, salt string) (*models.User, string, error) {
	// 既にユーザー名が登録されているか確認
	existingUser, _ := service.userRepo.FindByUsername(username)
	if existingUser != nil {
		return nil, "", errors.New("このユーザー名は既に登録されています")
	}

	// クライアントから送られてきたauthKey（Argon2idハッシュ）をさらにハッシュ化
	hashedAuthKey, err := bcrypt.GenerateFromPassword([]byte(authKey), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", err
	}

	// ユーザーを作成
	user := &models.User{
		ID:           uuid.New().String(),
		Name:         name,
		Username:     username,
		AuthSalt:     salt,
		PasswordHash: string(hashedAuthKey),
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
func (service *AuthService) Login(username, authKey string) (*models.User, string, error) {
	// ユーザーを検索
	user, err := service.userRepo.FindByUsername(username)
	if err != nil {
		return nil, "", errors.New("ユーザー名またはパスワードが正しくありません")
	}

	// authKey（認証用キー）を検証
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(authKey)); err != nil {
		return nil, "", errors.New("ユーザー名またはパスワードが正しくありません")
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

// ChangePassword はパスワードを検証して更新します。
func (service *AuthService) ChangePassword(userID, currentAuthKey, newAuthKey string) error {
	user, err := service.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("ユーザーが見つかりません")
	}

	// 現在のパスワード（AuthKey）を検証
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(currentAuthKey)); err != nil {
		return errors.New("現在のパスワードが正しくありません")
	}

	// 新しいパスワード（AuthKey）をハッシュ化
	newHashedKey, err := bcrypt.GenerateFromPassword([]byte(newAuthKey), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// ユーザー情報を更新
	user.PasswordHash = string(newHashedKey)
	user.UpdatedAt = time.Now()

	return service.userRepo.Update(user)
}
