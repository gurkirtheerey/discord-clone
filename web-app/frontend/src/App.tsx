import { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import GoogleLoginButton from './components/GoogleLoginButton';
import AuthCallback from './components/AuthCallback';
import Dashboard from './components/Dashboard';
import "./App.css";

interface ApiResponse {
  message: string;
  status: string;
  user?: {
    user_id: number;
    email: string;
    username: string;
  };
}

const LoginPage = () => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const { token, isAuthenticated, isLoading } = useAuth();
  
  console.log('LoginPage: Auth state', { hasToken: !!token, isAuthenticated, isLoading });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log('Sending token:', token.substring(0, 20) + '...');
      } else {
        console.log('No token available');
      }
      
      const response = await fetch("http://localhost:8080/api/hello", {
        headers
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse = await response.json();
      console.log('Response:', result);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isLoading) {
      fetchData();
    }
  }, [isLoading, fetchData]);

  return (
    <div className="App">
      <h1>Discord Clone</h1>
      <p>Sign in to continue</p>

      <div className="card">
        {authError && (
          <div style={{ color: "red", marginBottom: "1rem" }}>
            Auth Error: {authError}
          </div>
        )}
        
        <GoogleLoginButton onError={setAuthError} />
        
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <h3>Backend Status Check</h3>
          {loading && <p>Loading...</p>}

          {error && (
            <div style={{ color: "red", marginBottom: "1rem" }}>
              Error: {error}
            </div>
          )}

          {data && (
            <div style={{ marginBottom: "1rem" }}>
              <p>✅ Backend connected: {data.message}</p>
              <p>Status: {data.status}</p>
              {data.user && (
                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
                  <strong>Authenticated User:</strong>
                  <p>Username: {data.user.username}</p>
                  <p>Email: {data.user.email}</p>
                  <p>User ID: {data.user.user_id}</p>
                </div>
              )}
            </div>
          )}

          <button onClick={fetchData}>Test Backend Connection</button>
        </div>
      </div>

      <p className="read-the-docs">
        Frontend: http://localhost:5173 | Backend: http://localhost:8080
      </p>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  console.log('ProtectedRoute: Auth state', { isAuthenticated, isLoading });
  
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Loading...</p>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

const AppContent = () => {
  const { isLoading, isAuthenticated } = useAuth();
  
  console.log('AppContent: Auth state', { isLoading, isAuthenticated });
  
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Initializing...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
