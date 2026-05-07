package config

import (
	"database/sql"
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
)

func ConnectDatabase() (*sql.DB, error) {
	_ = godotenv.Load()

	addUrl := os.Getenv("DB_URL")
	if addUrl == "" {
		return nil, fmt.Errorf("la variable DB_URL est vide")
	}

	db, err := sql.Open("pgx", addUrl)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(5 * time.Minute)

	fmt.Println("Connexion réussie à PostgreSQL")
	return db, nil
}
