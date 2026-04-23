import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function login(email, password) {
  const response = await api.post('/admin/login', { email, password });
  const token = response.data?.token;

  if (token) {
    localStorage.setItem('token', token);
  }

  return response.data;
}

export function getBots() {
  return api.get('/bots');
}

export function createBot(botData) {
  return api.post('/bots', botData);
}
