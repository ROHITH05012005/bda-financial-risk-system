import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export const predictCreditRisk = (data) => api.post('/predict/credit', data).then((r) => r.data);
export const predictFraud = (data) => api.post('/predict/fraud', data).then((r) => r.data);
export const explainCreditRisk = (data) => api.post('/explain/credit', data).then((r) => r.data);
export const explainFraud = (data) => api.post('/explain/fraud', data).then((r) => r.data);
export const runStressTest = (data) => api.post('/stress-test', data).then((r) => r.data);
export const getModelInfo = () => api.get('/model/info').then((r) => r.data);
export const getScenarios = () => api.get('/scenarios').then((r) => r.data);
export const getSystemInfo = () => api.get('/').then((r) => r.data);

export default api;
