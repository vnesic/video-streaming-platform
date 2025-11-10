import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Subscription API
export const subscriptionAPI = {
  getPlans: () => api.get('/subscription/plans'),
  createCheckout: (planId) => api.post('/subscription/checkout', { planId }),
  getSubscription: () => api.get('/subscription/current'),
  cancelSubscription: () => api.post('/subscription/cancel'),
};

// Video API
export const videoAPI = {
  getVideos: (params) => api.get('/videos', { params }),
  getVideoById: (id) => api.get(`/videos/${id}`),
  getPlaybackUrl: (id) => api.get(`/videos/${id}/play`),
  getWatchHistory: () => api.get('/videos/history'),
  updateProgress: (id, progress, completed) =>
    api.put(`/videos/${id}/progress`, { progress, completed }),
  getCategories: () => api.get('/videos/categories'),
  uploadVideo: (data) => api.post('/videos/upload', data),
};

export default api;
