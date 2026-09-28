import axios from 'axios';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Add token and Anti-CSRF token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const csrfToken = getCookie('XSRF-TOKEN');
  if (csrfToken) {
    config.headers['x-csrf-token'] = csrfToken;
  }
  return config;
});

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const donationAPI = {
  getAvailable: () => api.get('/donations/available'),
  getPublicAll: () => api.get('/donations/public'),
  getAll: () => api.get('/donations'),
  getById: (id) => api.get(`/donations/${id}`),
  create: (data) => api.post('/donations', data),
  getMyDonations: () => api.get('/donations/my-donations'),
  update: (id, data) => api.put(`/donations/${id}`, data),
  delete: (id) => api.delete(`/donations/${id}`),
};

export const requestAPI = {
  createRequest: (data) => api.post('/requests', data),
  getMyRequests: () => api.get('/requests/my-requests'),
  getAllRequests: () => api.get('/requests'),
  getDonationRequests: (donationId) => api.get(`/requests/donation/${donationId}`),
  getDonorRequests: () => api.get('/requests/my-donations'),
  approveRequest: (requestId) => api.put(`/requests/${requestId}/approve`),
  rejectRequest: (requestId) => api.put(`/requests/${requestId}/reject`),
  updateRequest: (requestId, data) => api.put(`/requests/${requestId}`, data),
  deleteRequest: (requestId) => api.delete(`/requests/${requestId}`),
};

export const pickupAPI = {
  // Manager endpoints
  getAll: () => api.get('/pickups'),
  getById: (id) => api.get(`/pickups/${id}`),
  update: (id, data) => api.put(`/pickups/${id}`, data),
  getApprovedRequests: () => api.get('/pickups/approved-requests'),
  // Shared schedule/status endpoints
  schedule: (data) => api.post('/pickups/schedule', data),
  complete: (id) => api.put(`/pickups/${id}/complete`),
  cancel: (id, issueMessage) => api.put(`/pickups/${id}/cancel`, { issueMessage }),
};

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/profile'),
  fetchCsrfToken: () => api.get('/csrf-token'),
};

export default api;
