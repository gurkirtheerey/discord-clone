/**
 * AuthContext.tsx - Authentication Context for Google OAuth
 * 
 * This file implements the authentication system for the Discord clone using Google OAuth.
 * It manages user authentication state, JWT tokens, and provides authentication methods
 * to the entire application.
 * 
 * Key Features:
 * - Google OAuth integration with JWT tokens
 * - Persistent authentication across page refreshes
 * - Loading states to prevent race conditions
 * - Automatic token expiration handling
 * - Debug logging for troubleshooting
 * 
 * Implementation Notes:
 * - Uses localStorage to persist JWT tokens
 * - Decodes JWT client-side for user info (in production, validate server-side)
 * - Handles token expiration automatically
 * - Provides loading state to coordinate with components
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * User interface matching the database schema
 * Represents an authenticated user from Google OAuth
 */
interface User {
  id: number;           // Database user ID
  email: string;        // Google email
  username: string;     // Google display name
  avatar_url?: string;  // Google profile picture
  status: string;       // User status (online/offline)
}

/**
 * Authentication context interface
 * Provides all authentication-related state and methods
 */
interface AuthContextType {
  user: User | null;                                    // Current authenticated user
  token: string | null;                                 // JWT token from backend
  login: (token: string, user: User) => void;          // Login method for OAuth callback
  logout: () => void;                                   // Logout method
  isAuthenticated: boolean;                             // Computed authentication status
  isLoading: boolean;                                   // Loading state for initialization
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component - Main authentication provider
 * 
 * This component wraps the entire application and provides authentication state.
 * It handles the critical initialization process that restores user sessions
 * from localStorage on page refresh.
 * 
 * Key Responsibilities:
 * 1. Initialize authentication state from localStorage on app startup
 * 2. Manage loading state to prevent race conditions
 * 3. Handle JWT token validation and expiration
 * 4. Provide authentication methods to child components
 * 
 * Race Condition Fix:
 * The isLoading state prevents components from rendering before authentication
 * state is fully initialized, fixing the "token disappears on refresh" issue.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Critical: Loading state prevents race conditions during initialization
  // Without this, components render before localStorage is read, causing auth issues
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Authentication Initialization Effect
   * 
   * This effect runs once on app startup and is responsible for:
   * 1. Reading the JWT token from localStorage
   * 2. Validating the token (expiration check)
   * 3. Restoring user state from the token payload
   * 4. Setting isLoading to false when complete
   * 
   * This solves the "authentication lost on refresh" problem by ensuring
   * the auth state is properly restored before any components render.
   */
  useEffect(() => {
    console.log('AuthProvider: Initializing auth state...');
    
    // Step 1: Check for existing token in localStorage
    const storedToken = localStorage.getItem('authToken');
    console.log('AuthProvider: Stored token exists:', !!storedToken);
    
    if (storedToken) {
      console.log('AuthProvider: Processing stored token');
      setToken(storedToken);
      
      // Step 2: Decode JWT to extract user information
      // Note: In production, also validate token signature with backend
      try {
        // JWT structure: header.payload.signature (we need the payload)
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        console.log('AuthProvider: Decoded payload:', { 
          user_id: payload.user_id, 
          email: payload.email, 
          username: payload.username,
          exp: payload.exp 
        });
        
        // Step 3: Check if token is expired
        const currentTime = Date.now() / 1000; // JWT exp is in seconds
        if (payload.exp && payload.exp < currentTime) {
          // Token is expired - clean up and reset state
          console.log('AuthProvider: Token is expired');
          localStorage.removeItem('authToken');
          setToken(null);
          setUser(null);
        } else {
          // Token is valid - restore user state
          console.log('AuthProvider: Setting user from token');
          setUser({
            id: payload.user_id,
            email: payload.email,
            username: payload.username,
            status: 'online'
          });
        }
      } catch (error) {
        // JWT decoding failed - token is malformed
        console.error('AuthProvider: Invalid token:', error);
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
      }
    } else {
      console.log('AuthProvider: No stored token found');
    }
    
    // Step 4: Mark initialization as complete
    // This allows components to render and prevents race conditions
    console.log('AuthProvider: Initialization complete');
    setIsLoading(false);
  }, []); // Empty dependency array - only run once on mount

  /**
   * Login method - called after successful Google OAuth
   * 
   * This method is called by the AuthCallback component when the user
   * returns from Google OAuth. It stores both the token and user data.
   * 
   * @param newToken - JWT token from the backend
   * @param newUser - User object decoded from the token
   */
  const login = (newToken: string, newUser: User) => {
    console.log('AuthProvider: Logging in user:', newUser.username);
    setToken(newToken);
    setUser(newUser);
    // Persist token for future sessions
    localStorage.setItem('authToken', newToken);
  };

  /**
   * Logout method - clears all authentication state
   * 
   * Removes the token from both memory and localStorage,
   * effectively logging the user out across all tabs/windows.
   */
  const logout = () => {
    console.log('AuthProvider: Logging out user');
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
  };

  // Computed authentication status - user is authenticated if both token and user exist
  const isAuthenticated = !!token && !!user;

  // Debug logging to track authentication state changes
  // This helps diagnose auth issues during development
  console.log('AuthProvider: Current state', { 
    hasToken: !!token, 
    hasUser: !!user, 
    isAuthenticated, 
    isLoading,
    username: user?.username 
  });

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access authentication context
 * 
 * This hook provides a convenient way for components to access authentication
 * state and methods. It includes error checking to ensure it's used within
 * an AuthProvider.
 * 
 * Usage:
 * const { user, token, isAuthenticated, login, logout } = useAuth();
 * 
 * @throws Error if used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};