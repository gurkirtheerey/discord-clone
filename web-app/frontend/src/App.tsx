import { useState, useEffect } from "react";
import "./App.css";

interface ApiResponse {
  message: string;
  status: string;
}

function App() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:8080/api/hello");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="App">
      <h1>React + Go Web App</h1>

      <div className="card">
        {loading && <p>Loadingg...</p>}

        {error && (
          <div style={{ color: "red", marginBottom: "1rem" }}>
            Error: {error}
          </div>
        )}

        {data && (
          <div style={{ marginBottom: "1rem" }}>
            <h3>Response from Go Backend:</h3>
            <p>Message: {data.message}</p>
            <p>Status: {data.status}</p>
          </div>
        )}

        <button onClick={fetchData}>Refresh Data</button>
      </div>

      <p className="read-the-docs">
        Frontend running on http://localhost:5173 | Backend running on
        http://localhost:8080
      </p>
    </div>
  );
}

export default App;
