import axios from 'axios';

const baseURL = 'http://38.38.251.86:8000/api';
const imageBaseURL = 'http://38.38.251.86:8001';

const api = axios.create({
  baseURL,
  timeout: 10000,
});

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

// 使用统一的文章接口，通过type区分不同类型
export const fetchArticles = (type, size = 10, index = 1) => {
  return api.get(`/articles?size=${size}&index=${index}&type=${type}`);
};

// 处理图片URL，确保完整的图片路径
export const getFullImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${imageBaseURL}${url}`;
};

export default api;
