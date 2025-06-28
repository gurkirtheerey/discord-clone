/**
 * GoogleLoginButton.tsx - Google OAuth Login Button Component
 * 
 * This component provides a styled button that initiates Google OAuth login.
 * When clicked, it redirects the user to the backend OAuth endpoint which
 * then redirects to Google for authentication.
 * 
 * Features:
 * - Custom Google-branded styling with official colors
 * - Google logo SVG icon
 * - Hover effects for better UX
 * - Error handling with optional callback
 * 
 * OAuth Flow Initiation:
 * User clicks button -> Redirect to /auth/google/login -> Google OAuth
 * 
 * This component starts the OAuth flow but doesn't handle the callback.
 * The callback is handled by the AuthCallback component.
 */

import React from 'react';

/**
 * Props for the GoogleLoginButton component
 */
interface GoogleLoginButtonProps {
  onError?: (error: string) => void; // Optional error handler callback
}

/**
 * GoogleLoginButton Component
 * 
 * Renders a Google-branded login button that initiates OAuth flow.
 * Uses window.location.href to redirect to the backend OAuth endpoint.
 * 
 * @param onError Optional callback for handling errors
 */
const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onError }) => {
  /**
   * Handles Google login button click
   * 
   * Redirects the user to the backend OAuth endpoint, which will:
   * 1. Generate a state parameter for CSRF protection
   * 2. Redirect to Google OAuth with our client credentials
   * 3. User completes OAuth on Google's site
   * 4. Google redirects back to our callback endpoint
   */
  const handleGoogleLogin = async () => {
    try {
      // Redirect to backend OAuth endpoint
      // This starts the OAuth flow on the server side
      window.location.href = 'http://localhost:8080/auth/google/login';
    } catch (error) {
      // Handle any client-side errors (rare for simple redirect)
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      onError?.(errorMessage);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      style={{
        // Layout and spacing
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px 24px',
        
        // Google brand colors and styling
        backgroundColor: '#4285f4',  // Google blue
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        
        // Typography
        fontSize: '16px',
        fontWeight: '500',
        
        // Interaction
        cursor: 'pointer',
        transition: 'background-color 0.2s',
      }}
      // Hover effect using inline event handlers
      // In a larger app, consider using CSS classes or styled-components
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = '#357ae8'; // Darker blue on hover
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = '#4285f4'; // Return to original color
      }}
    >
      {/* Google Logo SVG - Official Google brand colors */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Blue section (top right) */}
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        {/* Green section (bottom right) */}
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        {/* Yellow section (left) */}
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        {/* Red section (top left) */}
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      Sign in with Google
    </button>
  );
};

export default GoogleLoginButton;