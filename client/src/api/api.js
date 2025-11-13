import axios from 'axios';

const BASE = (process.env.REACT_APP_API_URL || 'http://localhost:3000') + (process.env.REACT_APP_API_PREFIX || '');

const client = axios.create({
  baseURL: BASE,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' }
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const auth = {
  login: (payload) => client.post('/auth/login', payload)
};

export const employees = {
  list: (params) => client.get('/employees', { params }),
  get: (id) => client.get(`/employees/${id}`),
  create: (payload) => client.post('/employees', payload),
  update: (id, payload) => client.put(`/employees/${id}`, payload),
  remove: (id) => client.delete(`/employees/${id}`)
};

export default client;
