
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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
  getSubscription: () => api.get('/subscription'),
  cancelSubscription: () => api.post('/subscription/cancel'),
};

// Video API (NEW - Add these to your file)
export const videoAPI = {
  // Get all videos with optional filters
  getVideos: (params) => api.get('/videos', { params }),
  
  // Get single video details
  getVideo: (id) => api.get(`/videos/${id}`),
  
  // Get playback URL (requires subscription)
  getPlaybackUrl: (id) => api.get(`/videos/${id}/play`),
  
  // Update watch progress
  updateProgress: (id, data) => api.put(`/videos/${id}/progress`, data),
  
  // Get user's watch history
  getWatchHistory: (params) => api.get('/videos/history', { params }),
  
  // Get available categories
  getCategories: () => api.get('/videos/categories'),
  
  // Upload video (admin/authenticated)
  uploadVideo: (data) => api.post('/videos/upload', data),
};

export default api;
