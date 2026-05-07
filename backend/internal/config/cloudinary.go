package config

import (
	"os"

	"github.com/cloudinary/cloudinary-go/v2"
)

func NewCloudinary() (*cloudinary.Cloudinary, error) {
	return cloudinary.NewFromURL(os.Getenv("CLOUDINARY_URL"))
}
