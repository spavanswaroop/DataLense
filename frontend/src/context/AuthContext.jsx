import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('datalens_token'));
  const [loading, setLoading] = useState(true);

  // Restore authenticated session on initial mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem('datalens_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/auth/me');
        setUser(response.data);
      } catch (error) {
        console.error('Session restoration failed:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = response.data;
    localStorage.setItem('datalens_token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);
    return response.data;
  };

  const register = async (username, email, password) => {
    const response = await apiClient.post('/auth/register', { username, email, password });
    const { token: receivedToken, user: receivedUser } = response.data;
    localStorage.setItem('datalens_token', receivedToken);
    setToken(receivedToken);
    setUser(receivedUser);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('datalens_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

