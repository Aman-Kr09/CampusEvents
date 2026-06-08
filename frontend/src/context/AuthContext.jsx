import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useCollege } from './CollegeContext';

const AuthContext = createContext();

// Create default Axios instance for API routing
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Configure Axios interceptors to automatically inject authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('campusevents_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const { selectCollege } = useCollege();

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('campusevents_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            if (res.data.user.college) {
              selectCollege(res.data.user.college);
            }
          }
        } catch (err) {
          console.error('Session expired or error loading user profile:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('campusevents_token', res.data.token);
      if (res.data.user.college) {
        selectCollege(res.data.user.college);
      }
    }
    return res.data;
  };

  const register = async (name, email, password, collegeId, branch, year) => {
    const res = await api.post('/auth/register', { name, email, password, collegeId, branch, year });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('campusevents_token', res.data.token);
      if (res.data.user.college) {
        selectCollege(res.data.user.college);
      }
    }
    return res.data;
  };

  const googleLogin = async (googlePayload) => {
    const res = await api.post('/auth/google', googlePayload);
    if (res.data.success && res.data.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('campusevents_token', res.data.token);
      if (res.data.user.college) {
        selectCollege(res.data.user.college);
      }
    }
    return res.data;
  };

  const completeOnboarding = async (interests, branch, year) => {
    const res = await api.put('/auth/profile/onboarding', { interests, branch, year });
    if (res.data.success) {
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('campusevents_token');
  };

  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    if (res.data.success) {
      setUser(res.data.user);
    }
    return res.data;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      googleLogin,
      completeOnboarding,
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
