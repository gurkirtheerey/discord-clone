import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryProvider } from "./providers/QueryProvider";
import { useUserStore } from "./store/userStore";
import { useUser, useBackendStatus } from "./hooks/useUser";
import GoogleLoginButton from "./components/GoogleLoginButton";
import AuthCallback from "./components/AuthCallback";
import Dashboard from "./components/Dashboard";

const LoginPage = () => {
  const { user, token, isAuthenticated, isLoading } = useUserStore();
  const userQuery = useUser();
  const backendStatusQuery = useBackendStatus();

  // Redirect to dashboard if authenticated
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  console.log("LoginPage: Auth state", {
    hasToken: !!token,
    isAuthenticated,
    isLoading,
    user,
    userQueryLoading: userQuery.isLoading,
    userQueryData: userQuery.data,
  });

  return (
    <div className="min-h-screen bg-blue-500 p-8">
      <h1 className="text-4xl font-bold text-white">Discord Clone</h1>
      <p className="text-xl text-gray-200">Sign in to continue</p>

      <div className="card">
        {!isAuthenticated && <GoogleLoginButton />}

        <div
          style={{
            marginTop: "30px",
            paddingTop: "20px",
            borderTop: "1px solid #eee",
          }}
        >
          <h3>Backend Status Check</h3>

          {backendStatusQuery.isLoading && <p>Loading backend status...</p>}
          {backendStatusQuery.error && (
            <div style={{ color: "red", marginBottom: "1rem" }}>
              Backend Error: {backendStatusQuery.error.message}
            </div>
          )}
          {backendStatusQuery.data && (
            <div style={{ marginBottom: "1rem" }}>
              <p>✅ Backend connected: {backendStatusQuery.data.message}</p>
              <p>Status: {backendStatusQuery.data.status}</p>
            </div>
          )}

          <div
            style={{
              marginTop: "20px",
              paddingTop: "20px",
              borderTop: "1px solid #eee",
            }}
          >
            <h3>Authentication Debug</h3>
            <p>Store Loading: {isLoading ? "Yes" : "No"}</p>
            <p>Has Token: {token ? "Yes" : "No"}</p>
            <p>Is Authenticated: {isAuthenticated ? "Yes" : "No"}</p>
            <p>User Query Enabled: {!!token && !isLoading ? "Yes" : "No"}</p>
            <p>User Query Loading: {userQuery.isLoading ? "Yes" : "No"}</p>
            <p>
              User Query Error:{" "}
              {userQuery.error ? userQuery.error.message : "None"}
            </p>
          </div>

          {isAuthenticated && (
            <div
              style={{
                marginTop: "20px",
                paddingTop: "20px",
                borderTop: "1px solid #eee",
              }}
            >
              <h3>User Information</h3>
              {userQuery.isLoading && <p>Loading user data...</p>}
              {userQuery.error && (
                <div style={{ color: "red", marginBottom: "1rem" }}>
                  User Error: {userQuery.error.message}
                </div>
              )}
              {user && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px",
                    backgroundColor: "#e8f5e8",
                    borderRadius: "4px",
                  }}
                >
                  <strong>Authenticated User:</strong>
                  <p>Username: {user.username}</p>
                  <p>Email: {user.email}</p>
                  <p>User ID: {user.user_id}</p>
                </div>
              )}
            </div>
          )}

          <button onClick={() => backendStatusQuery.refetch()}>
            Test Backend Connection
          </button>
        </div>
      </div>

      <p className="read-the-docs">
        Frontend: http://localhost:5173 | Backend: http://localhost:8080
      </p>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useUserStore();

  console.log("ProtectedRoute: Auth state", { isAuthenticated, isLoading });

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

const AppContent = () => {
  const { isLoading, initialize } = useUserStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
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
    <QueryProvider>
      <Router>
        <AppContent />
      </Router>
    </QueryProvider>
  );
}

export default App;
