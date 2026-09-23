import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data.user);
    } catch (err) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // login({ email, password }) — called from LoginPage
  const login = async (credentials) => {
    const response = await authAPI.login(credentials.email, credentials.password);
    const { token: authToken } = response.data;
    setToken(authToken);
    localStorage.setItem('token', authToken);
    // Fetch full profile so user object has all fields (address, phone, etc.)
    try {
      const profileRes = await authAPI.getCurrentUser();
      setUser(profileRes.data.user);
    } catch {
      setUser(response.data.user);
    }
    return response.data;
  };

  // register(data) — called from RegisterPage
  const register = async (data) => {
    const response = await authAPI.signup(data);
    const { user: userData, token: authToken } = response.data;
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    return response.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const updateUser = (updated) => {
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
