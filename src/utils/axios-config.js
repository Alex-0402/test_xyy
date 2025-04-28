import axios from 'axios';
import { API_BASE_URL } from '../stores/api-config';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    // 允许跨域请求带上cookie
    config.withCredentials = true;
    
    // 在这里可以添加token认证
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  error => {
    console.error('请求错误', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  response => {
    // 对响应数据进行处理
    console.log('API响应:', response.data);
    return response;
  },
  error => {
    if (error.response) {
      // 请求已发送，服务器返回了状态码
      console.error('响应错误:', error.response.status, error.response.data);
      
      // 这里可以处理各种HTTP错误
      switch (error.response.status) {
        case 401:
          console.error('认证失败，需要重新登录');
          // 可以在这里处理token过期
          break;
          
        case 403:
          console.error('权限不足');
          break;
          
        case 404:
          console.error('请求资源不存在');
          break;
          
        case 500:
          console.error('服务器错误');
          break;
          
        default:
          console.error(`HTTP错误: ${error.response.status}`);
      }
    } else if (error.request) {
      // 请求已发送，但没有收到响应
      console.error('没有收到响应:', error.request);
    } else {
      // 在设置请求时发生了错误
      console.error('请求错误:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
