<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { isAuthenticated, setSecurityQuestions, getUserSecurityQuestions } from '../../utils/auth';
import '@/assets/styles/common.css'; // 引入全局样式

const router = useRouter();
const loading = ref(false);
const fetchingQuestions = ref(false);

// 安全问题列表
const questions = ref([
  { question: '', answer: '' }
]);

// 获取当前登录用户的用户名
const getCurrentUsername = () => {
  // 通常存储在JWT中或本地存储中
  // 这里简单实现，实际中应该从JWT解码或其他地方获取
  return localStorage.getItem('current_username') || 'test_admin';
};

// 检查用户是否已登录，并获取已有的安全问题
onMounted(async () => {
  if (!isAuthenticated()) {
    ElMessage.warning('请先登录');
    router.push('/login');
    return;
  }
  
  await fetchExistingQuestions();
});

// 获取已有的安全问题
const fetchExistingQuestions = async () => {
  fetchingQuestions.value = true;
  
  try {
    const username = getCurrentUsername();
    ElMessage.info('正在获取已设置的安全问题...');
    
    const response = await getUserSecurityQuestions(username);
    console.log('获取安全问题响应:', response);
    
    if (response.status === 999 && response.data && response.data.length > 0) {
      // 创建新的问题数组，包含问题但不包含答案（答案需要用户重新填写）
      questions.value = response.data.map(item => ({
        id: item.id,
        question: item.question,
        answer: ''  // 答案为空，需要用户填写
      }));
      
      ElMessage.success('已加载您设置的安全问题，请填写答案');
    } else if (response.status === 1000) {
      // 用户未设置安全问题，保持默认空表单
      ElMessage.info('您尚未设置安全问题，请设置');
    }
  } catch (error) {
    console.error('获取安全问题失败:', error);
    ElMessage.error('获取安全问题失败，请稍后再试');
  } finally {
    fetchingQuestions.value = false;
  }
};

// 添加安全问题
const addQuestion = () => {
  if (questions.value.length < 3) {
    questions.value.push({ question: '', answer: '' });
  } else {
    ElMessage.warning('最多只能设置3个安全问题');
  }
};

// 删除安全问题
const removeQuestion = (index) => {
  if (questions.value.length > 1) {
    questions.value.splice(index, 1);
  } else {
    ElMessage.warning('至少需要设置1个安全问题');
  }
};

// 保存安全问题
const saveQuestions = async () => {
  // 验证问题和答案不为空
  const isValid = questions.value.every(q => q.question.trim() !== '' && q.answer.trim() !== '');
  if (!isValid) {
    ElMessage.warning('问题和答案不能为空');
    return;
  }
  
  loading.value = true;
  try {
    console.log('发送安全问题数据:', questions.value);
    const response = await setSecurityQuestions(questions.value);
    console.log('安全问题设置响应:', response);
    
    if (response && response.status === 999) {
      ElMessage.success('安全问题设置成功');
      router.push('/');
    } else {
      ElMessage.error(response.message || '安全问题设置失败');
    }
  } catch (error) {
    console.error('设置安全问题错误', error);
    ElMessage.error('安全问题设置失败：' + (error.message || '未知错误'));
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
  <div class="security-questions-page-wrapper">
    <div class="security-questions-page main-background">
      <div class="security-questions-box">
        <div class="security-questions-header">
          <h2>设置安全问题</h2>
          <div class="back-button" @click="goBack">返回主页</div>
        </div>
        
        <p class="description">设置安全问题可以帮助您在忘记密码时重置密码（最多3个问题）</p>
        
        <div v-if="fetchingQuestions" class="loading-container">
          <el-skeleton :rows="3" animated />
          <div class="loading-text">正在获取已设置的安全问题...</div>
        </div>
        
        <el-form class="security-questions-form" v-else>
          <div v-for="(item, index) in questions" :key="index" class="question-item">
            <el-form-item>
              <el-input 
              v-model="item.question" 
              placeholder="安全问题">
              <template #prefix>
                <el-icon class="el-icon-question"></el-icon>
              </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-input v-model="item.answer" placeholder="答案">
                <template #prefix>
                  <el-icon class="el-icon-chat-dot-round"></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <div class="question-actions">
              <el-button type="danger" @click="removeQuestion(index)" 
                        v-if="questions.length > 1">删除</el-button>
            </div>
          </div>
          
          <el-form-item v-if="questions.length < 3">
            <el-button type="primary" @click="addQuestion">添加安全问题</el-button>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="saveQuestions" class="submit-btn">保存安全问题</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.security-questions-page-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.security-questions-page {
  flex: 1; /* 让内容区域占据剩余空间 */
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
}

.security-questions-box {
  width: 500px;
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.security-questions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
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

.description {
  color: #666;
  margin-bottom: 20px;
}

.loading-container {
  padding: 20px 0;
  text-align: center;
}

.loading-text {
  margin-top: 15px;
  color: #666;
  font-size: 14px;
}

.question-item {
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 5px;
  margin-bottom: 15px;
  position: relative;
}

.security-questions-form {
  .question-item {
    padding: 15px;
    border: 1px solid #eee;
    border-radius: 5px;
    margin-bottom: 15px;
    position: relative;
  }
  
  .question-actions {
    margin-top: 10px;
    text-align: right;
  }
  
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
</style>
