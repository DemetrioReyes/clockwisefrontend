import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/api';

// Helper function to format API error messages
export const formatErrorMessage = (error: any): string => {
  // Handle network errors
  if (!error.response) {
    return error.message || 'Error de conexión con el servidor';
  }

  // Handle errors without data
  if (!error.response.data) {
    return `Error ${error.response.status}: ${error.response.statusText || 'Error desconocido'}`;
  }

  const { detail } = error.response.data;

  // If detail is a string, return it directly
  if (typeof detail === 'string') {
    return detail;
  }

  // If detail is an array of validation errors (Pydantic/FastAPI format)
  if (Array.isArray(detail)) {
    try {
      return detail
        .map((err: any) => {
          if (typeof err === 'string') {
            return err;
          }
          if (err.msg && err.loc) {
            const field = Array.isArray(err.loc) ? err.loc.slice(1).join('.') : 'Campo';
            return `${field}: ${err.msg}`;
          }
          return JSON.stringify(err);
        })
        .join('; ');
    } catch (e) {
      return 'Error de validación en los datos enviados';
    }
  }

  // If detail is an object, try to extract meaningful info
  if (typeof detail === 'object' && detail !== null) {
    try {
      if (detail.message) {
        return String(detail.message);
      }
      return JSON.stringify(detail);
    } catch (e) {
      return 'Error del servidor';
    }
  }

  // Fallback
  return 'Ha ocurrido un error';
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_type');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
