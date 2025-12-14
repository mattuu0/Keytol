package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		os.Getenv("MYSQL_USER"),
		os.Getenv("MYSQL_PASSWORD"),
		os.Getenv("DB_HOST"), // I'll assume the host is "db" as per docker-compose
		os.Getenv("DB_PORT"), // I'll assume a default port
		os.Getenv("MYSQL_DATABASE"),
	)

	var err error
	for i := 0; i < 5; i++ {
		DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
		if err == nil {
			break
		}
		log.Println("Failed to connect to database. Retrying...")
		time.Sleep(5 * time.Second)
	}

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connection established")
}