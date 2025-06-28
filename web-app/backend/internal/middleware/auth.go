/**
 * auth.go - JWT Authentication Middleware
 * 
 * This middleware provides JWT token validation for protected API endpoints.
 * It extracts JWT tokens from Authorization headers, validates them, and
 * adds user information to the request context for use by handlers.
 * 
 * Key Features:
 * - Optional authentication (continues without user if no token)
 * - JWT token validation with signature verification
 * - User context injection for authenticated requests
 * - Comprehensive error logging for debugging
 * - Support for Bearer token format
 * 
 * Usage:
 * mux.Handle("/api/protected", middleware.JWTMiddleware(handler))
 * 
 * The middleware makes authentication optional - if no token is provided
 * or token is invalid, the request continues but without user context.
 * Handlers can check for user presence using GetUserFromContext().
 */

package middleware

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

/**
 * UserClaims - JWT token claims structure
 * 
 * Defines the structure of claims stored in JWT tokens.
 * Embeds jwt.RegisteredClaims for standard JWT fields (exp, iat, etc.)
 * and adds custom fields for user identification.
 */
type UserClaims struct {
	UserID   int    `json:"user_id"`  // Database user ID
	Email    string `json:"email"`    // User email address
	Username string `json:"username"` // User display name
	jwt.RegisteredClaims              // Standard JWT claims (exp, iat, etc.)
}

/**
 * Context key type for storing user information in request context.
 * Using a custom type prevents key collisions with other middleware.
 */
type contextKey string

// UserContextKey is used to store/retrieve user claims from request context
const UserContextKey contextKey = "user"

/**
 * JWTMiddleware - JWT token validation middleware
 * 
 * This middleware extracts and validates JWT tokens from Authorization headers.
 * It implements optional authentication - requests continue even without valid tokens,
 * but authenticated users get their information added to the request context.
 * 
 * Process:
 * 1. Extract Authorization header
 * 2. Validate Bearer token format
 * 3. Parse and verify JWT signature
 * 4. Add user claims to request context if valid
 * 5. Continue to next handler regardless of auth status
 * 
 * This design allows endpoints to be either:
 * - Public (work for everyone)
 * - Mixed (enhanced functionality for authenticated users)
 * - Protected (check for user context in handler)
 * 
 * @param next The next HTTP handler in the chain
 * @return HTTP handler that includes JWT validation
 */
func JWTMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Step 1: Extract Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			// No token provided - continue without user context
			// This allows public endpoints to work normally
			log.Printf("No Authorization header found for %s", r.URL.Path)
			next.ServeHTTP(w, r)
			return
		}

		// Debug logging (truncated for security)
		log.Printf("Authorization header found for %s: %s", r.URL.Path, authHeader[:20]+"...")

		// Step 2: Validate Bearer token format
		// Expected format: "Bearer <jwt-token>"
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			// Invalid format (no "Bearer " prefix)
			log.Printf("Invalid token format (missing Bearer prefix)")
			next.ServeHTTP(w, r)
			return
		}

		// Step 3: Parse and verify JWT token
		token, err := jwt.ParseWithClaims(tokenString, &UserClaims{}, func(token *jwt.Token) (interface{}, error) {
			// Verify the signing method is what we expect
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			// Return the secret key for signature verification
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !token.Valid {
			// Invalid token - log and continue without user context
			log.Printf("Invalid token for %s: %v", r.URL.Path, err)
			next.ServeHTTP(w, r)
			return
		}

		// Step 4: Extract user claims and add to context
		if claims, ok := token.Claims.(*UserClaims); ok {
			// Token is valid - add user info to request context
			log.Printf("User authenticated for %s: %s (ID: %d)", r.URL.Path, claims.Username, claims.UserID)
			ctx := context.WithValue(r.Context(), UserContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		} else {
			// Claims parsing failed
			log.Printf("Failed to parse token claims for %s", r.URL.Path)
			next.ServeHTTP(w, r)
		}
	})
}

/**
 * GetUserFromContext - Retrieves user claims from request context
 * 
 * Helper function for handlers to access authenticated user information.
 * Returns nil if no user is authenticated for this request.
 * 
 * Usage in handlers:
 * user := middleware.GetUserFromContext(r)
 * if user != nil {
 *     // User is authenticated, access user.UserID, user.Email, etc.
 * } else {
 *     // User is not authenticated, handle as public request
 * }
 * 
 * @param r HTTP request with potential user context
 * @return UserClaims if authenticated, nil otherwise
 */
func GetUserFromContext(r *http.Request) *UserClaims {
	// Attempt to extract user claims from request context
	if user, ok := r.Context().Value(UserContextKey).(*UserClaims); ok {
		return user
	}
	// No user found in context (not authenticated)
	return nil
}