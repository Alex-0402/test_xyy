<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import PageTitle from '../../components/PageTitle.vue';
import UserDropdown from '../../components/UserDropdown.vue';
import { getAccessToken } from '../../utils/auth';
import { 
  fetchDepartments, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment 
} from '../../utils/departmentApi';

// 单个科室信息的数据结构
const departmentForm = reactive({
  name: '',
  introduction: '',
  workStartTime: '',
  workEndTime: '',
  doctor_ids: [],
});

// 用于存储所有科室信息的列表
const departmentsList = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const isEditing = ref(false);
const editingId = ref(null);

// 获取已有科室信息
const getDepartments = async () => {
  loading.value = true;
  try {
    console.log('开始获取科室数据');
    const response = await fetchDepartments();
    console.log('获取科室响应:', response);
    
    // 根据后端API文档处理响应数据
    if (response && response.code === 200) {
      departmentsList.value = response.data || [];
      console.log('科室数据处理成功:', departmentsList.value);
    } else {
      ElMessage.warning(response?.message || '获取科室信息返回格式异常');
      console.warn('科室数据格式异常:', response);
    }
  } catch (error) {
    console.error('获取科室信息失败:', error);
    // 增加更详细的错误日志
    if (error.response) {
      console.log('错误响应状态:', error.response.status);
      console.log('错误响应数据:', error.response.data);
      
      if (error.response.status === 401) {
        ElMessage.error('请先登录或您没有权限执行此操作');
      } else {
        ElMessage.error(error.response?.data?.message || '获取科室信息失败，请检查网络连接');
      }
    } else {
      ElMessage.error('获取科室信息失败，请检查网络连接');
    }
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

  // 准备要提交的数据（根据API文档格式）
  const submitData = {
    name: departmentForm.name,
    introduction: departmentForm.introduction || '',
    doctor_ids: departmentForm.doctor_ids || []
  };
  
  // 如果有工作时间，添加到科室介绍中
  if (departmentForm.workStartTime && departmentForm.workEndTime) {
    submitData.introduction += `\n工作时间：${departmentForm.workStartTime} - ${departmentForm.workEndTime}`;
  }

  console.log('准备提交科室数据:', submitData);
  loading.value = true;
  
  try {
    let response;
    
    if (isEditing.value && editingId.value) {
      console.log(`编辑科室，ID: ${editingId.value}，类型: ${typeof editingId.value}`);
      // 编辑现有科室
      response = await updateDepartment(editingId.value, submitData);
    } else {
      console.log('新建科室');
      // 添加新科室
      response = await createDepartment(submitData);
    }
    
    console.log('提交科室响应:', response);
    
    // 处理响应（按照API文档格式）
    if (response) {
      if ((isEditing.value && response.code === 200) || 
          (!isEditing.value && response.code === 201)) {
        ElMessage.success(response.message || (isEditing.value ? '科室信息更新成功' : '科室信息提交成功'));
        // 重新获取科室列表
        getDepartments();
        // 清空表单
        resetForm();
      } else {
        ElMessage.warning(response.message || '操作返回格式异常');
      }
    } else {
      ElMessage.error('操作失败: 无响应数据');
    }
  } catch (error) {
    console.error('提交科室信息失败:', error);
    // 处理错误，特别注意 401 未授权错误
    if (error.response) {
      console.log('错误响应状态:', error.response.status);
      console.log('错误响应数据:', error.response.data);
      
      if (error.response.status === 401) {
        ElMessage.error('请先登录或者您没有权限执行此操作');
      } else if (error.response.status === 400) {
        ElMessage.error(error.response.data?.message || '提交的数据格式不正确');
      } else {
        ElMessage.error(error.response.data?.message || `提交科室信息失败: ${error.response.status}`);
      }
    } else {
      ElMessage.error('提交科室信息失败，请检查网络连接');
    }
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
  
  // 记录原始ID，方便调试
  console.log('要编辑的科室ID:', department.id, '类型:', typeof department.id);
  
  // 尝试从介绍中提取工作时间
  const timeRegex = /工作时间：(\d{2}:\d{2}) - (\d{2}:\d{2})/;
  const timeMatch = introduction.match(timeRegex);
  
  if (timeMatch) {
    workStartTime = timeMatch[1];
    workEndTime = timeMatch[2];
    // 从介绍中移除工作时间信息，以免重复添加
    introduction = introduction.replace(timeRegex, '').trim();
  }
  
  departmentForm.name = department.name || '';
  departmentForm.introduction = introduction;
  departmentForm.workStartTime = workStartTime;
  departmentForm.workEndTime = workEndTime;
  departmentForm.doctor_ids = department.doctors?.map(doc => doc.id) || [];
  
  // 调试信息
  console.log('要编辑的科室对象:', department);
  console.log('科室ID类型:', typeof department.id);
  console.log('科室ID值:', department.id);
  
  isEditing.value = true;
  editingId.value = department.id;
  
  // 调试信息
  console.log('设置editingId为:', editingId.value, '类型:', typeof editingId.value);
  
  // 滚动到表单顶部
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

// 删除科室信息
const handleDeleteDepartment = async (id) => {
  // 记录原始ID，方便调试
  console.log('要删除的科室ID:', id, '类型:', typeof id);
  
  console.log('要删除的科室ID类型:', typeof id);
  console.log('要删除的科室ID值:', id);
  
  ElMessageBox.confirm('确定要删除该科室吗？删除后将无法恢复。', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // 记录当前token状态
      const token = getAccessToken(); // 现在这个函数已正确导入
      console.log('当前是否有token:', !!token);
      
      console.log(`准备删除科室 ID: ${id}`);
      const response = await deleteDepartment(id);
      console.log('删除科室响应数据:', response);
      
      // 按照API文档检查响应格式
      if (response && (response.code === 204 || response.message === '删除成功')) {
        ElMessage.success('删除成功');
        getDepartments(); // 刷新列表
      } else {
        ElMessage.warning(response?.message || '删除返回格式异常');
      }
    } catch (error) {
      console.error('删除科室信息详细错误:', error);
      
      if (error.message && error.message.includes('Network Error')) {
        ElMessage.error('网络错误，无法连接到服务器');
      } else if (error.response) {
        console.log('错误响应状态:', error.response.status);
        console.log('错误响应数据:', error.response.data);
        
        if (error.response.status === 401) {
          ElMessage.error('请先登录或者您没有权限执行此操作');
        } else if (error.response.status === 404) {
          ElMessage.error('科室不存在或已被删除');
          getDepartments(); // 刷新列表
        } else {
          ElMessage.error(error.response.data?.message || `删除失败: ${error.response.status}`);
        }
      } else {
        ElMessage.error(`删除失败: ${error.message || '未知错误'}`);
      }
    }
  }).catch(() => {
    ElMessage.info('已取消删除');
  });
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
  getDepartments();
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
            <el-button type="primary" @click="getDepartments" :loading="loading">
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
          <el-table-column label="操作" width="220">
            <template #default="scope">
              <el-button type="primary" size="small" @click="editDepartment(scope.row)">
                编辑
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="handleDeleteDepartment(scope.row.id)"
              >
                删除
              </el-button>
              <!-- <el-button type="info" size="small" @click="console.log('科室详情:', scope.row)">
                调试
              </el-button> -->
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
