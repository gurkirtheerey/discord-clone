import React from 'react';
import { useUserStore } from '../store/userStore';

const Sidebar: React.FC = () => {
  const { user, logout } = useUserStore();

  const servers = [
    { id: 1, name: 'General', avatar: '🌐', memberCount: 42 },
    { id: 2, name: 'Gaming Hub', avatar: '🎮', memberCount: 156 },
    { id: 3, name: 'Dev Team', avatar: '💻', memberCount: 23 },
    { id: 4, name: 'Music Lounge', avatar: '🎵', memberCount: 89 },
  ];

  return (
    <div className="w-72 bg-gray-900 h-screen flex flex-col">
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          {user?.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt="Profile"
              className="w-10 h-10 rounded-full ring-2 ring-purple-500/50"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{user?.username}</p>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-400">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto">
        {/* Main Actions */}
        <div className="p-3">
          <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-sm font-medium">Home</span>
          </button>
        </div>

        {/* Servers Section */}
        <div className="px-3 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Servers</h3>
            <button className="text-gray-400 hover:text-white">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-1">
            {servers.map((server) => (
              <button 
                key={server.id}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors group"
              >
                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-sm group-hover:bg-gray-600">
                  {server.avatar}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{server.name}</p>
                  <p className="text-xs text-gray-500">{server.memberCount} members</p>
                </div>
                <div className="w-2 h-2 bg-gray-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            ))}
          </div>
        </div>

        {/* Add Server Button */}
        <div className="px-3 mb-4">
          <button className="w-full flex items-center justify-center space-x-2 px-3 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Add Server</span>
          </button>
        </div>

        {/* Explore Section */}
        <div className="px-3 mb-4">
          <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Explore Servers</span>
          </button>
        </div>
      </div>

      {/* Sign Out Button */}
      <div className="p-3 border-t border-gray-800">
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 01-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;