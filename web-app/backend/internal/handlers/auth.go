/**
 * auth.go - Google OAuth Authentication Handler
 * 
 * This file implements the backend Google OAuth flow for the Discord clone.
 * It handles the complete OAuth 2.0 authorization code flow, user management,
 * and JWT token generation.
 * 
 * OAuth Flow:
 * 1. User clicks "Sign in with Google" -> /auth/google/login
 * 2. Redirect to Google with authorization URL
 * 3. Google redirects back to /auth/google/callback with code
 * 4. Exchange code for access token
 * 5. Use access token to get user info from Google
 * 6. Create/find user in database
 * 7. Generate JWT token
 * 8. Redirect to frontend with token
 * 
 * Security Features:
 * - State parameter for CSRF protection
 * - JWT tokens for stateless authentication
 * - Secure cookie handling
 * - Input validation and error handling
 * 
 * Environment Variables Required:
 * - GOOGLE_CLIENT_ID: Google OAuth client ID
 * - GOOGLE_CLIENT_SECRET: Google OAuth client secret
 * - OAUTH_REDIRECT_URL: OAuth callback URL
 * - JWT_SECRET: Secret key for JWT signing
 */

package handlers

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"github.com/user/web-app/internal/models"
)

/**
 * AuthHandler - Main authentication handler struct
 * 
 * Contains all dependencies needed for OAuth authentication:
 * - userService: Database operations for user management
 * - oauthConfig: Google OAuth configuration
 * - jwtSecret: Secret key for JWT token signing
 */
type AuthHandler struct {
	userService *models.UserService  // Database service for user operations
	oauthConfig *oauth2.Config       // Google OAuth2 configuration
	jwtSecret   []byte               // JWT signing secret
}

/**
 * GoogleUserInfo - User information returned by Google OAuth API
 * 
 * This struct maps to the JSON response from Google's userinfo endpoint.
 * Contains the essential user data we need for account creation.
 */
type GoogleUserInfo struct {
	ID      string `json:"id"`      // Google user ID (unique identifier)
	Email   string `json:"email"`   // User's email address
	Name    string `json:"name"`    // User's display name
	Picture string `json:"picture"` // Profile picture URL
}

/**
 * AuthResponse - Response structure for successful authentication
 * 
 * This is sent back to the frontend after successful OAuth.
 * Currently not used as we redirect with token in URL instead.
 */
type AuthResponse struct {
	Token string       `json:"token"` // JWT token
	User  *models.User `json:"user"`  // User information
}

/**
 * NewAuthHandler - Constructor for AuthHandler
 * 
 * Initializes the authentication handler with all required dependencies.
 * Sets up Google OAuth configuration using environment variables.
 * 
 * @param db Database connection for user operations
 * @return Configured AuthHandler instance
 */
func NewAuthHandler(db *sql.DB) *AuthHandler {
	// Initialize user service for database operations
	userService := models.NewUserService(db)
	
	// Configure Google OAuth2 settings
	// These values come from Google Cloud Console OAuth credentials
	oauthConfig := &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),     // Public client identifier
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"), // Secret key (keep secure!)
		RedirectURL:  os.Getenv("OAUTH_REDIRECT_URL"),   // Where Google redirects after auth
		Scopes:       []string{"openid", "profile", "email"}, // What data we want from Google
		Endpoint:     google.Endpoint,                   // Google's OAuth endpoints
	}
	
	// JWT secret for signing tokens (must be secure and consistent)
	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	
	return &AuthHandler{
		userService: userService,
		oauthConfig: oauthConfig,
		jwtSecret:   jwtSecret,
	}
}

/**
 * GoogleLogin - Initiates Google OAuth flow
 * 
 * This endpoint starts the OAuth process by:
 * 1. Generating a random state parameter for CSRF protection
 * 2. Creating the Google authorization URL
 * 3. Setting a secure cookie with the state
 * 4. Redirecting the user to Google's login page
 * 
 * Security Notes:
 * - State parameter prevents CSRF attacks
 * - HttpOnly cookie prevents XSS attacks
 * - Short expiration (10 min) limits exposure window
 * 
 * Flow: Frontend -> /auth/google/login -> Google OAuth -> /auth/google/callback
 */
func (h *AuthHandler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	// Generate random state for CSRF protection
	// This prevents attackers from initiating OAuth on behalf of users
	state := generateRandomState()
	
	// Create Google authorization URL with our configuration
	// AccessTypeOffline allows us to get refresh tokens (not used currently)
	url := h.oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
	
	// Store state in secure cookie for validation in callback
	// This ensures the callback request came from our redirect
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",                    // Cookie name
		Value:    state,                            // Random state value
		Expires:  time.Now().Add(10 * time.Minute), // Short expiration
		HttpOnly: true,                             // Prevents XSS access
		Secure:   false,                            // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,            // CSRF protection
	})
	
	// Redirect user to Google for authentication
	log.Printf("Redirecting user to Google OAuth: %s", url)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

/**
 * GoogleCallback - Handles OAuth callback from Google
 * 
 * This is where Google redirects users after they authorize our app.
 * This method completes the OAuth flow by:
 * 1. Validating the state parameter (CSRF protection)
 * 2. Exchanging the authorization code for an access token
 * 3. Using the access token to get user info from Google
 * 4. Creating or finding the user in our database
 * 5. Generating a JWT token for our application
 * 6. Redirecting back to the frontend with the token
 * 
 * Security Validations:
 * - State parameter validation prevents CSRF attacks
 * - All errors are logged for debugging
 * - User input is validated before database operations
 */
func (h *AuthHandler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	log.Printf("OAuth callback received")
	
	// Step 1: Verify state parameter for CSRF protection
	// The state must match what we set in the login endpoint
	stateCookie, err := r.Cookie("oauth_state")
	if err != nil || stateCookie.Value != r.URL.Query().Get("state") {
		log.Printf("Invalid state parameter: cookie=%v, query=%v", 
			stateCookie, r.URL.Query().Get("state"))
		http.Error(w, "Invalid state parameter", http.StatusBadRequest)
		return
	}
	
	// Step 2: Clear the state cookie (single use)
	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    "",                               // Clear the value
		Expires:  time.Now().Add(-1 * time.Hour),   // Set to past time
		HttpOnly: true,
	})
	
	// Step 3: Exchange authorization code for access token
	// Google sends us a code that we exchange for an actual access token
	code := r.URL.Query().Get("code")
	if code == "" {
		log.Printf("No authorization code received")
		http.Error(w, "No authorization code", http.StatusBadRequest)
		return
	}
	
	token, err := h.oauthConfig.Exchange(context.Background(), code)
	if err != nil {
		log.Printf("Token exchange error: %v", err)
		http.Error(w, "Failed to exchange token", http.StatusInternalServerError)
		return
	}
	
	// Step 4: Get user information from Google using the access token
	userInfo, err := h.getUserInfo(token.AccessToken)
	if err != nil {
		log.Printf("Failed to get user info: %v", err)
		http.Error(w, "Failed to get user info", http.StatusInternalServerError)
		return
	}
	log.Printf("Retrieved user info for: %s (%s)", userInfo.Name, userInfo.Email)
	
	// Step 5: Find existing user or create new one
	user, err := h.userService.GetUserByGoogleID(userInfo.ID)
	if err != nil {
		if err == sql.ErrNoRows {
			// User doesn't exist, create new account
			log.Printf("Creating new user for Google ID: %s", userInfo.ID)
			user, err = h.userService.CreateOAuthUser(userInfo.Email, userInfo.Name, userInfo.ID, userInfo.Picture)
			if err != nil {
				log.Printf("Failed to create user: %v", err)
				http.Error(w, "Failed to create user", http.StatusInternalServerError)
				return
			}
		} else {
			// Database error
			log.Printf("Database error: %v", err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
	} else {
		// Existing user found
		log.Printf("Found existing user: %s (ID: %d)", user.Username, user.ID)
	}
	
	// Step 6: Generate JWT token for our application
	jwtToken, err := h.generateJWT(user)
	if err != nil {
		log.Printf("Failed to generate JWT: %v", err)
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}
	
	// Step 7: Redirect back to frontend with the JWT token
	// The frontend AuthCallback component will handle the token
	redirectURL := fmt.Sprintf("http://localhost:5173/auth/callback?token=%s", jwtToken)
	log.Printf("Redirecting to frontend with token")
	http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
}

/**
 * getUserInfo - Fetches user information from Google
 * 
 * Uses the access token obtained from OAuth to make an authenticated
 * request to Google's userinfo API endpoint.
 * 
 * @param accessToken OAuth access token from Google
 * @return GoogleUserInfo struct with user details
 * @return error if request fails or JSON parsing fails
 */
func (h *AuthHandler) getUserInfo(accessToken string) (*GoogleUserInfo, error) {
	// Make authenticated request to Google's userinfo endpoint
	// This endpoint returns basic profile information for the authenticated user
	resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + accessToken)
	if err != nil {
		return nil, fmt.Errorf("failed to request user info: %w", err)
	}
	defer resp.Body.Close()
	
	// Check for HTTP errors
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Google API returned status: %d", resp.StatusCode)
	}
	
	// Parse JSON response into our struct
	var userInfo GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("failed to decode user info: %w", err)
	}
	
	return &userInfo, nil
}

/**
 * generateJWT - Creates a JWT token for authenticated users
 * 
 * Generates a signed JWT token containing user information that can be
 * used for subsequent API requests. The token is signed with our secret
 * and includes an expiration time.
 * 
 * Token Claims:
 * - user_id: Database user ID
 * - email: User's email address
 * - username: User's display name
 * - exp: Expiration time (24 hours from now)
 * - iat: Issued at time (current time)
 * 
 * @param user User model with database information
 * @return Signed JWT token string
 * @return error if token generation fails
 */
func (h *AuthHandler) generateJWT(user *models.User) (string, error) {
	// Create JWT claims with user information and metadata
	claims := jwt.MapClaims{
		"user_id":  user.ID,                               // Database user ID
		"email":    user.Email,                            // User email
		"username": user.Username,                         // Display name
		"exp":      time.Now().Add(24 * time.Hour).Unix(), // Expires in 24 hours
		"iat":      time.Now().Unix(),                     // Issued now
	}
	
	// Create and sign the token using HS256 algorithm
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString(h.jwtSecret)
	if err != nil {
		return "", fmt.Errorf("failed to sign JWT: %w", err)
	}
	
	return signedToken, nil
}

/**
 * generateRandomState - Creates a cryptographically secure random state
 * 
 * Generates a random string used as the OAuth state parameter for CSRF protection.
 * The state is sent to Google and must be returned unchanged in the callback.
 * 
 * @return Base64-encoded random string (32 bytes of entropy)
 */
func generateRandomState() string {
	// Generate 32 bytes of cryptographically secure random data
	b := make([]byte, 32)
	rand.Read(b) // crypto/rand for security (not math/rand)
	
	// Encode as URL-safe base64 for use in URLs and cookies
	return base64.URLEncoding.EncodeToString(b)
}