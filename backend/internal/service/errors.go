package service

import "errors"

var (
	ErrUserNotActivated = errors.New("user not activated")
	ErrInvalidToken     = errors.New("invalid or expired token")
	ErrWrongPassword    = errors.New("wrong password")
)
