// import axios from 'axios';

// const BASE = (process.env.REACT_APP_API_URL || 'http://localhost:3000') + (process.env.REACT_APP_API_PREFIX || '');

// const client = axios.create({
//   baseURL: BASE,
//   withCredentials: false,
//   headers: { 'Content-Type': 'application/json' }
// });

// client.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token') || sessionStorage.getItem('token');
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// export const auth = {
//   login: (payload) => client.post('/auth/login', payload)
// };

// export const employees = {
//   list: (params) => client.get('/users', { params }),
//   get: (id) => client.get(`/users/${id}`),
//   create: (payload) => client.post('/users', payload),
//   update: (id, payload) => client.patch(`/users/${id}`, payload),
//   remove: (id) => client.delete(`/users/${id}`)
// };

// export default client;


import axios from 'axios';

// --- CONFIGURATION DE BASE DE L'API ---
// Définit l'URL de base et ajoute le préfixe '/api'
// L'URL de base sera : http://localhost:3000/api
const BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3000') + '/api';

// Création de l'instance Axios
const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: false, // À maintenir à false si vous utilisez des tokens (JWT) plutôt que des cookies
  headers: { 
    'Content-Type': 'application/json' 
  }
});

// --- INTERCEPTEUR DE REQUÊTE : GESTION DU TOKEN JWT ---
// Ajoute le token d'accès (Bearer Token) à chaque requête sortante
client.interceptors.request.use((config) => {
  // Tente de récupérer le token depuis localStorage (si 'remember me' est coché) ou sessionStorage
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (token) {
    // Si un token est trouvé, il est ajouté à l'en-tête Authorization
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});


// --- ENDPOINTS D'AUTHENTIFICATION (/auth) ---
export const auth = {
  /**
   * Envoie les identifiants pour se connecter et reçoit le JWT.
   * Route: POST /auth/login
   * @param {object} payload - { email, password }
   */
  login: (payload) => client.post('/auth/login', payload),

  /**
   * Enregistre un nouvel utilisateur.
   * Route: POST /auth/register
   * @param {object} payload - Les données d'enregistrement de l'utilisateur
   */
  register: (payload) => client.post('/auth/register', payload),

  /**
   * Récupère le profil de l'utilisateur authentifié (nécessite le token).
   * Route: GET /auth/me
   */
  getProfile: () => client.get('/auth/me'),

  /**
   * Déconnecte l'utilisateur.
   * Route: POST /auth/logout
   */
  logout: () => client.post('/auth/logout')
};

// --- ENDPOINTS DES EMPLOYÉS/UTILISATEURS (/users) ---
// Note: Utilise la ressource '/users' pour correspondre à votre UserController NestJS.
export const employees = {
  /**
   * Récupère la liste de tous les utilisateurs.
   * Route: GET /users
   * @param {object} params - Paramètres de requête (ex: { page: 1, limit: 10 })
   */
  list: (params) => client.get('/users', { params }),

  /**
   * Récupère un seul utilisateur par son ID.
   * Route: GET /users/:id
   * @param {number} id - L'ID de l'utilisateur
   */
  get: (id) => client.get(`/users/${id}`),

  /**
   * Crée un nouvel utilisateur.
   * Route: POST /users
   * @param {object} payload - Les données du nouvel utilisateur (CreateUserDto)
   */
  create: (payload) => client.post('/users', payload),

  /**
   * Met à jour partiellement un utilisateur existant.
   * Route: PATCH /users/:id (Utilise PATCH pour correspondre à votre UserController)
   * @param {number} id - L'ID de l'utilisateur à mettre à jour
   * @param {object} payload - Les données de mise à jour (UpdateUserDto)
   */
  update: (id, payload) => client.patch(`/users/${id}`, payload),

  /**
   * Supprime (soft-delete) un utilisateur par son ID.
   * Route: DELETE /users/:id
   * @param {number} id - L'ID de l'utilisateur à supprimer
   */
  remove: (id) => client.delete(`/users/${id}`)
};

// Exporte l'instance client Axios par défaut
export default client;