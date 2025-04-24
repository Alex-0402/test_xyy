<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { isAuthenticated, logoutUser } from '../utils/auth';

const router = useRouter();
const isLoggedIn = ref(false);

onMounted(() => {
  checkLoginStatus();
});

// 检查登录状态
const checkLoginStatus = () => {
  isLoggedIn.value = isAuthenticated();
};

// 登出操作
const handleLogout = async () => {
  const response = await logoutUser();
  console.log('登出响应', response);
  if (response.code === 999) {
    ElMessage.success('已成功登出');
  } else {
    ElMessage.warning('登出过程中发生错误，但您已被登出系统');
  }
  
  isLoggedIn.value = false;
  router.push('/');
};

// 跳转到修改密码页面
const goToChangePassword = () => {
  router.push('/change-password');
};

// 跳转到安全问题设置页面
const goToSecurityQuestions = () => {
  router.push('/security-questions');
};

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login');
};
</script>

<template>
  <div class="user-dropdown">
    <template v-if="isLoggedIn">
      <el-dropdown trigger="click">
        <button class="admin-button">
          <span>管理员</span>
          <i class="el-icon-arrow-down"></i>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="goToChangePassword">修改密码</el-dropdown-item>
            <el-dropdown-item @click="goToSecurityQuestions">设置安全问题</el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </template>
    <button v-else class="login-button" @click="goToLogin">管理员登录</button>
  </div>
</template>

<style lang="scss" scoped>
.user-dropdown {
  position: absolute;
  top: 20px;
  right: 30px;
  z-index: 100;
}

.admin-button {
  background-color: #9c0c15;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  
  &:hover {
    background-color: #7a0910;
  }
  
  i {
    font-size: 12px;
  }
}

.login-button {
  padding: 8px 15px;
  background-color: #9c0c15;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #7a0910;
  }
}
</style>
