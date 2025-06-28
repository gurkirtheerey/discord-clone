import { create } from 'zustand';

interface User {
  user_id: number;
  email: string;
  username: string;
  avatar_url?: string;
  google_id?: string;
  provider?: string;
  created_at?: string;
  updated_at?: string;
}

interface UserStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
  initialize: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  
  setUser: (user) => set({ user }),
  
  setToken: (token) => {
    localStorage.setItem('auth_token', token);
    set({ token, isAuthenticated: true });
  },
  
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  logout: () => {
    localStorage.removeItem('auth_token');
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false, 
      isLoading: false 
    });
  },
  
  initialize: () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      set({ 
        token, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } else {
      set({ 
        isAuthenticated: false, 
        isLoading: false 
      });
    }
  },
}));

export type { User, UserStore };