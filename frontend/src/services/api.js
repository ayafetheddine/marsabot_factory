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

export function uploadKnowledgeFile(botId, file) {
  const formData = new FormData();
  formData.append('botId', botId);
  formData.append('file', file);
  return api.post('/knowledge/upload', formData);
}

export function getBotDocuments(botId) {
  return api.get(`/knowledge/${botId}/documents`);
}

export function deleteBotDocument(botId, docId) {
  return api.delete(`/knowledge/${botId}/documents/${docId}`);
}

export function addBotApiSource(botId, url) {
  return api.post(`/knowledge/${botId}/api-sources`, { url });
}

export function getBotApiSources(botId) {
  return api.get(`/knowledge/${botId}/api-sources`);
}

export function deleteBotApiSource(botId, sourceId) {
  return api.delete(`/knowledge/${botId}/api-sources/${sourceId}`);
}
