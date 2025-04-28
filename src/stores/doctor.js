import { defineStore } from 'pinia';
import { ref } from 'vue';
import { fetchDoctors, getDoctorDetail, createDoctor, updateDoctor, deleteDoctor, uploadDoctorAvatar, formatDoctorData } from '../utils/doctorApi';
import { getAccessToken, refreshAccessToken, API_BASE_URL, MEDIA_BASE_URL } from '../utils/auth';

export const useDoctorStore = defineStore('doctor', () => {
  // 存储所有医生信息
  const doctorList = ref([]);
  
  // 按科室ID存储医生列表
  const doctorsByDepartment = ref({});
  
  // 加载状态
  const loading = ref(false);
  
  // 错误信息
  const error = ref(null);

  // 获取所有医生
  async function fetchAllDoctors() {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetchDoctors();
      if (response && response.code === 200 && Array.isArray(response.data?.doctor_list)) {
        doctorList.value = response.data.doctor_list.map(formatDoctorData);
        return doctorList.value;
      } else {
        throw new Error(response?.message || '获取医生数据格式错误');
      }
    } catch (err) {
      console.error('获取医生列表失败:', err);
      error.value = '获取医生列表失败: ' + (err.message || '未知错误');
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 按科室获取医生列表
  async function fetchDoctorsByDepartment(departmentId) {
    if (!departmentId) {
      console.error('科室ID不能为空');
      return [];
    }

    loading.value = true;
    error.value = null;
    
    try {
      // 如果已经有缓存的数据，直接返回
      if (doctorsByDepartment.value[departmentId]) {
        return doctorsByDepartment.value[departmentId];
      }
      
      // 从部门详情API获取医生列表
      const response = await getDepartmentDetail(departmentId);
      
      if (response && response.code === 200 && response.data) {
        const doctors = response.data.doctors || [];
        
        // 格式化医生数据
        const formattedDoctors = doctors.map(doctor => {
          return {
            id: doctor.id,
            name: doctor.name,
            title: doctor.title || '',
            introduction: doctor.introduction || '暂无简介',
            avatarUrl: doctor.avatar_url ? (MEDIA_BASE_URL + doctor.avatar_url) : '',
            departmentId: departmentId
          };
        });
        
        // 存储到科室医生映射中
        doctorsByDepartment.value[departmentId] = formattedDoctors;
        
        return formattedDoctors;
      } else {
        throw new Error(response?.message || '获取科室医生数据格式错误');
      }
    } catch (err) {
      console.error(`获取科室${departmentId}的医生列表失败:`, err);
      error.value = '获取科室医生列表失败: ' + (err.message || '未知错误');
      return [];
    } finally {
      loading.value = false;
    }
  }
  
  // 获取单个医生详情
  async function getDoctorById(doctorId) {
    if (!doctorId) {
      console.error('医生ID不能为空');
      return null;
    }

    loading.value = true;
    error.value = null;
    
    try {
      const response = await getDoctorDetail(doctorId);
      
      if (response && response.code === 200 && response.data) {
        return formatDoctorData(response.data);
      } else {
        throw new Error(response?.message || '获取医生详情格式错误');
      }
    } catch (err) {
      console.error(`获取医生${doctorId}详情失败:`, err);
      error.value = '获取医生详情失败: ' + (err.message || '未知错误');
      return null;
    } finally {
      loading.value = false;
    }
  }
  
  // 创建医生
  async function addDoctor(doctorData) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await createDoctor(doctorData);
      
      if (response && response.code === 201 && response.data) {
        // 添加到医生列表
        const newDoctor = formatDoctorData(response.data);
        doctorList.value.push(newDoctor);
        
        // 如果有科室ID，也添加到对应科室的医生列表中
        if (doctorData.departmentId && doctorsByDepartment.value[doctorData.departmentId]) {
          doctorsByDepartment.value[doctorData.departmentId].push(newDoctor);
        }
        
        return newDoctor;
      } else {
        throw new Error(response?.message || '创建医生格式错误');
      }
    } catch (err) {
      console.error('创建医生失败:', err);
      error.value = '创建医生失败: ' + (err.message || '未知错误');
      throw err;
    } finally {
      loading.value = false;
    }
  }
  
  // 更新医生
  async function updateDoctorInfo(doctorId, doctorData) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await updateDoctor(doctorId, doctorData);
      
      if (response && (response.code === 200 || response.code === 201) && response.data) {
        const updatedDoctor = formatDoctorData(response.data);
        
        // 更新医生列表
        const index = doctorList.value.findIndex(doc => doc.id === doctorId);
        if (index !== -1) {
          doctorList.value[index] = updatedDoctor;
        }
        
        // 更新科室医生列表
        Object.keys(doctorsByDepartment.value).forEach(deptId => {
          const deptIndex = doctorsByDepartment.value[deptId].findIndex(doc => doc.id === doctorId);
          if (deptIndex !== -1) {
            doctorsByDepartment.value[deptId][deptIndex] = updatedDoctor;
          }
        });
        
        return updatedDoctor;
      } else {
        throw new Error(response?.message || '更新医生格式错误');
      }
    } catch (err) {
      console.error(`更新医生${doctorId}失败:`, err);
      error.value = '更新医生失败: ' + (err.message || '未知错误');
      throw err;
    } finally {
      loading.value = false;
    }
  }
  
  // 删除医生
  async function removeDoctorById(doctorId) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await deleteDoctor(doctorId);
      
      if (response && (response.code === 204 || response.code === 200)) {
        // 从医生列表移除
        doctorList.value = doctorList.value.filter(doc => doc.id !== doctorId);
        
        // 从各科室医生列表移除
        Object.keys(doctorsByDepartment.value).forEach(deptId => {
          doctorsByDepartment.value[deptId] = doctorsByDepartment.value[deptId].filter(doc => doc.id !== doctorId);
        });
        
        return { id: doctorId, deleted: true };
      } else {
        throw new Error(response?.message || '删除医生格式错误');
      }
    } catch (err) {
      console.error(`删除医生${doctorId}失败:`, err);
      error.value = '删除医生失败: ' + (err.message || '未知错误');
      throw err;
    } finally {
      loading.value = false;
    }
  }
  
  // 上传医生头像
  async function uploadAvatar(doctorId, imageFile) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await uploadDoctorAvatar(doctorId, imageFile);
      
      if (response && response.code === 201 && response.url) {
        // 更新医生头像URL
        const fullUrl = MEDIA_BASE_URL + response.url;
        
        // 更新医生列表
        const index = doctorList.value.findIndex(doc => doc.id === doctorId);
        if (index !== -1) {
          doctorList.value[index].avatarUrl = fullUrl;
        }
        
        // 更新科室医生列表
        Object.keys(doctorsByDepartment.value).forEach(deptId => {
          const deptIndex = doctorsByDepartment.value[deptId].findIndex(doc => doc.id === doctorId);
          if (deptIndex !== -1) {
            doctorsByDepartment.value[deptId][deptIndex].avatarUrl = fullUrl;
          }
        });
        
        return { id: doctorId, avatarUrl: fullUrl };
      } else {
        throw new Error(response?.message || '上传头像格式错误');
      }
    } catch (err) {
      console.error(`上传医生${doctorId}头像失败:`, err);
      error.value = '上传头像失败: ' + (err.message || '未知错误');
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    doctorList,
    doctorsByDepartment,
    loading,
    error,
    fetchAllDoctors,
    fetchDoctorsByDepartment,
    getDoctorById,
    addDoctor,
    updateDoctorInfo,
    removeDoctorById,
    uploadAvatar
  };
});
