import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBackendUrl = () => {
  // 1. Check for environment variable defined via EXPO_PUBLIC_API_URL
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Extract host IP when running via Expo Go on physical device (local dev)
  const hostUri = Constants.expoConfig?.hostUri || Constants.experienceUrl || '';
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:5000/api`;
    }
  }

  // 3. Deployed live production Render backend for standalone APK
  return 'https://campusevents-61un.onrender.com/api';
};

export const API_BASE_URL = getBackendUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach JWT token to requests if present in AsyncStorage
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('campusevents_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Failed to retrieve token from storage', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
