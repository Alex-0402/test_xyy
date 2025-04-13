<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import PageTitle from '../components/PageTitle.vue';
import UserDropdown from '../components/UserDropdown.vue';
import axios from 'axios';

// 单个医生信息的数据结构
const doctorForm = reactive({
  name: '',
  intro: '',
  avatar: null,
});

// 用于存储所有医生信息的列表
const doctorsList = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const imageUrl = ref('');

// 获取已有医生信息
const fetchDoctors = async () => {
  loading.value = true;
  try {
    // 根据实际API替换URL
    const response = await axios.get('/api/doctors');
    doctorsList.value = response.data;
  } catch (error) {
    console.error('获取医生信息失败:', error);
    ElMessage.error('获取医生信息失败');
  } finally {
    loading.value = false;
  }
};

// 提交医生信息到服务器
const submitDoctorInfo = async () => {
  if (!doctorForm.name || !doctorForm.intro || !doctorForm.avatar) {
    ElMessage.warning('请填写完整的医生信息');
    return;
  }

  loading.value = true;
  try {
    const formData = new FormData();
    formData.append('name', doctorForm.name);
    formData.append('intro', doctorForm.intro);
    formData.append('avatar', doctorForm.avatar);

    // 根据实际API替换URL
    const response = await axios.post('/api/doctors', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    ElMessage.success('医生信息提交成功');
    // 重新获取医生列表
    fetchDoctors();
    // 清空表单
    resetForm();
  } catch (error) {
    console.error('提交医生信息失败:', error);
    ElMessage.error('提交医生信息失败');
  } finally {
    loading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  doctorForm.name = '';
  doctorForm.intro = '';
  doctorForm.avatar = null;
  imageUrl.value = '';
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
  
  doctorForm.avatar = file;
  return false; // 阻止自动上传
};

// 处理图片上传后的预览
const handleAvatarSuccess = (response, file) => {
  imageUrl.value = URL.createObjectURL(file.raw);
};

// 删除医生信息
const deleteDoctor = async (id) => {
  try {
    // 根据实际API替换URL
    await axios.delete(`/api/doctors/${id}`);
    ElMessage.success('删除成功');
    fetchDoctors();
  } catch (error) {
    console.error('删除医生信息失败:', error);
    ElMessage.error('删除失败');
  }
};

// 页面加载时获取医生列表
onMounted(() => {
  fetchDoctors();
});
</script>

<template>
  <div class="doctor-info-page main-background">
    <div class="header-container">
      <user-dropdown></user-dropdown>
    </div>

    <page-title title="医生信息管理" icon-name="icon-mianxingyishengtubiao3"></page-title>

    <!-- 信息收集表单 -->
    <div class="form-container">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>添加医生信息</h3>
          </div>
        </template>

        <el-form :model="doctorForm" label-position="top">
          <el-form-item label="医生姓名" required>
            <el-input v-model="doctorForm.name" placeholder="请输入医生姓名"></el-input>
          </el-form-item>

          <el-form-item label="医生头像" required>
            <el-upload
              class="avatar-uploader"
              action="#"
              :show-file-list="false"
              :auto-upload="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
            >
              <img v-if="imageUrl" :src="imageUrl" class="avatar" />
              <el-icon v-else class="avatar-uploader-icon">
                <el-icon-plus />
              </el-icon>
            </el-upload>
            <div class="upload-tip">
              点击上传医生头像，支持JPG或PNG格式，大小不超过2MB
            </div>
          </el-form-item>

          <el-form-item label="医生简介" required>
            <el-input
              v-model="doctorForm.intro"
              type="textarea"
              :rows="5"
              placeholder="请输入医生简介，包括专业特长、工作经历等"
            ></el-input>
          </el-form-item>

          <div class="form-btns">
            <el-button type="primary" @click="submitDoctorInfo" :loading="loading">
              提交
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
            <h3>医生信息列表</h3>
            <el-button type="primary" @click="fetchDoctors" :loading="loading">
              刷新
            </el-button>
          </div>
        </template>

        <el-table :data="doctorsList" style="width: 100%" v-loading="loading">
          <el-table-column label="头像" width="100">
            <template #default="scope">
              <el-avatar :size="50" :src="scope.row.avatarUrl"></el-avatar>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="姓名" width="120"></el-table-column>
          <el-table-column prop="intro" label="简介">
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
                @click="deleteDoctor(scope.row.id)"
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
.doctor-info-page {
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
  width: 150px;
  height: 150px;
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
</style>
