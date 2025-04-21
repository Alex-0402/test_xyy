<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getUserSecurityQuestions, resetPassword } from '../../utils/auth';
import '@/assets/styles/common.css'; // 引入全局样式

const router = useRouter();
const step = ref(1); // 1: 输入用户名, 2: 回答安全问题, 3: 设置新密码
const username = ref('');
const securityQuestions = ref([]);
const selectedQuestion = ref(null);
const answer = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);

// 获取用户的安全问题
const fetchSecurityQuestions = async () => {
  if (!username.value) {
    ElMessage.warning('请输入用户名');
    return;
  }
  
  loading.value = true;
  try {
    const response = await getUserSecurityQuestions(username.value);
    
    if (response.status === 999) {
      securityQuestions.value = response.data || [];
      if (securityQuestions.value.length > 0) {
        selectedQuestion.value = securityQuestions.value[0].id;
        step.value = 2;
      } else {
        ElMessage.warning('该用户未设置安全问题，请联系管理员');
      }
    } else {
      ElMessage.error(response.message || '获取安全问题失败');
    }
  } catch (error) {
    console.error('获取安全问题错误', error);
    ElMessage.error('获取安全问题失败，请检查用户名是否正确');
  } finally {
    loading.value = false;
  }
};

// 重置密码
const handleResetPassword = async () => {
  if (!newPassword.value) {
    ElMessage.warning('请输入新密码');
    return;
  }
  
  if (newPassword.value !== confirmPassword.value) {
    ElMessage.warning('两次输入的密码不一致');
    return;
  }
  
  loading.value = true;
  try {
    const response = await resetPassword(
      username.value, 
      selectedQuestion.value, 
      answer.value,
      newPassword.value
    );
    
    if (response.status === 999) {
      ElMessage.success('密码重置成功，请使用新密码登录');
      router.push('/login');
    } else {
      ElMessage.error(response.message || '密码重置失败');
    }
  } catch (error) {
    console.error('密码重置错误', error);
    ElMessage.error('密码重置失败，请检查安全问题答案是否正确');
  } finally {
    loading.value = false;
  }
};

// 返回上一步骤或返回登录页
const goBack = () => {
  if (step.value > 1) {
    step.value--;
  } else {
    router.push('/login');
  }
};

// 直接返回登录页
const goToLogin = () => {
  router.push('/login');
};
</script>

<template>
  <div class="forgot-password-page main-background">
    <div class="forgot-password-box">
      <div class="forgot-password-header">
        <h2>找回密码</h2>
        <div class="back-button" @click="goToLogin">返回登录</div>
      </div>
      
      <!-- 步骤1: 输入用户名 -->
      <div v-if="step === 1">
        <p class="step-description">请输入您的用户名以获取安全问题</p>
        <el-form class="forgot-form">
          <el-form-item>
            <el-input v-model="username" placeholder="用户名">
              <template #prefix>
                <el-icon><i class="el-icon-user"></i></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="fetchSecurityQuestions" class="next-btn">下一步</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 步骤2: 回答安全问题 -->
      <div v-else-if="step === 2">
        <p class="step-description">请回答您设置的安全问题</p>
        <el-form class="forgot-form">
          <el-form-item>
            <el-select v-model="selectedQuestion" placeholder="选择安全问题" style="width: 100%">
              <el-option
                v-for="question in securityQuestions"
                :key="question.id"
                :label="question.question"
                :value="question.id"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-input v-model="answer" placeholder="您的答案">
              <template #prefix>
                <el-icon><i class="el-icon-chat-dot-round"></i></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="step = 3" class="next-btn">下一步</el-button>
            <el-button type="text" @click="goBack" class="back-btn">上一步</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 步骤3: 设置新密码 -->
      <div v-else-if="step === 3">
        <p class="step-description">请设置新密码</p>
        <el-form class="forgot-form">
          <el-form-item>
            <el-input v-model="newPassword" type="password" placeholder="新密码">
              <template #prefix>
                <el-icon><i class="el-icon-lock"></i></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="confirmPassword" type="password" placeholder="确认新密码">
              <template #prefix>
                <el-icon><i class="el-icon-lock"></i></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="handleResetPassword" class="next-btn">重置密码</el-button>
            <el-button type="text" @click="goBack" class="back-btn">上一步</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.forgot-password-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.forgot-password-box {
  width: 400px;
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.forgot-password-header {
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

.step-description {
  color: #666;
  margin-bottom: 20px;
}

.forgot-form {
  .el-input {
    margin-bottom: 10px;
  }
  
  .next-btn {
    width: 100%;
    background-color: #9c0c15;
    border-color: #9c0c15;
    
    &:hover, &:focus {
      background-color: #7a0910;
      border-color: #7a0910;
    }
  }
  
  .back-btn {
    width: 100%;
    margin-top: 10px;
    color: #9c0c15;
  }
}
</style>
