import axios from 'axios';

export const baseURL = 'https://backend-i4kx.onrender.com';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const authData = localStorage.getItem('kb-auth-token');
  if (authData) {
    config.headers.Authorization = `Bearer ${authData}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Every successful response is wrapped as { success: true, data: <payload> }
    return response.data?.data !== undefined ? response.data.data : response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper to extract the error message from the backend's two error shapes
export const errMsg = (e: any): string => {
  const m = e.response?.data?.message;
  return Array.isArray(m) ? m[0] : (m ?? e.message ?? 'Something went wrong');
};
