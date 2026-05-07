package main

import (
	"App-Gestion-Produits/internal/config"
	"App-Gestion-Produits/internal/mailer"
	"App-Gestion-Produits/internal/repository"
	"App-Gestion-Produits/internal/service"
	"fmt"
	"log"
	"log/slog"
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

type application struct {
	logger         *slog.Logger
	authService    *service.AuthService
	repo           repository.AuthRepository
	mailer         mailer.Mailer
	Cloudinary     *cloudinary.Cloudinary
	productRepo    repository.ProductRepository
	productService *service.ProductService
	userService    *service.UserService
}

// Ce code permet de charger le fichier .env au démarrage :
func init() {
	_ = godotenv.Load()
}

func main() {

	// connect to database and initialize repository :
	db, err := config.ConnectDatabase()
	if err != nil {
		log.Fatal("cannot connect to database : ", err)
	}

	resendKey := os.Getenv("RESEND_API_KEY")

	appMailer := mailer.New(resendKey, "storepro@babsdev.tech")

	aRepo, err := repository.NewAuthRepo(db)
	if err != nil {
		log.Fatal("cannot initialize repository : ", err)
	}
	var repo repository.AuthRepository = aRepo
	defer func() {
		aRepo.Close()
		db.Close()
	}()

	pRepo, err := repository.NewProductRepo(db)
	if err != nil {
		log.Fatal("cannot initialize product repository : ", err)
	}
	var productRepo repository.ProductRepository = pRepo
	defer func() {
		pRepo.CloseProducts()
		db.Close()
	}()

	uRepo, err := repository.NewUserRepo(db)
	if err != nil {
		log.Fatal("cannot initialize user repository : ", err)
	}
	var userRepo repository.UserRepository = uRepo
	defer func() {
		aRepo.Close()
		db.Close()
	}()

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level:     slog.LevelDebug,
		AddSource: true,
	}))

	authService := service.NewAuthService(repo, appMailer, logger)
	productService := service.NewProductService(logger, productRepo)
	userService := service.NewUserService(logger, userRepo)

	cld, err := config.NewCloudinary()
	if err != nil {
		log.Fatal("Cannot init Cloudinary")
	}

	app := &application{
		logger:         logger,
		repo:           repo,
		mailer:         appMailer,
		authService:    authService,
		Cloudinary:     cld,
		productRepo:    productRepo,
		productService: productService,
		userService:    userService,
	}

	// 4. ON LANCE LE SERVEUR TOUJOURS À LA FIN
	fmt.Println("Serveur lancé sur http://localhost:7860")
	if err := app.Server(); err != nil {
		log.Fatal("erreur sur app server : ", err)
	}
}
