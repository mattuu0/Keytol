package models

import (
	"gorm.io/gorm"
)

// UserRepository はユーザーデータへのアクセスを管理します。
type UserRepository struct {
	database *gorm.DB
}

// NewUserRepository は新しいUserRepositoryを作成します。
func NewUserRepository(database *gorm.DB) *UserRepository {
	return &UserRepository{database: database}
}

// Create は新しいユーザーを保存します。
func (repository *UserRepository) Create(user *User) error {
	return repository.database.Create(user).Error
}

// FindByEmail はメールアドレスでユーザーを検索します。
func (repository *UserRepository) FindByEmail(email string) (*User, error) {
	var user User
	err := repository.database.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByID はIDでユーザーを検索します。
func (repository *UserRepository) FindByID(id string) (*User, error) {
	var user User
	err := repository.database.First(&user, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Update はユーザー情報を更新します。
func (repository *UserRepository) Update(user *User) error {
	return repository.database.Save(user).Error
}
