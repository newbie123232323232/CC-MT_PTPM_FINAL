import axios from 'axios';

const client = axios.create({
  baseURL: '',
});

client.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.accessToken) {
        config.headers = config.headers || {};
        config.headers.token = `Bearer ${user.accessToken}`;
      }
    }
  } catch (_) {
    /* ignore */
  }
  return config;
});

export default client;
