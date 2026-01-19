package models

import (
	"gorm.io/gorm"
)

// UserRepository はユーザーデータへのアクセスを管理します。
type UserRepository struct {
	db *gorm.DB
}

// NewUserRepository は新しいUserRepositoryを作成します。
func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// Create は新しいユーザーを保存します。
func (repo *UserRepository) Create(user *User) error {
	return repo.db.Create(user).Error
}

// FindByEmail はメールアドレスでユーザーを検索します。
func (repo *UserRepository) FindByEmail(email string) (*User, error) {
	var user User
	err := repo.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByID はIDでユーザーを検索します。
func (repo *UserRepository) FindByID(id string) (*User, error) {
	var user User
	err := repo.db.First(&user, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Update はユーザー情報を更新します。
func (repo *UserRepository) Update(user *User) error {
	return repo.db.Save(user).Error
}
