import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { fetchDepartments, getDepartmentDetail, createDepartment, updateDepartment, deleteDepartment } from '../utils/departmentApi';
import { getAccessToken, refreshAccessToken, API_BASE_URL, MEDIA_BASE_URL } from '../utils/auth';
import { formatDoctorData } from '../utils/doctorApi';
import axios from 'axios';

export const useKeshiStore = defineStore('keshi', () => {
  // 存储所有科室信息
  const keshiList = ref([]);
  
  // 当前选中的科室
  const activeKeshi = ref(null);
  
  // 加载状态
  const loading = ref(false);
  
  // 错误信息
  const error = ref(null);

  // 设置当前选中的科室
  function setActiveKeshi(keshi) {
    activeKeshi.value = keshi;
    // 当选择新科室时，自动尝试获取该科室的详情数据
    if (keshi && keshi.id) {
      fetchDepartmentDetail(keshi.id);
    }
  }

  // 获取有效token并处理刷新
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

  // 从API获取所有科室列表
  async function fetchDepartmentsData() {
    loading.value = true;
    error.value = null;
    
    try {
      console.log('调用API获取科室列表');
      const response = await fetchDepartments();
      
      if (response && response.code === 200 && Array.isArray(response.data)) {
        // 处理API返回的科室数据
        keshiList.value = response.data.map(dept => ({
          id: dept.id,
          name: dept.name,
          description: dept.introduction || '',
          workDays: parseWorkDays(dept.work_days),
          openHours: dept.open_hours || '08:00-17:00',
          phone: dept.phone || '',
          doctors: (dept.doctors || []).map(doc => {
            if (typeof doc === 'object') {
              return formatDoctorData(doc);
            } else {
              return { id: doc };
            }
          })
        }));
        
        // 如果有科室且没有选中的科室，默认选中第一个
        if (keshiList.value.length > 0 && !activeKeshi.value) {
          setActiveKeshi(keshiList.value[0]);
        }
      } else {
        throw new Error(response?.message || '获取科室列表格式错误');
      }
      
      return keshiList.value;
    } catch (err) {
      console.error('获取科室列表失败:', err);
      error.value = '获取科室列表失败: ' + (err.message || '未知错误');
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 获取科室详情
  async function fetchDepartmentDetail(departmentId) {
    loading.value = true;
    error.value = null;
    
    try {
      console.log(`获取科室${departmentId}详情`);
      const response = await getDepartmentDetail(departmentId);
      
      if (response && response.code === 200 && response.data) {
        const dept = response.data;
        
        // 更新科室详情
        const departmentDetail = {
          id: dept.id,
          name: dept.name,
          description: dept.introduction || '',
          workDays: parseWorkDays(dept.work_days),
          openHours: dept.open_hours || '08:00-17:00',
          phone: dept.phone || '',
          // 处理医生数据
          doctors: (dept.doctors || []).map(doc => {
            if (typeof doc === 'object') {
              return {
                id: doc.id,
                name: doc.name,
                title: doc.title || '',
                avatarUrl: doc.avatar_url ? (MEDIA_BASE_URL + doc.avatar_url) : '',
                introduction: doc.introduction || '暂无简介'
              };
            } else {
              return { id: doc };
            }
          })
        };
        
        // 获取科室排班
        await fetchDepartmentSchedules(departmentId, departmentDetail);
        
        // 如果是当前选中的科室，更新它
        if (activeKeshi.value && activeKeshi.value.id === departmentId) {
          activeKeshi.value = departmentDetail;
        }
        
        return departmentDetail;
      } else {
        throw new Error(response?.message || '获取科室详情格式错误');
      }
    } catch (err) {
      console.error(`获取科室${departmentId}详情失败:`, err);
      error.value = '获取科室详情失败: ' + (err.message || '未知错误');
      throw err;
    } finally {
      loading.value = false;
    }
  }
  
  // 获取科室排班
  async function fetchDepartmentSchedules(departmentId, departmentDetail) {
    try {
      console.log(`获取科室${departmentId}排班`);
      const response = await axios.get(`${API_BASE_URL}/departments/${departmentId}/schedules/`);
      console.log('科室排班API响应:', response.data);
      
      if (response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
        // 处理排班数据
        const schedules = response.data.data || [];
        
        // 将排班信息添加到科室详情中
        departmentDetail.schedules = schedules;
        
        // 解析工作日
        const workDays = [];
        const today = new Date();
        
        schedules.forEach(schedule => {
          if (schedule.is_scheduled && schedule.doctors && schedule.doctors.length > 0) {
            // cycle_day 是从当天开始计算的天数，1表示今天，2表示明天，以此类推
            if (schedule.cycle_day >= 1 && schedule.cycle_day <= 14) {
              // 计算这一天是星期几 (0-6, 0代表周日)
              const scheduleDate = new Date(today);
              scheduleDate.setDate(today.getDate() + schedule.cycle_day - 1);
              const dayOfWeek = scheduleDate.getDay();
              
              // 将这个星期几添加到工作日列表中
              workDays.push(dayOfWeek);
            }
          }
        });
        
        // 去重，确保每个星期几只出现一次
        departmentDetail.workDays = [...new Set(workDays)];
      }
    } catch (err) {
      console.error(`获取科室${departmentId}排班失败:`, err);
      // 不阻止整体流程，仅记录错误
      console.warn('继续处理科室详情，但排班数据可能不完整');
    }
  }
  
  // 解析工作日数据
  function parseWorkDays(workDaysStr) {
    if (!workDaysStr) return []; // 默认空
    
    try {
      if (typeof workDaysStr === 'string') {
        return workDaysStr.split(',').map(day => parseInt(day.trim()));
      } else if (Array.isArray(workDaysStr)) {
        return workDaysStr;
      }
    } catch (e) {
      console.error('解析工作日数据错误:', e);
    }
    
    return []; // 解析失败则默认空
  }

  // 创建或更新科室
  async function saveOrUpdateDepartment(departmentData) {
    loading.value = true;
    error.value = null;
    
    try {
      let response;
      
      const formattedData = {
        name: departmentData.name,
        introduction: departmentData.description || '',
        doctor_ids: departmentData.doctorIds || []
      };

      if (departmentData.id) {
        // 更新现有科室
        response = await updateDepartment(departmentData.id, formattedData);
      } else {
        // 创建新科室
        response = await createDepartment(formattedData);
      }

      console.log('保存科室响应:', response);
      
      if (response && (response.code === 200 || response.code === 201) && response.data) {
        // 刷新科室列表
        await fetchDepartmentsData();
        
        // 如果是更新当前选中的科室，重新获取详情
        if (departmentData.id && activeKeshi.value && activeKeshi.value.id === departmentData.id) {
          await fetchDepartmentDetail(departmentData.id);
        }
        
        return response.data;
      } else {
        throw new Error(response?.message || '保存科室格式错误');
      }
    } catch (err) {
      console.error('保存科室失败:', err);
      error.value = '保存科室失败: ' + (err.message || '未知错误');
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 删除科室
  async function removeDepartment(departmentId) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await deleteDepartment(departmentId);
      
      if (response && (response.code === 204 || response.code === 200)) {
        // 从列表中移除已删除的科室
        keshiList.value = keshiList.value.filter(dept => dept.id !== departmentId);
        
        // 如果当前选中的是被删除的科室，重置选中状态
        if (activeKeshi.value && activeKeshi.value.id === departmentId) {
          activeKeshi.value = keshiList.value.length > 0 ? keshiList.value[0] : null;
        }
        
        return response.data || { id: departmentId, deleted: true };
      } else {
        throw new Error(response?.message || '删除科室格式错误');
      }
    } catch (err) {
      console.error('删除科室失败:', err);
      error.value = '删除科室失败: ' + (err.message || '未知错误');
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    keshiList,
    activeKeshi,
    loading,
    error,
    setActiveKeshi,
    fetchDepartments: fetchDepartmentsData,
    fetchDepartmentDetail,
    saveOrUpdateDepartment,
    deleteDepartment: removeDepartment
  };
});
