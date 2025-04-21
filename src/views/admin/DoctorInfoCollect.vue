<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import PageTitle from '../../components/PageTitle.vue';
import UserDropdown from '../../components/UserDropdown.vue';
import axios from 'axios';
import { useDoctorStore } from '../../stores/doctor';
import { useKeshiStore } from '../../stores/keshi';

const doctorStore = useDoctorStore();
const keshiStore = useKeshiStore();

// 扩展医生信息数据结构
const doctorForm = reactive({
  name: '',
  intro: '',
  avatar: null,
  title: '',
  keshi: '',
  workat: []
});

// 用于存储所有医生信息的列表
const doctorsList = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const imageUrl = ref('');
const editMode = ref(false);
const currentEditId = ref('');

// 科室选项
const keshiOptions = computed(() => {
  return keshiStore.keshiList.map(keshi => ({
    label: keshi.name,
    value: keshi.id
  }));
});

// 获取已有医生信息
const fetchDoctors = async () => {
  loading.value = true;
  try {
    // 在实际应用中，这里应该调用API获取数据
    // 现在我们直接使用模拟数据
    const mockData = doctorStore.getMockDoctorData();
    doctorsList.value = mockData.map(doctor => ({
      id: doctor.id,
      name: doctor.name,
      title: doctor.title || '',
      keshi: doctor.keshi,
      keshiName: getKeshiName(doctor.keshi),
      avatarUrl: doctor.pic || '',
      intro: doctor.goodat || '暂无简介'
    }));
  } catch (error) {
    console.error('获取医生信息失败:', error);
    ElMessage.error('获取医生信息失败');
  } finally {
    loading.value = false;
  }
};

// 获取科室名称
const getKeshiName = (keshiId) => {
  const keshi = keshiStore.keshiList.find(k => k.id === keshiId);
  return keshi ? keshi.name : '未知科室';
};

// 提交医生信息
const submitDoctorInfo = async () => {
  if (!doctorForm.name || !doctorForm.keshi) {
    ElMessage.warning('请填写医生姓名和选择科室');
    return;
  }

  loading.value = true;
  try {
    let newDoctor;
    
    if (editMode.value) {
      // 更新现有医生
      const doctorIndex = doctorStore.doctorList.findIndex(d => d.id === currentEditId.value);
      if (doctorIndex !== -1) {
        const doctor = doctorStore.doctorList[doctorIndex];
        doctor.name = doctorForm.name;
        doctor.title = doctorForm.title;
        doctor.keshi = doctorForm.keshi;
        doctor.goodat = doctorForm.intro;
        if (imageUrl.value && !imageUrl.value.startsWith('http')) {
          doctor.pic = imageUrl.value;
        }
        ElMessage.success('医生信息更新成功');
      }
    } else {
      // 添加新医生
      const id = 'doc_' + Date.now();
      newDoctor = {
        id,
        name: doctorForm.name,
        title: doctorForm.title || '医师',
        keshi: doctorForm.keshi,
        pic: imageUrl.value || '',
        goodat: doctorForm.intro || '',
        web: '',
        workat: []
      };
      
      // 添加到医生列表
      doctorStore.doctorList.push(newDoctor);
      ElMessage.success('医生信息添加成功');
    }
    
    // 重新加载数据
    fetchDoctors();
    // 清空表单
    resetForm();
  } catch (error) {
    console.error('提交医生信息失败:', error);
    ElMessage.error('提交医生信息失败');
  } finally {
    loading.value = false;
    editMode.value = false;
    currentEditId.value = '';
  }
};

// 重置表单
const resetForm = () => {
  doctorForm.name = '';
  doctorForm.intro = '';
  doctorForm.avatar = null;
  doctorForm.title = '';
  doctorForm.keshi = '';
  doctorForm.workat = [];
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
  
  doctorForm.avatar = file;
  
  // 创建本地预览URL
  imageUrl.value = URL.createObjectURL(file);
  
  return false; // 阻止自动上传
};

// 处理图片上传后的预览
const handleAvatarSuccess = (response, file) => {
  imageUrl.value = URL.createObjectURL(file.raw);
};

// 删除医生信息
const deleteDoctor = (id) => {
  ElMessageBox.confirm('确定要删除该医生信息吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = doctorStore.doctorList.findIndex(d => d.id === id);
    if (index !== -1) {
      doctorStore.doctorList.splice(index, 1);
      ElMessage.success('删除成功');
      fetchDoctors();
    }
  }).catch(() => {});
};

// 编辑医生信息
const editDoctor = (id) => {
  const doctor = doctorStore.doctorList.find(d => d.id === id);
  if (doctor) {
    editMode.value = true;
    currentEditId.value = id;
    doctorForm.name = doctor.name;
    doctorForm.title = doctor.title;
    doctorForm.keshi = doctor.keshi;
    doctorForm.intro = doctor.goodat;
    imageUrl.value = doctor.pic;
    
    // 滚动到表单区域
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
  }
};

// 调用生成模拟数据的方法
const generateMockData = () => {
  const mockData = doctorStore.getMockDoctorData();
  console.log('模拟数据:', mockData);
  
  // 将模拟数据转换为适合表格显示的格式
  doctorsList.value = mockData.map(doctor => ({
    id: doctor.id,
    name: doctor.name,
    title: doctor.title || '',
    keshi: doctor.keshi,
    keshiName: getKeshiName(doctor.keshi),
    avatarUrl: doctor.pic || '',
    intro: doctor.goodat || '暂无简介'
  }));
  
  ElMessage.success('已加载模拟数据');
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

    <page-title :title="editMode ? '编辑医生信息' : '医生信息管理'" icon-name="icon-mianxingyishengtubiao3"></page-title>

    <!-- 信息收集表单 -->
    <div class="form-container">
      <el-card>
        <template #header>
          <div class="card-header">
            <h3>{{ editMode ? '编辑医生信息' : '添加医生信息' }}</h3>
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
          
          <el-form-item label="所属科室" required>
            <el-select v-model="doctorForm.keshi" placeholder="请选择科室" style="width: 100%">
              <el-option 
                v-for="item in keshiOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="医生头像">
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

          <el-form-item label="医生简介">
            <el-input
              v-model="doctorForm.intro"
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
            <h3>医生信息列表</h3>
            <div>
              <el-button type="primary" @click="fetchDoctors" :loading="loading">
                刷新
              </el-button>
              <el-button type="success" @click="generateMockData">
                生成模拟数据
              </el-button>
            </div>
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
          <el-table-column prop="keshiName" label="科室" width="100"></el-table-column>
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
