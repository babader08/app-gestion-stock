package mailer

import (
	"bytes"
	"context"
	"embed"
	"html/template"

	"github.com/resend/resend-go/v2"
)

//go:embed templates/*.tmpl
var templateFS embed.FS

type Mailer struct {
	client *resend.Client
	sender string
}

func New(apiKey, sender string) Mailer {
	client := resend.NewClient(apiKey)

	return Mailer{
		client: client,
		sender: sender,
	}
}

func (m Mailer) Send(recipient, templateFile string, data map[string]any) error {
	// 1. Charger et parser le template (On garde ta logique actuelle)
	tmpl, err := template.New("email").ParseFS(templateFS, "templates/"+templateFile)
	if err != nil {
		return err
	}

	// 2. Exécuter le template pour le sujet et le corps HTML
	subject := new(bytes.Buffer)
	err = tmpl.ExecuteTemplate(subject, "subject", data)
	if err != nil {
		return err
	}

	htmlBody := new(bytes.Buffer)
	err = tmpl.ExecuteTemplate(htmlBody, "htmlBody", data)
	if err != nil {
		return err
	}

	// 3. Préparer la requête Resend
	params := &resend.SendEmailRequest{
		From:    m.sender,
		To:      []string{recipient},
		Subject: subject.String(),
		Html:    htmlBody.String(),
	}

	// 4. Envoyer via l'API Resend
	_, err = m.client.Emails.SendWithContext(context.Background(), params)
	return err
}
