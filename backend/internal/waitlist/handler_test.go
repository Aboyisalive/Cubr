package waitlist

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
)

type fakeStore struct {
	mu     sync.Mutex
	emails map[string]bool
	err    error
}

func newFakeStore() *fakeStore { return &fakeStore{emails: map[string]bool{}} }

func (s *fakeStore) Add(_ context.Context, email string) (bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.err != nil {
		return false, s.err
	}
	if s.emails[email] {
		return false, nil
	}
	s.emails[email] = true
	return true, nil
}

func testHandler(store Store) *Handler {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	return NewHandler(store, NewRateLimiter(1000, 1000), logger)
}

func post(handler http.Handler, body, remoteAddr string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, "/waitlist", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = remoteAddr
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	return rec
}

func decodeError(t *testing.T, rec *httptest.ResponseRecorder) (code, message string) {
	t.Helper()
	var body struct {
		Error struct {
			Code    string `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("decode error body: %v", err)
	}
	return body.Error.Code, body.Error.Message
}

func TestNewEmailSubscribes(t *testing.T) {
	store := newFakeStore()
	rec := post(testHandler(store), `{"email":"Cuber@Example.com"}`, "192.0.2.1:1234")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body %s", rec.Code, rec.Body)
	}
	var body map[string]string
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil || body["status"] != "subscribed" {
		t.Fatalf("body = %v err = %v, want status=subscribed", body, err)
	}
	if !store.emails["cuber@example.com"] {
		t.Errorf("stored emails = %v, want normalized cuber@example.com", store.emails)
	}
}

func TestDuplicateEmailIsSilentSuccess(t *testing.T) {
	handler := testHandler(newFakeStore())
	first := post(handler, `{"email":"cuber@example.com"}`, "192.0.2.1:1234")
	dup := post(handler, `{"email":"  CUBER@example.com "}`, "192.0.2.1:1234")
	if first.Code != http.StatusOK || dup.Code != http.StatusOK {
		t.Fatalf("statuses = %d/%d, want 200/200", first.Code, dup.Code)
	}
	if first.Body.String() != dup.Body.String() {
		t.Errorf("duplicate response differs:\nnew: %s\ndup: %s", first.Body, dup.Body)
	}
}

func TestInvalidEmailIsTypedError(t *testing.T) {
	invalid := []string{
		``, `not-an-email`, `missing@tld`, `@example.com`, `a@.com`,
		`a@example.`, `a b@example.com`, `a@example .com`, strings.Repeat("a", 250) + `@x.co`,
	}
	for _, email := range invalid {
		t.Run(email, func(t *testing.T) {
			store := newFakeStore()
			body, _ := json.Marshal(map[string]string{"email": email})
			rec := post(testHandler(store), string(body), "192.0.2.1:1234")
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400", rec.Code)
			}
			code, message := decodeError(t, rec)
			if code != "INVALID_EMAIL" || message == "" {
				t.Errorf("error = %q/%q, want INVALID_EMAIL with message", code, message)
			}
			if len(store.emails) != 0 {
				t.Errorf("invalid email was stored: %v", store.emails)
			}
		})
	}
}

func TestMalformedBodiesAreTypedErrors(t *testing.T) {
	cases := map[string]string{
		"not json":       `hello`,
		"unknown field":  `{"email":"a@b.co","admin":true}`,
		"trailing junk":  `{"email":"a@b.co"} {}`,
		"wrong type":     `{"email":42}`,
		"empty body":     ``,
		"oversized body": `{"email":"` + strings.Repeat("a", 5000) + `@b.co"}`,
	}
	for name, body := range cases {
		t.Run(name, func(t *testing.T) {
			rec := post(testHandler(newFakeStore()), body, "192.0.2.1:1234")
			if rec.Code < 400 || rec.Code >= 500 {
				t.Fatalf("status = %d, want 4xx", rec.Code)
			}
			if code, _ := decodeError(t, rec); code == "" {
				t.Error("error code empty, want typed error")
			}
		})
	}
}

func TestStoreErrorIsGeneric500(t *testing.T) {
	store := newFakeStore()
	store.err = errors.New("db connection string with secrets")
	rec := post(testHandler(store), `{"email":"a@b.co"}`, "192.0.2.1:1234")
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", rec.Code)
	}
	code, message := decodeError(t, rec)
	if code != "INTERNAL_ERROR" || strings.Contains(message, "secrets") {
		t.Errorf("error = %q/%q, want generic INTERNAL_ERROR without internals", code, message)
	}
}

func TestNoStoreIs503(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	rec := post(NewHandler(nil, nil, logger), `{"email":"a@b.co"}`, "192.0.2.1:1234")
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", rec.Code)
	}
	if code, _ := decodeError(t, rec); code != "SERVICE_UNAVAILABLE" {
		t.Errorf("code = %q, want SERVICE_UNAVAILABLE", code)
	}
}

func TestRateLimitIsTyped429WithRetryAfter(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	handler := NewHandler(newFakeStore(), NewRateLimiter(60, 2), logger)
	post(handler, `{"email":"a@b.co"}`, "198.51.100.7:1111")
	post(handler, `{"email":"a@b.co"}`, "198.51.100.7:1111")
	rec := post(handler, `{"email":"a@b.co"}`, "198.51.100.7:1111")
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want 429", rec.Code)
	}
	if code, _ := decodeError(t, rec); code != "RATE_LIMITED" {
		t.Errorf("code = %q, want RATE_LIMITED", code)
	}
	if rec.Header().Get("Retry-After") == "" {
		t.Error("Retry-After header missing")
	}
	// A different IP is unaffected.
	other := post(handler, `{"email":"a@b.co"}`, "203.0.113.9:2222")
	if other.Code != http.StatusOK {
		t.Errorf("other IP status = %d, want 200", other.Code)
	}
}
