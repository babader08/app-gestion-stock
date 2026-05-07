package validator

import (
	"fmt"
	"net/mail"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"
)

type Errors map[string][]string

func (e Errors) Add(field, message string) {
	e[field] = append(e[field], message)
}

func (e Errors) Get(field string) string {
	es := e[field]
	if len(es) == 0 {
		return ""
	}
	return es[0]
}

type Form struct {
	url.Values
	Errors Errors
}

func NewForm(form url.Values) *Form {
	return &Form{form, Errors(make(map[string][]string))}
}

func (f *Form) Valid() bool {
	return len(f.Errors) == 0
}

func (f *Form) Required(fields ...string) *Form {
	for _, field := range fields {
		value := f.Get(field)
		if strings.TrimSpace(value) == "" {
			f.Errors.Add(field, fmt.Sprintf("%s est requis", field))
		}
	}
	return f
}

func (f *Form) MaxLength(field string, n int) *Form {
	value := f.Get(field)
	if value == "" {
		return f
	}
	if utf8.RuneCountInString(value) > n {
		f.Errors.Add(field, fmt.Sprintf("Veuillez saisir au maximum %d caractères", n))
	}
	return f
}

func (f *Form) MinLength(field string, n int) *Form {
	value := f.Get(field)
	if value == "" {
		return f
	}
	if utf8.RuneCountInString(value) < n {
		f.Errors.Add(field, fmt.Sprintf("Veuillez saisir au moins %d caractères", n))
	}
	return f
}

func (f *Form) ValidEmail(field string) *Form {
	value := f.Get(field)
	if value == "" {
		return f
	}
	_, err := mail.ParseAddress(value)
	if err != nil {
		f.Errors.Add(field, "Veuillez saisir un email valide")
	}
	return f
}

func (f *Form) Range(field string, min, max int) *Form {
	value := f.Get(field)
	if value == "" {
		return f
	}
	num, err := strconv.Atoi(value)
	if err != nil || num < min || num > max {
		f.Errors.Add(field, fmt.Sprintf("Veuillez saisir une valeur entre %d et %d", min, max))
	}
	return f
}

func (f *Form) Matches(field string, pattern *regexp.Regexp) *Form {
	value := f.Get(field)
	if value == "" {
		return f
	}
	if !pattern.MatchString(value) {
		f.Errors.Add(field, "Le format du champ est invalide")
	}
	return f
}
