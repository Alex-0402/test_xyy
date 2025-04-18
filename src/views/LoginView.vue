<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { loginUser } from '../utils/auth';
import ForgotPassword from '@/components/ForgotPassword.vue';
import '@/assets/styles/common.css'; // 引入全局样式

const router = useRouter();
const loginForm = reactive({
  username: '',
  password: '',
  remember: false
});

const loading = ref(false);
const showForgotPassword = ref(false);
const passwordVisible = ref(false); // 控制密码显示状态

// 登录操作
const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('用户名和密码不能为空');
    return;
  }

  loading.value = true;
  try {
    // 调用封装后的登录API
    const response = await loginUser(loginForm.username, loginForm.password);
    
    if (response.status === 999) {
      ElMessage.success('登录成功');
      router.push('/');
    } else {
      ElMessage.error(response.message || '登录失败');
    }
  } catch (error) {
    console.error('登录错误', error);
    ElMessage.error('登录失败，请检查网络连接');
  } finally {
    loading.value = false;
  }
};

// 切换到忘记密码页面
const toggleForgotPassword = () => {
  showForgotPassword.value = !showForgotPassword.value;
};

const goBack = () => {
  router.push('/');
};
</script>

<template>
  <div class="login-page main-background">
    <!-- 正常登录表单 -->
    <div class="login-box" v-if="!showForgotPassword">
      <div class="login-header">
        <h2>管理员登录</h2>
        <div class="back-button" @click="goBack">返回主页</div>
      </div>
      <p class="login-note">普通用户无需登录，此入口仅供管理员使用</p>
      <el-form :model="loginForm" class="login-form">
        <el-form-item>
          <el-input v-model="loginForm.username" placeholder="管理员用户名">
            <template #prefix>
              <el-icon><i class="el-icon-user"></i></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-input 
            v-model="loginForm.password" 
            :type="passwordVisible ? 'text' : 'password'" 
            placeholder="密码">
            <template #prefix>
              <el-icon><i class="el-icon-lock"></i></el-icon>
            </template>
            <template #suffix>
              <el-icon 
                class="password-eye" 
                @click="passwordVisible = !passwordVisible">
                <i :class="passwordVisible ? 'el-icon-view' : 'el-icon-view-off'"></i>
              </el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item class="login-options">
          <div class="remember-me">
            <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
          </div>
          <div class="forget-pwd-container">
            <a href="javascript:;" class="forget-pwd" @click="toggleForgotPassword">忘记密码?</a>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleLogin" class="login-btn">登录</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 忘记密码表单，将在ForgotPassword组件中实现 -->
    <forgot-password v-else @back="toggleForgotPassword"></forgot-password>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.login-box {
  width: 400px;
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-header {
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

.login-note {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
  text-align: center;
}

.login-form {
  .el-input {
    margin-bottom: 10px;
  }
  
  .forget-pwd {
    float: right;
    color: #9c0c15;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  .login-btn {
    width: 100%;
    background-color: #9c0c15;
    border-color: #9c0c15;
    
    &:hover, &:focus {
      background-color: #7a0910;
      border-color: #7a0910;
    }
  }
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .remember-me {
    flex: 1;
  }

  .forget-pwd-container {
    text-align: right;
  }
}

.forget-pwd {
  color: #9c0c15;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
}

.password-eye {
  cursor: pointer;
  font-size: 18px;
  color: #9c0c15;

  &:hover {
    color: #7a0910;
  }
}
</style>
