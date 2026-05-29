import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// 🔹 Интерцептор запроса: добавляем JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔹 Интерцептор ответа: обработка 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const get = <T>(url: string, config?: AxiosRequestConfig) =>
  api.get<T>(url, config).then(res => res.data);

export const post = <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
  api.post<T>(url, data, config).then(res => res.data);

export const put = <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
  api.put<T>(url, data, config).then(res => res.data);

export const del = <T>(url: string, config?: AxiosRequestConfig) =>
  api.delete<T>(url, config).then(res => res.data);

export default api;