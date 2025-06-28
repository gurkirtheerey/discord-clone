package models

import (
	"database/sql"
	"time"
)

type User struct {
	ID           int       `json:"id" db:"id"`
	Username     string    `json:"username" db:"username"`
	Email        string    `json:"email" db:"email"`
	PasswordHash *string   `json:"-" db:"password_hash"`
	GoogleID     *string   `json:"google_id" db:"google_id"`
	Provider     string    `json:"provider" db:"provider"`
	AvatarURL    *string   `json:"avatar_url" db:"avatar_url"`
	Status       string    `json:"status" db:"status"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

type UserService struct {
	db *sql.DB
}

func NewUserService(db *sql.DB) *UserService {
	return &UserService{db: db}
}

func (s *UserService) GetUserByGoogleID(googleID string) (*User, error) {
	user := &User{}
	query := `SELECT id, username, email, password_hash, google_id, provider, avatar_url, status, created_at, updated_at 
			  FROM users WHERE google_id = $1`
	
	err := s.db.QueryRow(query, googleID).Scan(
		&user.ID, &user.Username, &user.Email, &user.PasswordHash,
		&user.GoogleID, &user.Provider, &user.AvatarURL, &user.Status,
		&user.CreatedAt, &user.UpdatedAt,
	)
	
	if err != nil {
		return nil, err
	}
	
	return user, nil
}

func (s *UserService) GetUserByEmail(email string) (*User, error) {
	user := &User{}
	query := `SELECT id, username, email, password_hash, google_id, provider, avatar_url, status, created_at, updated_at 
			  FROM users WHERE email = $1`
	
	err := s.db.QueryRow(query, email).Scan(
		&user.ID, &user.Username, &user.Email, &user.PasswordHash,
		&user.GoogleID, &user.Provider, &user.AvatarURL, &user.Status,
		&user.CreatedAt, &user.UpdatedAt,
	)
	
	if err != nil {
		return nil, err
	}
	
	return user, nil
}

func (s *UserService) CreateOAuthUser(email, username, googleID, avatarURL string) (*User, error) {
	user := &User{}
	query := `INSERT INTO users (username, email, google_id, provider, avatar_url, status) 
			  VALUES ($1, $2, $3, 'google', $4, 'online') 
			  RETURNING id, username, email, google_id, provider, avatar_url, status, created_at, updated_at`
	
	err := s.db.QueryRow(query, username, email, googleID, avatarURL).Scan(
		&user.ID, &user.Username, &user.Email, &user.GoogleID,
		&user.Provider, &user.AvatarURL, &user.Status,
		&user.CreatedAt, &user.UpdatedAt,
	)
	
	if err != nil {
		return nil, err
	}
	
	return user, nil
}