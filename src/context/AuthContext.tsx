import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types';
import { joinUserRoom, joinVendorRoom } from '../services/socket';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  registerStudent: (data: any) => Promise<{ success: boolean; message?: string }>;
  registerVendor: (data: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('campus_eats_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      if (!localStorage.getItem('campus_eats_token')) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await api.get('/auth/me');
      if (res.data && res.data.user) {
        setUser(res.data.user);
        // Connect sockets to user room & vendor room if applicable
        joinUserRoom(res.data.user.id);
        if (res.data.user.vendorId) {
          joinVendorRoom(res.data.user.vendorId);
        }
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = res.data;

      localStorage.setItem('campus_eats_token', newToken);
      setToken(newToken);
      setUser(userData);

      joinUserRoom(userData.id);
      if (userData.vendorId) {
        joinVendorRoom(userData.vendorId);
      }

      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, message: msg };
    }
  };

  const registerStudent = async (data: any) => {
    try {
      const res = await api.post('/auth/register/student', data);
      const { token: newToken, user: userData } = res.data;

      localStorage.setItem('campus_eats_token', newToken);
      setToken(newToken);
      setUser(userData);

      joinUserRoom(userData.id);

      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed.';
      return { success: false, message: msg };
    }
  };

  const registerVendor = async (data: any) => {
    try {
      const res = await api.post('/auth/register/vendor', data);
      const { token: newToken, user: userData } = res.data;

      localStorage.setItem('campus_eats_token', newToken);
      setToken(newToken);
      setUser(userData);

      joinUserRoom(userData.id);
      if (userData.vendorId) {
        joinVendorRoom(userData.vendorId);
      }

      return { success: true };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Vendor registration failed.';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('campus_eats_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        registerStudent,
        registerVendor,
        logout,
        refreshUser,
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
