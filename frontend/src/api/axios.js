import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // relative — Vite proxies this locally, Vercel rewrites it in production
  withCredentials: true
});

export default api;