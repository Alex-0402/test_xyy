import axios from 'axios';
import { 
  mockLogin, 
  mockRefreshToken, 
  mockLogout, 
  mockChangePassword, 
  mockGetSecurityQuestions, 
  mockResetPassword, 
  mockSetSecurityQuestions 
} from './mockApi';

const BASE_URL = 'http://localhost:8000/api';
const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

// 开发模式标志，设置为true以使用模拟API
export const USE_MOCK_API = true;

// 检查用户是否已登录
export const isAuthenticated = () => {
  return !!localStorage.getItem(TOKEN_KEY);
};

// 获取当前的访问令牌
export const getAccessToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// 保存访问令牌
export const setAccessToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
  // 设置axios默认请求头
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// 保存刷新令牌
export const setRefreshToken = (token) => {
  localStorage.setItem(REFRESH_KEY, token);
};

// 获取刷新令牌
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_KEY);
};

// 清除所有令牌
export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  delete axios.defaults.headers.common['Authorization'];
};

// 登录请求
export const loginUser = async (username, password) => {
  if (USE_MOCK_API) {
    const response = mockLogin(username, password);
    if (response.status === 999) {
      setRefreshToken(response.refresh);
      // 直接请求access token
      await refreshAccessTokenFromMock(response.refresh);
    }
    return response;
  } else {
    try {
      const response = await axios.post(`${BASE_URL}/token/`, {
        username,
        password
      });
      
      if (response.data.status === 999) {
        setRefreshToken(response.data.refresh);
      }
      return response.data;
    } catch (error) {
      return {
        status: 1000,
        message: error.response?.data?.message || '登录失败，请检查网络连接'
      };
    }
  }
};

// 刷新访问令牌
export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return Promise.reject(new Error('No refresh token available'));
  }
  
  if (USE_MOCK_API) {
    return refreshAccessTokenFromMock(refreshToken);
  }
  
  try {
    const response = await axios.post(`${BASE_URL}/token/refresh/`, {
      refresh: refreshToken
    });
    
    if (response.data.status === 999) {
      const accessToken = response.data.access;
      setAccessToken(accessToken);
      return accessToken;
    } else {
      clearTokens();
      return Promise.reject(new Error(response.data.message || 'Failed to refresh token'));
    }
  } catch (error) {
    clearTokens();
    return Promise.reject(error);
  }
};

// 从mock数据刷新token
const refreshAccessTokenFromMock = async (refreshToken) => {
  const response = mockRefreshToken(refreshToken);
  if (response.status === 999) {
    const accessToken = response.access;
    setAccessToken(accessToken);
    return accessToken;
  } else {
    clearTokens();
    return Promise.reject(new Error(response.message || 'Failed to refresh token'));
  }
};

// 登出用户
export const logoutUser = async () => {
  if (USE_MOCK_API) {
    clearTokens();
    return mockLogout();
  } else {
    try {
      const refreshToken = getRefreshToken();
      const token = getAccessToken();
      
      if (refreshToken && token) {
        await axios.post(`${BASE_URL}/logout/`, {
          refresh: refreshToken
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      clearTokens();
      return { status: 999, message: '登出成功' };
    } catch (error) {
      clearTokens();
      return { status: 1000, message: '登出过程中发生错误' };
    }
  }
};

// 修改密码
export const changePassword = async (oldPassword, newPassword) => {
  try {
    console.log('修改密码参数:', { oldPassword, newPassword });
    
    if (USE_MOCK_API) {
      // 在模拟API中，目前只使用oldPassword进行验证
      const response = await mockChangePassword(oldPassword);
      console.log('模拟修改密码响应:', response);
      return response;
    } else {
      // 真实API调用，传入旧密码和新密码
      const response = await changePasswordApi(oldPassword, newPassword);
      console.log('真实修改密码响应:', response);
      return response;
    }
  } catch (error) {
    console.error('修改密码错误:', error);
    throw error;
  }
};

// 获取用户安全问题
export const getUserSecurityQuestions = async (username) => {
  if (USE_MOCK_API) {
    return mockGetSecurityQuestions(username);
  } else {
    try {
      const response = await axios.get(`${BASE_URL}/user-security-questions/${username}/`);
      return response.data;
    } catch (error) {
      return {
        status: 1000,
        message: error.response?.data?.message || '获取安全问题失败'
      };
    }
  }
};

// 重置密码
export const resetPassword = async (username, questionId, answer, newPassword) => {
  if (USE_MOCK_API) {
    return mockResetPassword(username, questionId, answer);
  } else {
    try {
      const response = await axios.post(`${BASE_URL}/reset-password/`, {
        username,
        question_id: questionId,
        answer,
        new_password: newPassword
      });
      
      return response.data;
    } catch (error) {
      return {
        status: 1000,
        message: error.response?.data?.message || '密码重置失败'
      };
    }
  }
};

// 设置安全问题
export const setSecurityQuestions = async (questions) => {
  console.log('进入设置安全问题函数，使用Mock API:', USE_MOCK_API);
  console.log('传入的安全问题数据:', questions);
  
  if (USE_MOCK_API) {
    // 模拟延迟，更像真实API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      status: 999,
      message: '安全问题设置成功'
    };
  } else {
    try {
      const token = getAccessToken();
      if (!token) {
        console.error('没有访问令牌');
        return { status: 1006, message: '请先登录' };
      }
      
      const response = await axios.post(`${BASE_URL}/security-questions/`, {
        questions
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('安全问题设置API错误:', error);
      return {
        status: 1000,
        message: error.response?.data?.message || '安全问题设置失败'
      };
    }
  }
};

// 为axios配置请求拦截器，在每个请求前检查token是否有效
export const setupAxiosInterceptors = () => {
  // 如果使用模拟API，则不需要配置拦截器
  if (USE_MOCK_API) return;
  
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // 如果返回401错误且不是刷新token的请求，尝试刷新token
      if (error.response?.status === 401 && !originalRequest._retry && 
          originalRequest.url !== `${BASE_URL}/token/refresh/`) {
        originalRequest._retry = true;
        
        try {
          await refreshAccessToken();
          // 更新原始请求的认证头
          originalRequest.headers['Authorization'] = `Bearer ${getAccessToken()}`;
          // 重试原始请求
          return axios(originalRequest);
        } catch (refreshError) {
          // 如果刷新token失败，清除所有token并让用户重新登录
          clearTokens();
          window.location.href = '/login'; // 重定向到登录页面
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );
};
