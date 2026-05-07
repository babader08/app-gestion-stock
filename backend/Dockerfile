FROM golang:1.25.7-alpine AS builder

WORKDIR /app

# On va chercher les fichiers de dépendances dans le dossier backend
COPY go.mod go.sum ./
RUN go mod download

# On copie tout le contenu du dossier backend à la racine de /app dans le conteneur
COPY . .

# Ton binaire est dans cmd/web/, donc cette ligne est correcte
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/web/

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/

COPY --from=builder /app/main .

# Important : Hugging Face préfère souvent le port 7860 par défaut,
# mais si ton code Go écoute sur 8080, laisse 8080.
EXPOSE 8080

CMD ["./main"]