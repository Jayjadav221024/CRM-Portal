import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('crm_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('crm_token');

      window.dispatchEvent(new Event('auth:logout'));
    }

    return Promise.reject(error);
  }
);

// AUTH API
export const authApi = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);

    return response.data;
  },
};

// LEADS API
export const leadsApi = {
  getLeads: async (params) => {
    const response = await api.get('/leads', { params });

    return response.data;
  },

  search: async (query) => {
    const response = await api.get('/leads/search', {
      params: { q: query },
    });

    return response.data;
  },

  getOwners: async () => {
    const response = await api.get('/leads/owners');

    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/leads/stats');

    return response.data;
  },

  createLead: async (data) => {
    const response = await api.post('/leads', data);

    return response.data;
  },

  updateLead: async (id, data) => {
    const response = await api.put(`/leads/${id}`, data);

    return response.data;
  },

  deleteLead: async (id) => {
    const response = await api.delete(`/leads/${id}`);

    return response.data;
  },
};

export default api;