package validator

import (
	"crypto/rand"
	"encoding/binary"
	"fmt"
)

// GenerateOTP : On génère 6 chiffres aléatoires sécurisés
func GenerateOTP() string {
	b := make([]byte, 3)
	rand.Read(b)
	return fmt.Sprintf("%06d", binary.BigEndian.Uint32(append([]byte{0}, b...))%1000000)
}
