import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  // Re-sync with the server once on load so cached fields (like a SuperCoins balance earned
  // since the last login) are up to date without requiring a fresh login.
  useEffect(() => {
    if (user) refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/users/login', { email, password });
    setUser(data);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/users/register', payload);
    setUser(data);
    return data;
  };

  const logout = async () => {
    await api.post('/users/logout');
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const { data } = await api.get('/users/profile');
      setUser(data);
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
