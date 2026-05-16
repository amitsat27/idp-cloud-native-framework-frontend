import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - add auth token from cookie to headers
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;
    const url = error.config?.url || '';
    
    // Ignore debounce for auth check endpoint
    if (url.includes('/auth/me')) {
      return Promise.reject(error);
    }
    
    // Skip redirect for /auth login endpoint
    if (url.includes('/auth/login')) {
      return Promise.reject(error);
    }
    
    // 401 - token expired/invalid on protected routes
    if (status === 401) {
      window.location.href = '/login?expired=1';
    }
    
    // 403 - account deactivated
    if (status === 403 && detail?.includes('deactivated')) {
      window.location.href = '/login?deactivated=1';
    }
    
    return Promise.reject(error);
  }
);

export default api;