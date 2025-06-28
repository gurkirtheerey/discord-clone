import React from 'react';
import { useUserStore } from '../store/userStore';
import Sidebar from './Sidebar';

const Dashboard: React.FC = () => {
  const { user } = useUserStore();

  return (
    <div className="flex h-screen bg-gray-800">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-gray-700 shadow-sm border-b border-gray-600">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-300">Welcome back, {user?.username}!</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-400">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-800 p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, <span className="text-purple-400">{user?.username}</span>!
            </h1>
            <p className="text-gray-300">
              Ready to chat with your friends and communities?
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700 rounded-xl p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Status</p>
                  <p className="text-xl font-semibold text-white">Online</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-xl p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Friends</p>
                  <p className="text-xl font-semibold text-white">12</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-xl p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1-2H8l-1 2H5V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-300">Servers</p>
                  <p className="text-xl font-semibold text-white">5</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="bg-gray-700 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Profile Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400 font-medium w-20">ID:</span>
                  <span className="text-white font-mono text-sm bg-gray-800 px-3 py-1 rounded">{user?.user_id}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400 font-medium w-20">Email:</span>
                  <span className="text-white">{user?.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400 font-medium w-20">Username:</span>
                  <span className="text-white font-semibold">{user?.username}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400 font-medium w-20">Provider:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white capitalize">{user?.provider || 'google'}</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt="Profile"
                    className="w-24 h-24 rounded-full ring-4 ring-purple-500/50"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Success Banner */}
          <div className="bg-green-800/30 border border-green-600/50 rounded-xl p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-base font-semibold text-green-400">🎉 Authentication Successful!</h3>
                <p className="text-gray-300 text-sm mt-1">
                  You have successfully logged in using Google OAuth. Your Discord clone is ready to use!
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;