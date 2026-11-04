import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

// Interceptor for JWT token attachment
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

export const datasetApi = {
  uploadDataset: (formData, onProgress) => apiClient.post('/datasets', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  }),
  getDatasets: () => apiClient.get('/datasets'),
  getDatasetById: (id) => apiClient.get(`/datasets/${id}`),
  deleteDataset: (id) => apiClient.delete(`/datasets/${id}`),
};

export const analysisApi = {
  triggerAnalysis: (datasetId) => apiClient.post(`/datasets/${datasetId}/analyze`),
  getDatasetAnalyses: (datasetId) => apiClient.get(`/datasets/${datasetId}/analyses`),
  getAnalysisById: (id) => apiClient.get(`/analyses/${id}`),
  getColumnProfiles: (id) => apiClient.get(`/analyses/${id}/columns`),
};

export default apiClient;
