import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create Axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle auth errors globally
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Handle 401 Unauthorized - clear token and redirect to login
      if (status === 401) {
        localStorage.removeItem('token');
        // Only redirect if not already on auth pages
        if (!window.location.pathname.includes('/login') &&
            !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
      }

      // Return the error response data for handling in services
      return Promise.reject(data || { success: false, message: 'An error occurred.' });
    }

    if (error.request) {
      return Promise.reject({
        success: false,
        message: 'Network error. Please check your connection.',
      });
    }

    return Promise.reject({
      success: false,
      message: error.message || 'An unexpected error occurred.',
    });
  }
);

export default api;
