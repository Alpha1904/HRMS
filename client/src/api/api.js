import axios from 'axios';

// --- CONFIGURATION DE BASE DE L'API ---
const BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3000') + '/api';

// Création de l'instance Axios
const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 
    'Content-Type': 'application/json' 
  }
});

// --- INTERCEPTEUR DE REQUÊTE : AJOUT DU TOKEN JWT ---
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- ENDPOINTS D'AUTHENTIFICATION (/auth) ---
export const auth = {
  register: (payload) => client.post('/auth/register', payload),
  login: (payload) => client.post('/auth/login', payload),
  refreshToken: (payload) => client.post('/auth/refresh', payload),
  getProfile: () => client.get('/auth/me'),
  logout: () => client.post('/auth/logout'),
  sendOtp: () => client.post('/auth/otp'),
  verifyOtp: (payload) => client.post('/auth/verify-otp', payload),
  sendResetOtp: (payload) => client.post('/auth/forgot-pwd', payload),
  resetPassword: (payload) => client.post('/auth/reset-pwd', payload),
};

// --- ENDPOINTS DES UTILISATEURS (/users) ---
export const employees = {
  list: (params) => client.get('/users', { params }),
  get: (id) => client.get(`/users/${id}`),
  create: (payload) => client.post('/users', payload),
  update: (id, payload) => client.patch(`/users/${id}`, payload),
  remove: (id) => client.delete(`/users/${id}`),
};


// --- ENDPOINTS DES CONGÉS ET ABSENCES (/leaves) ---
export const leaves = {
  list: (params) => client.get('/leaves', { params }),
  // Vous pouvez ajouter d'autres méthodes CRUD ici si nécessaire (ex: get, create, update, remove)
  get: (id) => client.get(`/leaves/${id}`),
  create: (payload) => client.post('/leaves', payload),
  update: (id, payload) => client.patch(`/leaves/${id}`, payload),
  remove: (id) => client.delete(`/leaves/${id}`),
};

// --- ENDPOINTS DES EVALUATIONS (/evaluations) ---
export const evaluations = {
  list: (params) => client.get('/evaluations', { params }),
  get: (id) => client.get(`/evaluations/${id}`),
  create: (payload) => client.post('/evaluations', payload),
  update: (id, payload) => client.patch(`/evaluations/${id}`, payload),
  remove: (id) => client.delete(`/evaluations/${id}`),
};

// Export de l’instance Axios par défaut
export default client;
