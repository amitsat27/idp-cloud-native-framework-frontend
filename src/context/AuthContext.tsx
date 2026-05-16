import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../api/axios';

interface User {
  user_id: string;
  username: string;
  role: 'VIEWER' | 'OPERATOR' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth?: () => Promise<void>;
  error: string | null;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasCheckedAuth = useRef(false);

  // Check if user is already logged in by verifying token is still valid
  const checkAuth = async () => {
    // Prevent multiple auth checks
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;
    console.log('Running auth check...');

    try {
      setIsLoading(true);
      const response = await api.get('/api/v1/auth/me');
      if (response.data) {
        setIsAuthenticated(true);
        setUser({
          user_id: response.data.user_id,
          username: response.data.username,
          role: response.data.role,
        });
      }
    } catch (err: any) {
      console.log('Auth check failed:', err.response?.status);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setError(null);
      const response = await api.post('/api/v1/auth/login', {
        username,
        password,
      });
      
      if (response.data) {
        setUser({
          user_id: response.data.user_id,
          username: response.data.username,
          role: response.data.role,
        });
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Login failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const signup = async (username: string, email: string, password: string, role: string = "VIEWER") => {
    try {
      setError(null);
      const response = await api.post('/api/v1/auth/signup', {
        username,
        email,
        password,
        password_confirm: password,
        role,
      });
      
      if (response.data) {
        setError(null);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Signup failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    } catch (err: any) {
      console.error('Logout failed:', err);
      // Still clear local state even if logout request fails
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
        checkAuth,
        error,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
