import axios from 'axios';
import { 
  departmentsList, 
  departmentDetail, 
  createDepartmentResponse, 
  updateDepartmentResponse, 
  deleteDepartmentResponse,
  departmentSchedules
} from './departmentData';

// 保存原始的axios方法
const originalAxios = {
  get: axios.get,
  post: axios.post,
  put: axios.put,
  delete: axios.delete
};

// 模拟请求延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 覆盖axios方法
axios.get = async (url, config) => {
  await delay(1000); // 模拟网络延迟
  
  // 处理科室列表
  if (url === '/api/departments/') {
    return Promise.resolve({ data: departmentsList });
  }
  
  // 处理科室详情
  const deptDetailMatch = url.match(/\/api\/departments\/(\d+)\//);
  if (deptDetailMatch) {
    const id = deptDetailMatch[1];
    return Promise.resolve({ data: departmentDetail(id) });
  }
  
  // 处理科室排班
  const scheduleMatch = url.match(/\/api\/departments\/(\d+)\/schedules\//);
  if (scheduleMatch) {
    const id = scheduleMatch[1];
    return Promise.resolve({ data: departmentSchedules(id) });
  }
  
  // 如果没有匹配的模拟数据，使用原始axios
  return originalAxios.get(url, config);
};

axios.post = async (url, data, config) => {
  await delay(1000); // 模拟网络延迟
  
  // 处理创建科室
  if (url === '/api/departments/') {
    return Promise.resolve({ data: createDepartmentResponse(data) });
  }
  
  // 如果没有匹配的模拟数据，使用原始axios
  return originalAxios.post(url, data, config);
};

axios.put = async (url, data, config) => {
  await delay(1000); // 模拟网络延迟
  
  // 处理更新科室
  const match = url.match(/\/api\/departments\/(\d+)\//);
  if (match) {
    const id = match[1];
    return Promise.resolve({ data: updateDepartmentResponse(id, data) });
  }
  
  // 如果没有匹配的模拟数据，使用原始axios
  return originalAxios.put(url, data, config);
};

axios.delete = async (url, config) => {
  await delay(1000); // 模拟网络延迟
  
  // 处理删除科室
  const match = url.match(/\/api\/departments\/(\d+)\//);
  if (match) {
    const id = match[1];
    return Promise.resolve({ data: deleteDepartmentResponse(id) });
  }
  
  // 如果没有匹配的模拟数据，使用原始axios
  return originalAxios.delete(url, config);
};

export default {
  // 提供一个方法来恢复原始的axios行为
  restore() {
    axios.get = originalAxios.get;
    axios.post = originalAxios.post;
    axios.put = originalAxios.put;
    axios.delete = originalAxios.delete;
  }
};
