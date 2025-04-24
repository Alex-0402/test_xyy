import axios from 'axios';
import { getAccessToken, refreshAccessToken } from './auth';

// 使用与auth.js相同的基础URL
const BASE_URL = 'http://38.38.251.86:8000/api';

/**
 * 科室相关API函数集合
 */

// 获取科室列表
export const fetchDepartments = async () => {
  try {
    console.log('调用API获取科室列表');
    const response = await axios.get(`${BASE_URL}/departments/`);
    console.log('科室列表API响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取科室信息失败:', error);
    if (error.response) {
      console.log('错误响应数据:', error.response.data);
      console.log('错误状态码:', error.response.status);
    }
    throw error;
  }
};

// 创建新科室
export const createDepartment = async (departmentData) => {
  try {
    // 先确保获取最新的有效token
    const token = getAccessToken();
    if (!token) {
      console.log('Token不存在，尝试刷新...');
      await refreshAccessToken().catch(error => {
        console.error('刷新token失败:', error);
        throw new Error('未登录或登录已过期，请重新登录');
      });
    }

    const currentToken = getAccessToken();
    console.log('发送创建科室请求，使用token:', currentToken ? '已设置' : '未设置');
    
    const response = await axios.post(
      `${BASE_URL}/departments/`, 
      departmentData,
      {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('创建科室API响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('创建科室失败:', error);
    
    // 处理401错误
    if (error.response?.status === 401) {
      console.log('权限验证失败，尝试刷新token...');
      try {
        // 尝试刷新token
        await refreshAccessToken();
        
        // 使用新token重新发送请求
        const newToken = getAccessToken();
        const retryResponse = await axios.post(
          `${BASE_URL}/departments/`, 
          departmentData,
          {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('使用新token重试后响应:', retryResponse.data);
        return retryResponse.data;
      } catch (refreshError) {
        console.error('刷新token后重试失败:', refreshError);
        throw new Error('登录已过期，请重新登录');
      }
    }
    
    if (error.response) {
      console.log('错误响应详情:', error.response.data);
      console.log('错误状态码:', error.response.status);
    }
    throw error;
  }
};

// 更新科室信息
export const updateDepartment = async (id, departmentData) => {
  try {
    // 获取token
    const token = getAccessToken();
    if (!token) {
      console.log('Token不存在，尝试刷新...');
      await refreshAccessToken().catch(error => {
        console.error('刷新token失败:', error);
        throw new Error('未登录或登录已过期，请重新登录');
      });
    }

    // 使用最新token
    const currentToken = getAccessToken();
    
    // 确保ID为数字类型
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      console.error('ID格式错误，无法转换为数字:', id);
      throw new Error('ID格式错误，无法转换为数字');
    }
    
    // 构建正确的URL
    const url = `${BASE_URL}/departments/${numericId}/`;
    console.log('PUT更新科室URL:', url);
    console.log('PUT更新科室数据:', departmentData);
    
    // 发送请求
    const response = await axios({
      method: 'PUT',
      url: url,
      data: departmentData,
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000  // 增加超时时间
    });
    
    console.log('更新科室响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('更新科室错误:', error);
    if (error.response) {
      console.log('错误状态码:', error.response.status);
      console.log('错误响应数据:', error.response.data);
    }
    throw error;
  }
};

// 删除科室
export const deleteDepartment = async (id) => {
  try {
    // 获取token
    const token = getAccessToken();
    if (!token) {
      console.log('Token不存在，尝试刷新...');
      await refreshAccessToken().catch(error => {
        console.error('刷新token失败:', error);
        throw new Error('未登录或登录已过期，请重新登录');
      });
    }
    
    // 使用最新token
    const currentToken = getAccessToken();
    
    // 确保ID为数字类型
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      console.error('ID格式错误，无法转换为数字:', id);
      throw new Error('ID格式错误，无法转换为数字');
    }
    
    // 构建正确的URL
    const url = `${BASE_URL}/departments/${numericId}/`;
    console.log('DELETE请求URL:', url);
    
    // 发送请求
    const response = await axios({
      method: 'DELETE',
      url: url,
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Accept': 'application/json'
      },
      timeout: 15000  // 增加超时时间
    });
    
    console.log('删除科室响应:', response);
    return response.status === 204 ? { code: 204, message: '删除成功' } : response.data;
  } catch (error) {
    console.error('删除科室错误:', error);
    if (error.response) {
      console.log('错误状态码:', error.response.status);
      console.log('错误响应数据:', error.response.data);
    }
    throw error;
  }
};

// 获取单个科室详情
export const getDepartmentDetail = async (id) => {
  try {
    // 确保ID为数字类型
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      console.error('ID格式错误，无法转换为数字:', id);
      throw new Error('ID格式错误，无法转换为数字');
    }
    
    const response = await axios.get(`${BASE_URL}/departments/${numericId}/`);
    console.log('获取科室详情响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取科室详情失败:', error);
    throw error;
  }
};
