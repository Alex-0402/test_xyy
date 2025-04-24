import axios from 'axios';
import { getAccessToken, refreshAccessToken } from './auth';

// 使用与auth.js相同的基础URL
const BASE_URL = 'http://38.38.251.86:8000/api';
const MEDIA_BASE_URL = 'http://38.38.251.86:8001';

/**
 * 辅助函数 - 获取有效token并处理刷新
 */
const getValidToken = async () => {
  const token = getAccessToken();
  if (!token) {
    console.log('Token不存在，尝试刷新...');
    await refreshAccessToken().catch(error => {
      console.error('刷新token失败:', error);
      throw new Error('未登录或登录已过期，请重新登录');
    });
    return getAccessToken();
  }
  return token;
};

/**
 * 辅助函数 - 处理401错误并重试请求
 */
const handleAuthError = async (error, requestFn, ...args) => {
  if (error.response?.status === 401) {
    console.log('权限验证失败，尝试刷新token...');
    try {
      await refreshAccessToken();
      return await requestFn(...args);
    } catch (refreshError) {
      console.error('刷新token后重试失败:', refreshError);
      throw new Error('登录已过期，请重新登录');
    }
  }
  throw error;
};

/**
 * 医生相关API函数集合
 */

// 获取医生列表
export const fetchDoctors = async (pageSize = 10, pageIndex = 1) => {
  try {
    console.log('调用API获取医生列表');
    const response = await axios.get(`${BASE_URL}/doctors/`, {
      params: { size: pageSize, index: pageIndex }
    });
    console.log('医生列表API响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取医生信息失败:', error);
    if (error.response) {
      console.log('错误响应数据:', error.response.data);
      console.log('错误状态码:', error.response.status);
    }
    throw error;
  }
};

// 获取单个医生详情
export const getDoctorDetail = async (id) => {
  try {
    // 确保ID为数字类型
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new Error('ID格式错误，无法转换为数字');
    }
    
    const response = await axios.get(`${BASE_URL}/doctors/${numericId}/`);
    console.log('获取医生详情响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取医生详情失败:', error);
    throw error;
  }
};

// 创建新医生
export const createDoctor = async (doctorData) => {
  try {
    const currentToken = await getValidToken();
    
    // 准备符合API文档的数据
    const submitData = {
      name: doctorData.name,
      title: doctorData.title || '',
      introduction: doctorData.introduction || '',
      avatar_url: doctorData.avatar_url || null
    };
    
    const url = `${BASE_URL}/doctors/`;
    console.log('POST创建医生URL:', url);
    
    const response = await axios({
      method: 'POST',
      url,
      data: submitData,
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('创建医生API响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('创建医生失败:', error);
    return handleAuthError(error, createDoctor, doctorData);
  }
};

// 更新医生信息
export const updateDoctor = async (id, doctorData) => {
  try {
    const currentToken = await getValidToken();
    
    // 确保ID为数字类型
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new Error('ID格式错误，无法转换为数字');
    }
    
    const url = `${BASE_URL}/doctors/${numericId}/`;
    console.log('PUT更新医生URL:', url);
    
    const response = await axios({
      method: 'PUT',
      url,
      data: doctorData,
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log('更新医生响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('更新医生错误:', error);
    if (error.response) {
      console.log('错误状态码:', error.response.status);
      console.log('错误响应数据:', error.response.data);
    }
    return handleAuthError(error, updateDoctor, id, doctorData);
  }
};

// 删除医生
export const deleteDoctor = async (id) => {
  try {
    const currentToken = await getValidToken();
    
    // 确保ID为数字类型
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new Error('ID格式错误，无法转换为数字');
    }
    
    const url = `${BASE_URL}/doctors/${numericId}/`;
    console.log('DELETE请求URL:', url);
    
    const response = await axios({
      method: 'DELETE',
      url,
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Accept': 'application/json'
      },
      timeout: 15000
    });
    
    return response.status === 204 ? { code: 204, message: '删除成功' } : response.data;
  } catch (error) {
    console.error('删除医生错误:', error);
    if (error.response) {
      console.log('错误状态码:', error.response.status);
      console.log('错误响应数据:', error.response.data);
    }
    return handleAuthError(error, deleteDoctor, id);
  }
};

// 上传医生头像
export const uploadDoctorAvatar = async (doctorId, imageFile) => {
  try {
    const currentToken = await getValidToken();
    
    // 确保ID为数字类型
    const numericId = parseInt(doctorId, 10);
    if (isNaN(numericId)) {
      throw new Error('医生ID格式错误，无法转换为数字');
    }
    
    // 创建FormData对象
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const url = `${BASE_URL}/upload/doctor-avatar/${numericId}/`;
    console.log('上传医生头像URL:', url);
    
    const response = await axios({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000
    });
    
    console.log('上传医生头像响应:', response.data);
    
    // 如果成功，返回完整的URL
    if (response.data && response.data.url) {
      response.data.fullUrl = MEDIA_BASE_URL + response.data.url;
    }
    
    return response.data;
  } catch (error) {
    console.error('上传医生头像失败:', error);
    if (error.response) {
      console.log('错误状态码:', error.response.status);
      console.log('错误响应数据:', error.response.data);
    }
    return handleAuthError(error, uploadDoctorAvatar, doctorId, imageFile);
  }
};

// 格式化后端返回的医生数据为前端需要的格式
export const formatDoctorData = (doctor) => {
  return {
    id: doctor.id,
    name: doctor.name,
    title: doctor.title || '',
    department: doctor.department || null,
    avatarUrl: doctor.avatar_url ? (MEDIA_BASE_URL + doctor.avatar_url) : '',
    intro: doctor.introduction || '暂无简介'
  };
};
