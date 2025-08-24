import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: number;
  email: string;
  username?: string;
  full_name?: string;
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, username?: string, fullName?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Google OAuth
  useEffect(() => {
    const initializeGoogleAuth = async () => {
      try {
        // Load Google OAuth script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        script.onload = () => {
          if (window.google) {
            window.google.accounts.id.initialize({
              client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id',
              callback: handleGoogleSignIn,
            });
          }
        };
      } catch (error) {
        console.error('Failed to initialize Google Auth:', error);
      }
    };

    initializeGoogleAuth();
  }, []);

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      try {
        const decoded = jwtDecode(savedToken) as any;
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp > currentTime) {
          setToken(savedToken);
          fetchUser(savedToken);
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        localStorage.removeItem('auth_token');
      }
    }
    setIsLoading(false);
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      const response = await fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        throw new Error('Failed to fetch user');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('auth_token', data.access_token);
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      if (window.google) {
        window.google.accounts.id.prompt();
      } else {
        throw new Error('Google OAuth not initialized');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleGoogleSignIn = async (response: any) => {
    try {
      const authResponse = await fetch('/api/v1/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_token: response.credential }),
      });

      if (!authResponse.ok) {
        throw new Error('Google authentication failed');
      }

      const data = await authResponse.json();
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('auth_token', data.access_token);
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, username?: string, fullName?: string) => {
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          username, 
          full_name: fullName 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }

      const data = await response.json();
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('auth_token', data.access_token);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUser(token);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    loginWithGoogle,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Add Google OAuth types to window
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}
