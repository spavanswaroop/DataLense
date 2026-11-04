import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor for JWT token attachment (prepared for Week 2)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('datalens_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const healthApi = {
  checkBackendHealth: () => apiClient.get('/health'),
  checkMlServiceViaBackend: () => apiClient.get('/health/ml-service'),
};

export default apiClient;

