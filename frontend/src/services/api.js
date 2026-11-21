import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Centralized Axios client for CampusFlow backend services.
 * - withCredentials enabled for HTTP-only refresh cookies.
 * - In-memory access token storage support via interceptor.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let inMemoryAccessToken = null;

export const setAccessToken = (token) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => inMemoryAccessToken;

// Request interceptor attaches Bearer token if present
api.interceptors.request.use(
  (config) => {
    if (inMemoryAccessToken) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor handles standard error shaping
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If backend returns 401 and not already on an auth refresh route,
    // future batch will hook automatic token refresh logic here.
    return Promise.reject(error);
  }
);

export default api;
