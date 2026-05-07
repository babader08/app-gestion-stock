package service

type Mailer interface {
	Send(to, template string, data map[string]any) error
}

// Traduction de ce code : "N'importe quoi qui a une méthode Send peut être un Mailer"
