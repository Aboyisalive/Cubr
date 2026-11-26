package waitlist

import "testing"

func TestNormalizeEmail(t *testing.T) {
	if got := NormalizeEmail("  Cuber@Example.COM "); got != "cuber@example.com" {
		t.Errorf("NormalizeEmail = %q", got)
	}
}

func TestValidateEmailValid(t *testing.T) {
	for _, email := range []string{
		"cuber@example.com",
		"first.last+tag@sub.example.co.uk",
		"a@b.co",
	} {
		if err := ValidateEmail(email); err != nil {
			t.Errorf("ValidateEmail(%q) = %v, want nil", email, err)
		}
	}
}
