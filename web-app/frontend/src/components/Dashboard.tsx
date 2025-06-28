import React from 'react';
import { useUserStore } from '../store/userStore';

const Dashboard: React.FC = () => {
  const { user, logout } = useUserStore();

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <div>
          <h1>Welcome to Discord Clone</h1>
          <p>Hello, {user?.username}!</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {user?.avatar_url && (
            <img 
              src={user.avatar_url} 
              alt="Profile"
              style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%' 
              }}
            />
          )}
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2>User Information</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '10px' }}>
              <strong>ID:</strong> {user?.user_id}
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong>Email:</strong> {user?.email}
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong>Username:</strong> {user?.username}
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong>Provider:</strong> {user?.provider || 'google'}
            </li>
          </ul>
        </div>

        <div style={{ 
          marginTop: '20px',
          padding: '20px', 
          backgroundColor: '#e8f5e8',
          borderRadius: '8px',
          border: '1px solid #28a745'
        }}>
          <h3>🎉 Google Authentication Successful!</h3>
          <p>You have successfully logged in using Google OAuth. Your Discord clone is ready to use!</p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;