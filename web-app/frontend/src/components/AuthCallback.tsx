/**
 * AuthCallback.tsx - OAuth Callback Handler Component
 * 
 * This component handles the OAuth callback from Google after user authentication.
 * It's the endpoint where the backend redirects users with their JWT token after
 * successful Google OAuth completion.
 * 
 * Process Flow:
 * 1. User completes Google OAuth
 * 2. Backend processes OAuth and generates JWT
 * 3. Backend redirects to /auth/callback?token=<jwt>
 * 4. This component extracts the token from URL
 * 5. Decodes JWT to get user information
 * 6. Updates AuthContext with login information
 * 7. Redirects to dashboard
 * 
 * Error Handling:
 * - Missing token: Redirects to login page
 * - Invalid token: Logs error and redirects to login
 * - JWT decode errors: Handles gracefully
 * 
 * Critical: This component must update the AuthContext properly to ensure
 * authentication state persists across the application.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * AuthCallback Component
 * 
 * Processes OAuth callback and establishes user session.
 * This component should only be rendered when users return from Google OAuth.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  /**
   * Effect: Process OAuth callback on component mount
   * 
   * This effect runs once when the component mounts and:
   * 1. Extracts JWT token from URL parameters
   * 2. Validates and decodes the token
   * 3. Creates user object from token claims
   * 4. Updates AuthContext via login method
   * 5. Redirects to appropriate page
   */
  useEffect(() => {
    console.log('AuthCallback: Processing OAuth callback');
    
    // Extract token from URL query parameters
    // URL format: /auth/callback?token=<jwt-token>
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      console.log('AuthCallback: JWT token found in URL');
      
      try {
        // Decode JWT payload to extract user information
        // JWT structure: header.payload.signature (we need payload)
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('AuthCallback: Decoded token payload:', {
          user_id: payload.user_id,
          username: payload.username,
          email: payload.email
        });
        
        // Create user object matching our User interface
        const user = {
          id: payload.user_id,
          email: payload.email,
          username: payload.username,
          status: 'online' as const  // Set user as online after login
        };
        
        // Update AuthContext with login information
        // This will trigger re-renders across the app and establish session
        console.log('AuthCallback: Updating auth context');
        login(token, user);
        
        // Redirect to dashboard (protected route)
        console.log('AuthCallback: Redirecting to dashboard');
        navigate('/dashboard');
      } catch (error) {
        // JWT decoding failed - token is malformed
        console.error('AuthCallback: Failed to process authentication:', error);
        navigate('/');
      }
    } else {
      // No token in URL - OAuth failed or URL was accessed directly
      console.log('AuthCallback: No token found, redirecting to login');
      navigate('/');
    }
  }, [navigate, login]); // Dependencies: navigate and login functions

  // Loading UI while processing authentication
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <p>Processing authentication...</p>
    </div>
  );
};

export default AuthCallback;