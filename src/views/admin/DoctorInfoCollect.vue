<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import PageTitle from '../../components/PageTitle.vue';
import UserDropdown from '../../components/UserDropdown.vue';
import { 
  fetchDoctors, 
  createDoctor, 
  updateDoctor, 
  deleteDoctor, 
  uploadDoctorAvatar,
  formatDoctorData,
  getDoctorDetail
} from '../../utils/doctorApi';

// 引入科室API，添加updateDepartment函数
import { fetchDepartments, updateDepartment } from '../../utils/departmentApi';
import { MEDIA_BASE_URL } from '../../utils/auth';


// 扩展医生信息数据结构
const doctorForm = reactive({
  name: '',
  introduction: '',
  avatar: null,
  title: '',
  department: '',
  avatar_url: ''
});

// 用于存储所有医生信息的列表
const doctorsList = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const imageUrl = ref('');
const editMode = ref(false);
const currentEditId = ref('');
const fileInputRef = ref(null);

// 当前选择的科室
const activeKeshi = ref(null);

// 科室列表
const departmentList = ref([]);

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  totalPages: 1
});

// 获取科室列表
const fetchDepartmentList = async () => {
  try {
    const response = await fetchDepartments();
    if (response && response.code === 200) {
      departmentList.value = response.data || [];
      console.log('获取科室列表成功:', departmentList.value);
    }
  } catch (error) {
    console.error('获取科室列表失败:', error);
    ElMessage.error('获取科室列表失败');
  }
};

// 科室选项
const departmentOptions = computed(() => {
  return departmentList.value.map(dept => ({
    label: dept.name,
    value: dept.id
  }));
});

// 可用科室列表
const availableKeshiList = computed(() => {
  return departmentList.value || [];
});

// 从指定科室获取医生详情
const fetchDoctorsFromDepartment = async (department) => {
  if (!department || !department.doctors || department.doctors.length === 0) {
    return [];
  }
  
  const detailedDoctorsList = [];
  
  // 对每个医生ID获取其详细信息
  for (const doctorSummary of department.doctors) {
    try {
      const doctorDetailResponse = await getDoctorDetail(doctorSummary.id);
      
      if (doctorDetailResponse && doctorDetailResponse.code === 200) {
        const doctorDetail = doctorDetailResponse.data;
        
        detailedDoctorsList.push({
          id: doctorDetail.id,
          name: doctorDetail.name,
          title: doctorDetail.title || '',
          department: department.id,
          departmentName: department.name,
          // 修正头像URL处理
          avatarUrl: doctorDetail.avatar_url ? `${MEDIA_BASE_URL}${doctorDetail.avatar_url}` : '',
          intro: doctorDetail.introduction || '暂无简介'
        });
      }
    } catch (doctorError) {
      console.error(`获取医生${doctorSummary.id}详情失败:`, doctorError);
    }
  }
  
  return detailedDoctorsList;
};

// 获取已有医生信息 - 使用科室接口
const fetchDoctorList = async () => {
  loading.value = true;
  try {
    // 获取所有科室
    const departmentsResponse = await fetchDepartments();
    
    if (departmentsResponse && departmentsResponse.code === 200) {
      // 创建科室映射表供后续使用
      const departmentsMap = {};
      departmentsResponse.data.forEach(dept => {
        departmentsMap[dept.id] = dept;
      });
      
      // 如果有选中的科室，只显示该科室的医生
      if (activeKeshi.value) {
        // 获取选中科室的详细信息
        const selectedDepartment = departmentsMap[activeKeshi.value.id];
        doctorsList.value = await fetchDoctorsFromDepartment(selectedDepartment);
      } else {
        // 如果没有选中科室，获取所有科室的医生
        const allDoctors = [];
        
        // 从每个科室获取医生列表
        for (const department of departmentsResponse.data) {
          const departmentDoctors = await fetchDoctorsFromDepartment(department);
          allDoctors.push(...departmentDoctors);
        }
        
        // 应用分页逻辑
        const totalItems = allDoctors.length;
        const totalPages = Math.ceil(totalItems / pagination.pageSize);
        
        pagination.totalPages = totalPages || 1;
        
        // 根据当前页号计算显示的子集
        const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
        const endIndex = Math.min(startIndex + pagination.pageSize, totalItems);
        doctorsList.value = allDoctors.slice(startIndex, endIndex);
      }
    } else {
      ElMessage.warning(departmentsResponse?.message || '获取科室列表返回格式异常');
    }
  } catch (error) {
    console.error('获取医生信息失败:', error);
    ElMessage.error('获取医生信息失败');
  } finally {
    loading.value = false;
  }
};

// 切换选中的科室
const changeKeshi = (keshi) => {
  activeKeshi.value = keshi;
  // 如果处于编辑模式，重置表单
  if (editMode.value) {
    resetForm();
  }
  // 更新医生列表 - 基于科室
  fetchDoctorList();
  // 预设表单科室
  doctorForm.department = keshi.id;
};

// 提交医生信息
const submitDoctorInfo = async () => {
  if (!doctorForm.name) {
    ElMessage.warning('请填写医生姓名');
    return;
  }

  // 移除科室选择验证，因为API不需要科室字段
  loading.value = true;
  try {
    // 准备提交的数据，只包含API文档中指定的字段
    const submitData = {
      name: doctorForm.name,
      title: doctorForm.title || '',
      introduction: doctorForm.introduction || ''
    };
    
    console.log('准备提交的医生数据:', submitData);
    
    let response;
    
    if (editMode.value) {
      // 更新现有医生
      response = await updateDoctor(currentEditId.value, submitData);
      
      if (response && response.code === 200) {
        // 如果有新上传的头像，处理头像上传
        if (doctorForm.avatar) {
          await handleAvatarUpload(currentEditId.value);
        }
        
        ElMessage.success('医生信息更新成功');
      } else {
        ElMessage.warning(response?.message || '更新医生信息返回格式异常');
      }
    } else {
      // 添加新医生
      response = await createDoctor(submitData);
      
      if (response && response.code === 201) {
        const newDoctorId = response.data.id;
        
        // 如果有上传头像，处理头像上传
        if (doctorForm.avatar) {
          await handleAvatarUpload(newDoctorId);
        }
        
        // 将新创建的医生添加到当前选中的科室
        if (activeKeshi.value && newDoctorId) {
          await updateDepartmentWithDoctor(activeKeshi.value.id, newDoctorId);
        }
        
        ElMessage.success('医生信息添加成功');
      } else {
        ElMessage.warning(response?.message || '添加医生信息返回格式异常');
      }
    }
    
    // 刷新列表并重置表单
    await fetchDoctorList();
    resetForm();
  } catch (error) {
    console.error('提交医生信息失败:', error);
    if (error.response) {
      ElMessage.error(error.response.data?.message || '提交医生信息失败');
    } else {
      ElMessage.error('提交医生信息失败');
    }
  } finally {
    loading.value = false;
    editMode.value = false;
    currentEditId.value = '';
  }
};

// 更新科室医生列表
const updateDepartmentWithDoctor = async (departmentId, doctorId) => {
  try {
    // 获取科室详情
    const departmentsResponse = await fetchDepartments();
    
    if (departmentsResponse && departmentsResponse.code === 200) {
      // 找到当前选中科室
      const currentDepartment = departmentsResponse.data.find(dept => dept.id === departmentId);
      
      if (currentDepartment) {
        // 提取已有的医生ID列表
        const existingDoctors = currentDepartment.doctors || [];
        const existingDoctorIds = existingDoctors.map(doc => doc.id);
        
        // 添加新医生ID
        const updatedDoctorIds = [...existingDoctorIds, doctorId];
        
        // 更新科室信息 - 传递所有必需参数
        const updateData = {
          name: currentDepartment.name,
          introduction: currentDepartment.introduction || '',
          doctor_ids: updatedDoctorIds
        };
        
        const updateResponse = await updateDepartment(departmentId, updateData);
        
        if (updateResponse && updateResponse.code === 200) {
          console.log('成功将医生添加到科室');
          return true;
        } else {
          console.error('将医生添加到科室失败:', updateResponse);
          ElMessage.warning('医生创建成功，但未能添加到科室，请手动添加');
        }
      }
    }
  } catch (deptError) {
    console.error('更新科室医生列表失败:', deptError);
    ElMessage.warning('医生创建成功，但未能添加到科室，请手动添加');
  }
  
  return false;
};

// 处理头像上传
const handleAvatarUpload = async (doctorId) => {
  try {
    if (!doctorForm.avatar) {
      console.log('没有头像文件需要上传');
      return;
    }
    
    loading.value = true;
    const response = await uploadDoctorAvatar(doctorId, doctorForm.avatar);
    
    if (response && response.code === 201 && response.url) {
      console.log('头像上传成功, URL:', response.url);
      // 保存完整的URL以便在界面上显示
      const fullUrl = `${MEDIA_BASE_URL}${response.url}`;
      imageUrl.value = fullUrl;
      return response;
    } else {
      ElMessage.warning('头像上传失败');
    }
  } catch (error) {
    console.error('头像上传错误:', error);
    ElMessage.error('头像上传失败');
  } finally {
    loading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  doctorForm.name = '';
  doctorForm.introduction = '';
  doctorForm.avatar = null;
  doctorForm.title = '';
  // 如果有选中科室，则默认使用当前科室
  doctorForm.department = activeKeshi.value ? activeKeshi.value.id : '';
  doctorForm.avatar_url = '';
  imageUrl.value = '';
  editMode.value = false;
  currentEditId.value = '';
};

// 处理图片上传前的验证
const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isJPG) {
    ElMessage.error('头像图片只能是JPG或PNG格式!');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('头像图片大小不能超过2MB!');
    return false;
  }
  
  // 存储文件对象以供后续上传
  doctorForm.avatar = file;
  
  // 创建本地预览URL
  imageUrl.value = URL.createObjectURL(file);
  
  return false; // 阻止自动上传
};

// 显示文件选择对话框
const showFileChooser = () => {
  // 触发隐藏的文件输入框的点击事件
  fileInputRef.value?.click();
};

// 处理手动上传图片
const handleManualUpload = (event) => {
  const file = event?.target?.files?.[0];
  if (!file) return;
  
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isJPG) {
    ElMessage.error('头像图片只能是JPG或PNG格式!');
    return;
  }
  if (!isLt2M) {
    ElMessage.error('头像图片大小不能超过2MB!');
    return;
  }
  
  // 存储文件对象以供后续上传
  doctorForm.avatar = file;
  
  // 创建本地预览URL
  imageUrl.value = URL.createObjectURL(file);
};

// 处理图片上传后的预览 - 此函数保留但不会被调用，因为我们禁用了自动上传
const handleAvatarSuccess = (response, file) => {
  // 此函数在自动上传完成后调用，但我们已禁用自动上传
  console.log('Avatar upload success callback triggered');
  imageUrl.value = URL.createObjectURL(file.raw);
};

// 从科室中移除医生
const removeFromDepartments = async (doctorId, departments) => {
  // 找到包含该医生的科室
  const affectedDepartments = [];
  departments.forEach(dept => {
    const doctors = dept.doctors || [];
    // 检查科室是否包含要删除的医生
    if (doctors.some(doc => doc.id === doctorId || doc.id === parseInt(doctorId))) {
      affectedDepartments.push({
        id: dept.id,
        name: dept.name,
        introduction: dept.introduction,
        doctors: doctors.filter(doc => doc.id !== doctorId && doc.id !== parseInt(doctorId))
      });
    }
  });
  
  // 更新科室信息，从科室中删除该医生
  for (const dept of affectedDepartments) {
    try {
      const doctorIds = dept.doctors.map(doc => doc.id);
      
      const updateResponse = await updateDepartment(dept.id, {
        name: dept.name,
        introduction: dept.introduction || '',
        doctor_ids: doctorIds
      });
      
      console.log(`更新科室 ${dept.name} 成功`);
    } catch (deptError) {
      console.error(`更新科室 ${dept.name} 失败:`, deptError);
      ElMessage.warning(`医生删除成功，但无法从科室 ${dept.name} 中移除，请手动更新`);
    }
  }
  
  return affectedDepartments.length > 0;
};

// 删除医生信息
const handleDeleteDoctor = (id) => {
  ElMessageBox.confirm('确定要删除该医生信息吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // 在删除医生之前，先获取所有科室信息
      const departmentsResponse = await fetchDepartments();
      
      // 删除医生
      const response = await deleteDoctor(id);
      console.log('删除医生响应:', response);
      
      if (response && (response.code === 204 || response.message === '删除成功')) {
        // 如果获取到科室信息，则从科室中移除医生
        if (departmentsResponse && departmentsResponse.code === 200) {
          await removeFromDepartments(id, departmentsResponse.data);
        }
        
        ElMessage.success('删除成功');
        fetchDoctorList(); // 刷新列表
      } else {
        ElMessage.warning(response?.message || '删除返回格式异常');
      }
    } catch (error) {
      console.error('删除医生失败:', error);
      ElMessage.error('删除医生失败');
    }
  }).catch(() => {
    ElMessage.info('已取消删除');
  });
};

// 编辑医生信息
const editDoctor = async (id) => {
  try {
    loading.value = true;
    const response = await getDoctorDetail(id);
    
    if (response && response.code === 200) {
      const doctor = response.data;
      
      editMode.value = true;
      currentEditId.value = id;
      doctorForm.name = doctor.name || '';
      doctorForm.title = doctor.title || '';
      doctorForm.department = doctor.department;
      doctorForm.introduction = doctor.introduction || '';
      
      if (doctor.avatar_url) {
        // 统一处理头像URL，使用MEDIA_BASE_URL常量
        imageUrl.value = `${MEDIA_BASE_URL}${doctor.avatar_url}`;
        doctorForm.avatar_url = doctor.avatar_url;
      } else {
        imageUrl.value = '';
      }
      
      // 滚动到表单区域
      document.querySelector('.form-container')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      ElMessage.warning(response?.message || '获取医生信息返回格式异常');
    }
  } catch (error) {
    console.error('获取医生详情失败:', error);
    ElMessage.error('获取医生详情失败');
  } finally {
    loading.value = false;
  }
};

// 初始化: 如果有科室数据，默认选择第一个
const initDepartment = () => {
  if (departmentList.value && departmentList.value.length > 0) {
    activeKeshi.value = departmentList.value[0];
    doctorForm.department = activeKeshi.value.id;
  }
};

// 页面加载时获取科室列表和医生列表
onMounted(async () => {
  await fetchDepartmentList();
  initDepartment();
  await fetchDoctorList();
});
</script>

<template>
  <div class="doctor-info-page main-background">
    <div class="header-container">
      <user-dropdown></user-dropdown>
    </div>

    <page-title :title="editMode ? '编辑医生信息' : '医生信息管理'" icon-name="icon-mianxingyishengtubiao3"></page-title>

    <!-- 主要内容区 - 分为左侧科室选择和右侧医生信息 -->
    <div class="main-content">
      <!-- 左侧科室列表 -->
      <div class="keshi-section">
        <h3 class="section-title">选择科室</h3>
        <ul class="keshi-list">
          <li v-for="department in availableKeshiList" :key="department.id" 
              class="keshi-item"
              :class="{ 'is-active': activeKeshi && activeKeshi.id === department.id }"
              @click="changeKeshi(department)">
            {{ department.name }}
          </li>
        </ul>
      </div>

      <!-- 右侧主要内容区 -->
      <div class="right-content">
        <!-- 信息收集表单 -->
        <div class="form-container">
          <el-card>
            <template #header>
              <div class="card-header">
                <h3>{{ editMode ? '编辑医生信息' : (activeKeshi ? `添加${activeKeshi.name}科室医生` : '添加医生信息') }}</h3>
                <el-button v-if="editMode" @click="resetForm" type="info">取消编辑</el-button>
              </div>
            </template>

            <el-form :model="doctorForm" label-position="top">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="医生姓名" required>
                    <el-input v-model="doctorForm.name" placeholder="请输入医生姓名"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="医生职称">
                    <el-input v-model="doctorForm.title" placeholder="请输入医生职称，如：医师、主治医师等"></el-input>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="医生头像">
                <div class="avatar-uploader" @click="showFileChooser">
                  <img v-if="imageUrl" :src="imageUrl" class="avatar" />
                  <div v-else class="avatar-uploader-icon">
                    <el-icon><el-icon-plus /></el-icon>
                  </div>
                  <input 
                    type="file" 
                    ref="fileInputRef"
                    style="display: none" 
                    accept="image/jpeg,image/png"
                    @change="handleManualUpload"
                  />
                </div>
                <div class="upload-tip">
                  点击上传医生头像，支持JPG或PNG格式，大小不超过2MB
                </div>
              </el-form-item>

              <el-form-item label="医生简介">
                <el-input
                  v-model="doctorForm.introduction"
                  type="textarea"
                  :rows="5"
                  placeholder="请输入医生简介，包括专业特长、工作经历等"
                ></el-input>
              </el-form-item>

              <div class="form-btns">
                <el-button type="primary" @click="submitDoctorInfo" :loading="loading">
                  {{ editMode ? '保存修改' : '提交' }}
                </el-button>
                <el-button @click="resetForm">重置</el-button>
              </div>
            </el-form>
          </el-card>
        </div>

        <!-- 医生信息列表 -->
        <div class="list-container">
          <el-card>
            <template #header>
              <div class="card-header">
                <h3>
                  {{ activeKeshi ? activeKeshi.name + ' - 医生列表' : '全部医生列表' }}
                </h3>
                <el-button type="primary" @click="fetchDoctorList" :loading="loading">
                  刷新
                </el-button>
              </div>
            </template>

            <el-table :data="doctorsList" style="width: 100%" v-loading="loading">
              <el-table-column label="头像" width="80">
                <template #default="scope">
                  <el-avatar :size="50" :src="scope.row.avatarUrl" fit="cover">
                    <el-icon>
                      <el-icon-user />
                    </el-icon>
                  </el-avatar>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="姓名" width="100"></el-table-column>
              <el-table-column prop="title" label="职称" width="120"></el-table-column>
              <el-table-column prop="departmentName" label="科室" width="100"></el-table-column>
              <el-table-column prop="intro" label="简介" show-overflow-tooltip>
                <template #default="scope">
                  <div class="doctor-intro">{{ scope.row.intro }}</div>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="scope">
                  <el-button type="primary" size="small" @click="editDoctor(scope.row.id)">
                    编辑
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    @click="handleDeleteDoctor(scope.row.id)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 分页器 -->
            <div class="pagination-container">
              <el-pagination
                v-if="pagination.totalPages > 1"
                background
                layout="prev, pager, next"
                :total="pagination.totalPages * 10"
                :current-page="pagination.currentPage"
                @current-change="(page) => { pagination.currentPage = page; fetchDoctorList(); }"
              />
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.doctor-info-page {
  min-height: 100vh;
  padding-bottom: 50px;
}

.header-container {
  position: relative;
  width: 100%;
  height: 60px;
}

.main-content {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  padding: 0 20px;
}

.keshi-section {
  width: 200px;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 15px;
  border-radius: 4px;
  align-self: flex-start;
  position: sticky;
  top: 20px;
}

.right-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  color: #333;
  font-weight: bold;
}

.keshi-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.keshi-item {
  padding: 10px;
  margin-bottom: 5px;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.keshi-item:hover {
  background-color: rgba(255, 255, 255, 0.8);
}

.keshi-item.is-active {
  background-color: #9c0c15;
  color: white;
}

.form-container, .list-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
  }
}

.form-btns {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.avatar-uploader {
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 150px;
  height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: border-color 0.3s;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 150px;
  height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
}

.doctor-intro {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
