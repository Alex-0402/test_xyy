import axios from 'axios';

// 使用实际的服务器地址
const API_BASE_URL = 'http://38.38.251.86:8000/api';

/**
 * 获取token函数，从localStorage获取access_token
 * @returns {string} access_token
 */
const getToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * 获取所有科室数据
 * @returns {Promise} 包含科室数据的Promise
 */
export const fetchAllDepartments = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/departments/`);
    return response.data;
  } catch (error) {
    console.error('获取科室数据失败:', error);
    throw error;
  }
};

/**
 * 获取科室的默认排班规则
 * @param {number} departmentId 科室ID
 * @returns {Promise} 包含排班规则的Promise
 */
export const fetchDepartmentSchedules = async (departmentId) => {
  try {
    // 获取所有默认排班规则
    const response = await axios.get(`${API_BASE_URL}/default-schedules/`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      }
    });
    console.log('获取所有排班规则:', response.data);
    if (response.data.code === 200) {
      // 筛选出指定科室的排班规则
      const departmentSchedules = response.data.data.filter(
        schedule => schedule.department === departmentId
      );
      
      return {
        code: 200,
        message: "获取成功",
        data: departmentSchedules,
        type: "default_schedule_rule"
      };
    }
    
    return response.data;
  } catch (error) {
    console.error(`获取科室${departmentId}排班规则失败:`, error);
    // 返回一个空结果而不是抛出异常
    return {
      code: 200,
      message: "获取成功",
      data: [],
      type: "default_schedule_rule"
    };
  }
};

/**
 * 更新科室排班规则
 * @param {number} departmentId 科室ID
 * @param {Array} datesList 排班日期列表 (后端格式)
 * @returns {Promise} 包含更新结果的Promise
 */
export const updateDepartmentSchedule = async (departmentId, datesList) => {
  try {
    const requestData = {
      departments: [departmentId],
      schedules: {
        [departmentId]: [
          {
            department: departmentId,
            dates: datesList.join(',')
          }
        ]
      }
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/default-schedules/`,
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`更新科室${departmentId}排班规则失败:`, error);
    throw error;
  }
};

/**
 * 批量更新科室排班规则
 * @param {Object} departmentSchedules 科室ID与其排班规则的映射
 * @returns {Promise} 包含批量更新结果的Promise
 */
export const bulkUpdateDepartmentSchedules = async (departmentSchedules) => {
  try {
    const departmentIds = Object.keys(departmentSchedules);
    const schedules = {};
    
    departmentIds.forEach(id => {
      schedules[id] = [
        {
          department: Number(id),
          dates: departmentSchedules[id].join(',')
        }
      ];
    });
    
    const requestData = {
      departments: departmentIds.map(id => Number(id)),
      schedules: schedules
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/default-schedules/`,
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('批量更新科室排班规则失败:', error);
    throw error;
  }
};

/**
 * 前端日期格式转换为后端日期格式
 * 前端: 0=周日, 1=周一, ..., 6=周六
 * 后端: 0=周一, 1=周二, ..., 6=周日
 * @param {Array} frontendDates 前端日期格式的数组
 * @returns {Array} 后端日期格式的数组
 */
export const convertToBackendDates = (frontendDates) => {
  const backendDates = [];
  frontendDates.forEach((isWorkDay, index) => {
    if (isWorkDay === 1) {
      // 转换日期格式
      const backendDay = (index === 0) ? 6 : index - 1;
      backendDates.push(backendDay);
    }
  });
  return backendDates;
};

/**
 * 后端日期格式转换为前端日期格式
 * 后端: 0=周一, 1=周二, ..., 6=周日
 * 前端: 0=周日, 1=周一, ..., 6=周六
 * @param {Array} backendDates 后端日期格式的数组
 * @returns {Array} 前端工作日数组，元素为1表示工作日，0表示非工作日
 */
export const convertToFrontendWorkDays = (backendDates) => {
  const workDay = [0, 0, 0, 0, 0, 0, 0]; // 默认所有天都不排班
  
  backendDates.forEach(day => {
    // 转换日期格式
    const frontendDay = (day === 6) ? 0 : day + 1;
    workDay[frontendDay] = 1;
  });
  
  return workDay;
};
