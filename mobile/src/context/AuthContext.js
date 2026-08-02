import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Restore user session on app launch
  useEffect(() => {
    const loadStoredSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('campusevents_token');
        const storedUser = await AsyncStorage.getItem('campusevents_user');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
      } finally {
        setLoading(false);
      }
    };
    loadStoredSession();
  }, []);

  // Fetch approved colleges list
  const fetchColleges = async () => {
    try {
      const res = await api.get('/colleges');
      if (res.data.success) {
        setColleges(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch colleges:', err.message);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  // Student Sign Up
  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data;
        await AsyncStorage.setItem('campusevents_token', newToken);
        await AsyncStorage.setItem('campusevents_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed'
      };
    }
  };

  // Login (Student or Admin)
  const login = async (credentials) => {
    try {
      const res = await api.post('/auth/login', credentials);
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data;
        await AsyncStorage.setItem('campusevents_token', newToken);
        await AsyncStorage.setItem('campusevents_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed'
      };
    }
  };

  // Admin Login
  const adminLogin = async (credentials) => {
    try {
      const res = await api.post('/auth/admin-login', credentials);
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data;
        await AsyncStorage.setItem('campusevents_token', newToken);
        await AsyncStorage.setItem('campusevents_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Admin Login failed'
      };
    }
  };

  // Update Profile
  const updateProfile = async (formData) => {
    try {
      const res = await api.put('/auth/profile', formData);
      if (res.data.success) {
        const updatedUser = res.data.user;
        await AsyncStorage.setItem('campusevents_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Update failed'
      };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('campusevents_token');
      await AsyncStorage.removeItem('campusevents_user');
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error('Logout storage error:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        colleges,
        loading,
        login,
        adminLogin,
        register,
        updateProfile,
        logout,
        fetchColleges
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
