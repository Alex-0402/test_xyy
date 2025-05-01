<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { loginUser } from '../../utils/auth';
import '@/assets/styles/common.css'; // 引入全局样式

const router = useRouter();
const loginForm = reactive({
  username: '',
  password: '',
  remember: false
});

const loading = ref(false);
const passwordVisible = ref(false); // 控制密码显示状态

// 保存登录信息到本地存储
const saveLoginInfo = () => {
  if (loginForm.remember) {
    // 如果用户勾选了"记住我"，则保存登录信息
    const loginInfo = {
      username: loginForm.username,
      password: btoa(loginForm.password) // 使用简单的 Base64 编码密码，生产环境建议使用更安全的方式
    };
    localStorage.setItem('rememberedLogin', JSON.stringify(loginInfo));
  } else {
    // 如果用户未勾选"记住我"，则清除之前保存的登录信息
    localStorage.removeItem('rememberedLogin');
  }
};

// 加载保存的登录信息
const loadSavedLoginInfo = () => {
  const savedInfo = localStorage.getItem('rememberedLogin');
  if (savedInfo) {
    try {
      const loginInfo = JSON.parse(savedInfo);
      loginForm.username = loginInfo.username || '';
      loginForm.password = loginInfo.password ? atob(loginInfo.password) : ''; // 解码密码
      loginForm.remember = true;
    } catch (e) {
      console.error('Failed to parse saved login info:', e);
      // 如果解析出错，清除可能已损坏的数据
      localStorage.removeItem('rememberedLogin');
    }
  }
};

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
    
    console.log('登录响应', response);
    // 检查登录是否成功
    console.log('登录状态', response.code);

    if (response.code === 999) {
      // 保存用户名，用于后续使用
      localStorage.setItem('current_username', loginForm.username);
      
      // 保存登录信息（如果选择了"记住我"）
      saveLoginInfo();
      
      ElMessage.success('登录成功');

      console.log('登录成功', response);
      // 跳转到主页

      router.push('/');
    } else {
      ElMessage.error(response.message || '用户名或密码错误');
    }
  } catch (error) {
    console.error('登录错误', error);
    ElMessage.error('登录失败，请检查网络连接');
  } finally {
    loading.value = false;
  }
};

// 在页面加载时尝试加载保存的登录信息
onMounted(() => {
  loadSavedLoginInfo();
});

// 跳转到忘记密码页面
const goToForgotPassword = () => {
  router.push('/forgot-password');
};

const goBack = () => {
  router.push('/');
};
</script>

<template>
  <div class="login-page main-background">
    <!-- 正常登录表单 -->
    <div class="login-box">
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
            <a href="javascript:;" class="forget-pwd" @click="goToForgotPassword">忘记密码?</a>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleLogin" class="login-btn">登录</el-button>
        </el-form-item>
      </el-form>
    </div>
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
