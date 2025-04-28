import axios from 'axios';
import { getAccessToken } from '../utils/auth'; // 修正了导入的函数名

// 修正为正确的后端API端口
const BASE_URL = 'http://38.38.251.86:8000/api';

/**
 * 获取所有科室信息
 */
export async function getDepartments() {
  try {
    const response = await axios.get(`${BASE_URL}/departments/`);
    if (response.data.code === 200 && response.data.type === 'department') {
      return response.data.data;
    }
    throw new Error('获取科室数据失败');
  } catch (error) {
    console.error('获取科室列表出错:', error);
    throw error;
  }
}

/**
 * 获取科室未来两周的排班
 * @param {number} departmentId - 科室ID
 */
export async function getDepartmentSchedules(departmentId) {
  try {
    const response = await axios.get(`${BASE_URL}/departments/${departmentId}/schedules/`);
    if (response.data.code === 200) {
      return response.data.data;
    }
    throw new Error('获取科室排班失败');
  } catch (error) {
    console.error('获取科室排班出错:', error);
    throw error;
  }
}

/**
 * 获取所有医生信息
 */
export async function getDoctors() {
  try {
    const response = await axios.get(`${BASE_URL}/doctors`);
    if (response.data.code === 200 && response.data.type === 'doctor') {
      return response.data.data.doctor_list;
    }
    throw new Error('获取医生数据失败');
  } catch (error) {
    console.error('获取医生列表出错:', error);
    throw error;
  }
}

/**
 * 获取单个排班详情
 * @param {number} scheduleId - 排班ID
 */
export async function getScheduleDetail(scheduleId) {
  try {
    const response = await axios.get(`${BASE_URL}/schedules/${scheduleId}/`);
    if (response.data.code === 200) {
      return response.data.data;
    }
    throw new Error('获取排班详情失败');
  } catch (error) {
    console.error('获取排班详情出错:', error);
    throw error;
  }
}

/**
 * 更新排班信息
 * @param {number} scheduleId - 排班ID
 * @param {object} data - 更新数据
 */
export async function updateSchedule(scheduleId, data) {
  try {
    const token = getAccessToken(); // 修正了函数名
    
    if (!token) {
      throw new Error('未登录或token已过期');
    }
    console.log('data:', data);
    const response = await axios.put(
      `${BASE_URL}/schedules/${scheduleId}/`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (response.data.code === 200) {
      return response.data.data;
    }
    throw new Error('更新排班失败');
  } catch (error) {
    // 检查是否是 token 问题
    if (error.response && error.response.data && 
        (error.response.data.code === 'token_not_valid' || 
         error.response.data.detail === 'Given token not valid for any token type')) {
      
      // Token无效，提示用户重新登录
      throw new Error('身份验证失败，请重新登录');
    }
    
    console.error('更新排班出错:', error);
    throw error;
  }
}

/**
 * 获取科室对应医生列表
 * @param {number} departmentId - 科室ID
 */
export async function getDepartmentDoctors(departmentId) {
  try {
    const response = await axios.get(`${BASE_URL}/departments/${departmentId}/`);
    if (response.data.code === 200) {
      return response.data.data.doctors || [];
    }
    throw new Error('获取科室医生列表失败');
  } catch (error) {
    console.error('获取科室医生列表出错:', error);
    throw error;
  }
}
