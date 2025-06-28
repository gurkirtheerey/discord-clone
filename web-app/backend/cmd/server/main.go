/**
 * main.go - Discord Clone Backend Server
 * 
 * This is the main entry point for the Discord clone backend server.
 * It sets up the HTTP server with Google OAuth authentication, JWT middleware,
 * and database connectivity.
 * 
 * Server Architecture:
 * - HTTP server using Go's standard net/http package
 * - PostgreSQL database with connection pooling
 * - JWT-based authentication with Google OAuth
 * - CORS middleware for frontend communication
 * - Environment variable configuration
 * 
 * Endpoints:
 * - /api/health: Health check endpoint
 * - /api/hello: Test endpoint with optional authentication
 * - /auth/google/login: Initiates Google OAuth flow
 * - /auth/google/callback: Handles OAuth callback
 * 
 * Key Components:
 * - AuthHandler: Manages Google OAuth and JWT generation
 * - JWTMiddleware: Validates tokens and injects user context
 * - UserService: Database operations for user management
 * - CORS: Enables frontend-backend communication
 * 
 * Environment Setup:
 * Requires .env file with database and OAuth configuration
 */

package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/joho/godotenv"
	"github.com/user/web-app/internal/handlers"
	"github.com/user/web-app/internal/middleware"
	"github.com/user/web-app/pkg"
)

/**
 * Response - Standard API response structure
 * 
 * Used for basic API endpoints that return simple status information.
 */
type Response struct {
	Message string `json:"message"` // Human-readable response message
	Status  string `json:"status"`  // Status indicator (success, error, etc.)
}

/**
 * enableCORS - CORS middleware for frontend communication
 * 
 * Enables Cross-Origin Resource Sharing to allow the React frontend
 * (localhost:5173) to communicate with the Go backend (localhost:8080).
 * 
 * CORS Headers:
 * - Access-Control-Allow-Origin: Specifies allowed origin (frontend URL)
 * - Access-Control-Allow-Methods: Allowed HTTP methods
 * - Access-Control-Allow-Headers: Headers that can be sent (includes Authorization for JWT)
 * 
 * Handles preflight OPTIONS requests that browsers send for complex requests.
 * 
 * @param next The next HTTP handler in the middleware chain
 * @return HTTP handler with CORS headers
 */
func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow requests from React frontend
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		
		// Allow standard HTTP methods
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		
		// Allow Content-Type and Authorization headers (Authorization needed for JWT)
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		// Handle preflight OPTIONS requests
		// Browsers send these before actual requests with custom headers
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		// Continue to next handler
		next.ServeHTTP(w, r)
	})
}

/**
 * healthHandler - Health check endpoint
 * 
 * Simple endpoint to verify the server is running and responsive.
 * Returns a basic JSON response with server status.
 * 
 * @param w HTTP response writer
 * @param r HTTP request
 */
func healthHandler(w http.ResponseWriter, r *http.Request) {
	response := Response{
		Message: "Server is healthy",
		Status:  "ok",
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

/**
 * HelloResponse - Response structure for hello endpoint
 * 
 * Extends the basic Response with optional user information.
 * The User field is only populated if the request is authenticated.
 */
type HelloResponse struct {
	Message string                    `json:"message"`         // Response message
	Status  string                    `json:"status"`          // Status indicator
	User    *middleware.UserClaims    `json:"user,omitempty"`  // User info (if authenticated)
}

/**
 * helloHandler - Test endpoint with optional authentication
 * 
 * This endpoint demonstrates how to implement mixed authentication:
 * - Works for unauthenticated users (returns basic message)
 * - Enhanced functionality for authenticated users (personalized message + user data)
 * 
 * The JWT middleware runs before this handler and adds user context if a valid
 * token is provided. This handler checks for user context and adapts accordingly.
 * 
 * This pattern allows for:
 * - Public API endpoints that work for everyone
 * - Enhanced features for authenticated users
 * - Gradual migration from public to protected endpoints
 * 
 * @param w HTTP response writer
 * @param r HTTP request (may contain user context from JWT middleware)
 */
func helloHandler(w http.ResponseWriter, r *http.Request) {
	// Extract user information from request context (set by JWT middleware)
	user := middleware.GetUserFromContext(r)
	
	// Create response with basic information
	response := HelloResponse{
		Message: "Hello from Go backend!",
		Status:  "success",
		User:    user, // Will be nil if not authenticated
	}
	
	// Personalize message for authenticated users
	if user != nil {
		response.Message = "Hello " + user.Username + "! You are authenticated."
		log.Printf("Authenticated request from user: %s (ID: %d)", user.Username, user.UserID)
	} else {
		log.Printf("Unauthenticated request to /api/hello")
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

/**
 * main - Application entry point
 * 
 * Sets up and starts the HTTP server with all required components:
 * 1. Environment configuration
 * 2. Database connectivity
 * 3. Authentication handlers
 * 4. Middleware chain
 * 5. Route configuration
 * 6. Server startup
 * 
 * Server Configuration:
 * - Port: 8080
 * - CORS enabled for frontend communication
 * - JWT middleware for authentication
 * - PostgreSQL database connection
 * - Google OAuth integration
 */
func main() {
	log.Println("Starting Discord Clone Backend Server...")
	
	// Step 1: Load environment variables from .env file
	// Contains database credentials, OAuth keys, and JWT secrets
	if err := godotenv.Load("../../.env"); err != nil {
		log.Printf("Warning: .env file not found: %v", err)
		log.Printf("Make sure environment variables are set another way")
	}

	// Step 2: Connect to PostgreSQL database
	// Uses connection details from environment variables
	log.Println("Connecting to database...")
	db, err := pkg.ConnectDatabase()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close() // Ensure connection closes when main() exits
	log.Println("Database connection established")

	// Step 3: Initialize authentication handler
	// Sets up Google OAuth configuration and JWT signing
	log.Println("Initializing authentication handlers...")
	authHandler := handlers.NewAuthHandler(db)

	// Step 4: Set up HTTP router with endpoints
	mux := http.NewServeMux()
	
	// Health check endpoint (no authentication required)
	mux.HandleFunc("/api/health", healthHandler)
	
	// Test endpoint with optional authentication
	// JWT middleware will add user context if token is provided
	mux.Handle("/api/hello", middleware.JWTMiddleware(http.HandlerFunc(helloHandler)))
	
	// Google OAuth endpoints
	mux.HandleFunc("/auth/google/login", authHandler.GoogleLogin)      // Start OAuth flow
	mux.HandleFunc("/auth/google/callback", authHandler.GoogleCallback) // Handle OAuth callback
	
	// Step 5: Apply CORS middleware to entire router
	// Enables frontend (React) to communicate with backend
	handler := enableCORS(mux)
	
	// Step 6: Start HTTP server
	log.Println("Server starting on :8080...")
	log.Println("Available endpoints:")
	log.Println("  GET  /api/health - Health check")
	log.Println("  GET  /api/hello - Test endpoint (optional auth)")
	log.Println("  GET  /auth/google/login - Start Google OAuth")
	log.Println("  GET  /auth/google/callback - OAuth callback")
	log.Println("Frontend should be running on http://localhost:5173")
	
	// Start server - this blocks until server shuts down
	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}