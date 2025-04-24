<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { isAuthenticated, changePassword as authChangePassword } from '@/utils/auth';

import eyeOpen from '@/assets/eye_open.png';
import eyeClose from '@/assets/eye_close.png';
import '@/assets/styles/common.css'; // 引入全局样式

const router = useRouter();
const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);

const oldPasswordVisible = ref(false);
const newPasswordVisible = ref(false);
const confirmPasswordVisible = ref(false);

// 检查用户是否已登录
onMounted(() => {
  if (!isAuthenticated()) {
    ElMessage.warning('请先登录');
    router.push('/login');
  }
});

// 修改密码
const changePassword = async () => {
  if (!oldPassword.value || !newPassword.value || !confirmPassword.value) {
    ElMessage.warning('所有字段都必须填写');
    return;
  }
  
  if (newPassword.value !== confirmPassword.value) {
    ElMessage.warning('两次输入的新密码不一致');
    return;
  }
  
  loading.value = true;
  try {
    // 使用auth.js中封装好的changePassword函数
    const response = await authChangePassword(oldPassword.value, newPassword.value);
    
    if (response && response.code === 999) {
      ElMessage.success('密码修改成功');
      // 修改成功后清除令牌并返回登录页
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      router.push('/login');
    } else {
      ElMessage.error(response.message || '密码修改失败');
    }
  } catch (error) {
    console.error('修改密码错误', error);
    ElMessage.error(error.message || '修改密码请求失败');
  } finally {
    loading.value = false;
  }
};

// 返回主页
const goBack = () => {
  router.push('/');
};
</script>

<template>
  <div class="change-password-page main-background">
    <div class="change-password-box">
      <div class="change-password-header">
        <h2>修改密码</h2>
        <div class="back-button" @click="goBack">返回主页</div>
      </div>
      
      <el-form class="change-password-form">
        <el-form-item>
          <el-input 
            v-model="oldPassword" 
            :type="oldPasswordVisible ? 'text' : 'password'" 
            placeholder="当前密码">
            <template #prefix>
              <el-icon><i class="el-icon-lock"></i></el-icon>
            </template>
            <template #suffix>
              <img 
                class="password-eye" 
                :src="oldPasswordVisible ? eyeOpen : eyeClose" 
                @click="oldPasswordVisible = !oldPasswordVisible" 
                alt="Toggle Password Visibility" />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-input 
            v-model="newPassword" 
            :type="newPasswordVisible ? 'text' : 'password'" 
            placeholder="新密码">
            <template #prefix>
              <el-icon><i class="el-icon-lock"></i></el-icon>
            </template>
            <template #suffix>
              <img 
                class="password-eye" 
                :src="newPasswordVisible ? eyeOpen : eyeClose" 
                @click="newPasswordVisible = !newPasswordVisible" 
                alt="Toggle Password Visibility" />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-input 
            v-model="confirmPassword" 
            :type="confirmPasswordVisible ? 'text' : 'password'" 
            placeholder="确认新密码">
            <template #prefix>
              <el-icon><i class="el-icon-lock"></i></el-icon>
            </template>
            <template #suffix>
              <img 
                class="password-eye" 
                :src="confirmPasswordVisible ? eyeOpen : eyeClose" 
                @click="confirmPasswordVisible = !confirmPasswordVisible" 
                alt="Toggle Password Visibility" />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="changePassword" class="submit-btn">修改密码</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.change-password-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.change-password-box {
  width: 400px;
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.change-password-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  
  h2 {
    font-size: 24px;
    color: #333;
    margin: 0;
  }
  
  .back-button {
    color: #9c0c15;
    cursor: pointer;
    font-size: 14px;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.change-password-form {
  .el-input {
    margin-bottom: 10px;
  }
  
  .submit-btn {
    width: 100%;
    background-color: #9c0c15;
    border-color: #9c0c15;
    
    &:hover, &:focus {
      background-color: #7a0910;
      border-color: #7a0910;
    }
  }
}

.password-eye {
  cursor: pointer;
  width: 40px;
  height: 20px;
}
</style>