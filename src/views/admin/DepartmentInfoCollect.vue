<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import PageTitle from '../../components/PageTitle.vue';
import UserDropdown from '../../components/UserDropdown.vue';
import axios from 'axios';

// 单个科室信息的数据结构
const departmentForm = reactive({
  name: '',
  introduction: '', // 将description1更改为introduction以匹配API
  workStartTime: '',
  workEndTime: '',
  doctor_ids: [], // 添加医生ID列表
});

// 用于存储所有科室信息的列表
const departmentsList = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEditing = ref(false);
const editingId = ref(null);

// 获取已有科室信息
const fetchDepartments = async () => {
  loading.value = true;
  try {
    // 根据API文档调整URL
    const response = await axios.get('/api/departments/');
    
    // 处理返回的数据格式
    if (response.data && response.data.code === 200) {
      departmentsList.value = response.data.data || [];
      ElMessage.success(response.data.message || '获取科室信息成功');
    } else {
      ElMessage.warning(response.data.message || '获取科室信息返回格式异常');
    }
  } catch (error) {
    console.error('获取科室信息失败:', error);
    ElMessage.error(error.response?.data?.message || '获取科室信息失败');
  } finally {
    loading.value = false;
  }
};

// 提交科室信息到服务器
const submitDepartmentInfo = async () => {
  if (!departmentForm.name) {
    ElMessage.warning('请填写科室名称');
    return;
  }

  // 准备要提交的数据
  const submitData = {
    name: departmentForm.name,
    introduction: departmentForm.introduction,
    doctor_ids: departmentForm.doctor_ids
  };
  
  // 如果有工作时间，添加到科室介绍中
  if (departmentForm.workStartTime && departmentForm.workEndTime) {
    submitData.introduction += `\n工作时间：${departmentForm.workStartTime} - ${departmentForm.workEndTime}`;
  }

  loading.value = true;
  try {
    let response;
    
    if (isEditing.value) {
      // 编辑现有科室
      response = await axios.put(`/api/departments/${editingId.value}/`, submitData);
      
      if (response.data && response.data.code === 200) {
        ElMessage.success(response.data.message || '科室信息更新成功');
      } else {
        ElMessage.warning(response.data.message || '科室信息更新返回格式异常');
      }
    } else {
      // 添加新科室
      response = await axios.post('/api/departments/', submitData);
      
      if (response.data && response.data.code === 201) {
        ElMessage.success(response.data.message || '科室信息提交成功');
      } else {
        ElMessage.warning(response.data.message || '科室信息提交返回格式异常');
      }
    }
    
    // 重新获取科室列表
    fetchDepartments();
    // 清空表单
    resetForm();
    isEditing.value = false;
    editingId.value = null;
  } catch (error) {
    console.error('提交科室信息失败:', error);
    ElMessage.error(error.response?.data?.message || '提交科室信息失败');
  } finally {
    loading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  departmentForm.name = '';
  departmentForm.introduction = '';
  departmentForm.workStartTime = '';
  departmentForm.workEndTime = '';
  departmentForm.doctor_ids = [];
  isEditing.value = false;
  editingId.value = null;
};

// 编辑科室信息
const editDepartment = (department) => {
  // 提取工作时间信息（如果有的话）
  let introduction = department.introduction || '';
  let workStartTime = '';
  let workEndTime = '';
  
  // 尝试从介绍中提取工作时间
  const timeRegex = /工作时间：(\d{2}:\d{2}) - (\d{2}:\d{2})/;
  const timeMatch = introduction.match(timeRegex);
  
  if (timeMatch) {
    workStartTime = timeMatch[1];
    workEndTime = timeMatch[2];
    // 从介绍中移除工作时间信息
    introduction = introduction.replace(timeRegex, '').trim();
  }
  
  departmentForm.name = department.name;
  departmentForm.introduction = introduction;
  departmentForm.workStartTime = workStartTime;
  departmentForm.workEndTime = workEndTime;
  departmentForm.doctor_ids = department.doctors?.map(doc => doc.id) || [];
  
  isEditing.value = true;
  editingId.value = department.id;
  
  // 滚动到表单顶部
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

// 删除科室信息
const deleteDepartment = async (id) => {
  try {
    // 根据API文档调整URL
    const response = await axios.delete(`/api/departments/${id}/`);
    
    if (response.data && (response.data.code === 204 || response.data.message === '删除成功')) {
      ElMessage.success(response.data.message || '删除成功');
    } else {
      ElMessage.warning(response.data.message || '删除返回格式异常');
    }
    
    fetchDepartments();
  } catch (error) {
    console.error('删除科室信息失败:', error);
    ElMessage.error(error.response?.data?.message || '删除失败');
  }
};

// 格式化时间显示
const formatTime = (time) => {
  return time ? time : '未设置';
};

// 从科室介绍中提取工作时间
const extractWorkTime = (department) => {
  if (!department.introduction) return '未设置';
  
  const timeRegex = /工作时间：([\d:]+) - ([\d:]+)/;
  const match = department.introduction.match(timeRegex);
  
  if (match) {
    return `${match[1]} - ${match[2]}`;
  }
  
  return '未设置';
};

// 页面加载时获取科室列表
onMounted(() => {
  fetchDepartments();
});
</script>

<template>
  <div class="department-info-page main-background">
    <div class="header-container">
      <user-dropdown></user-dropdown>
    </div>

    <page-title title="科室信息管理" icon-name="icon-keshi"></page-title>

    <!-- 信息收集表单 -->
    <div class="form-container">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>{{ isEditing ? '编辑科室信息' : '添加科室信息' }}</h3>
          </div>
        </template>

        <el-form :model="departmentForm" label-position="top">
          <el-form-item label="科室名称" required>
            <el-input v-model="departmentForm.name" placeholder="请输入科室名称"></el-input>
          </el-form-item>

          <el-form-item label="工作时间">
            <div class="time-range">
              <el-time-picker
                v-model="departmentForm.workStartTime"
                placeholder="开始时间"
                format="HH:mm"
                value-format="HH:mm"
              ></el-time-picker>
              <span class="time-separator">至</span>
              <el-time-picker
                v-model="departmentForm.workEndTime"
                placeholder="结束时间"
                format="HH:mm"
                value-format="HH:mm"
              ></el-time-picker>
            </div>
          </el-form-item>

          <el-form-item label="科室介绍" required>
            <el-input
              v-model="departmentForm.introduction"
              type="textarea"
              :rows="5"
              placeholder="请输入科室介绍"
            ></el-input>
          </el-form-item>

          <!-- 可以在这里添加选择医生的选项，如果需要 -->
          <!-- 
          <el-form-item label="科室医生">
            <el-select
              v-model="departmentForm.doctor_ids"
              multiple
              placeholder="请选择科室医生"
              style="width: 100%"
            >
              <el-option
                v-for="doctor in doctorsList"
                :key="doctor.id"
                :label="doctor.name"
                :value="doctor.id"
              >
              </el-option>
            </el-select>
          </el-form-item>
          -->

          <div class="form-btns">
            <el-button type="primary" @click="submitDepartmentInfo" :loading="loading">
              {{ isEditing ? '保存修改' : '提交' }}
            </el-button>
            <el-button @click="resetForm">{{ isEditing ? '取消' : '重置' }}</el-button>
          </div>
        </el-form>
      </el-card>
    </div>

    <!-- 科室信息列表 -->
    <div class="list-container">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>科室信息列表</h3>
            <el-button type="primary" @click="fetchDepartments" :loading="loading">
              刷新
            </el-button>
          </div>
        </template>

        <el-table :data="departmentsList" style="width: 100%" v-loading="loading">
          <el-table-column prop="name" label="科室名称" width="120"></el-table-column>
          <el-table-column label="工作时间" width="180">
            <template #default="scope">
              {{ extractWorkTime(scope.row) }}
            </template>
          </el-table-column>
          <el-table-column prop="introduction" label="科室介绍">
            <template #default="scope">
              <div class="description-text">{{ scope.row.introduction }}</div>
            </template>
          </el-table-column>
          <el-table-column label="医生数量" width="100">
            <template #default="scope">
              {{ scope.row.doctors ? scope.row.doctors.length : 0 }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button type="primary" size="small" @click="editDepartment(scope.row)">
                编辑
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="deleteDepartment(scope.row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.department-info-page {
  min-height: 100vh;
  padding-bottom: 50px;
}

.header-container {
  position: relative;
  width: 100%;
  height: 60px;
}

.form-container, .list-container {
  max-width: 1000px;
  margin: 20px auto;
  padding: 0 20px;
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

.time-range {
  display: flex;
  align-items: center;
}

.time-separator {
  margin: 0 10px;
}

.description-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
