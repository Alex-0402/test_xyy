<script setup>
import { RouterView } from 'vue-router';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import '@/assets/styles/common.css'; // 引入全局样式
</script>

<template>
  <div class="app-wrapper">
    <Header />
    <main class="main-content">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<style lang="scss" scoped>
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* 确保页面高度至少为视口高度 */
}

.main-content {
  flex: 1; /* 让内容区域占据剩余空间 */
}

main {
  height: calc(100vh - 56px);
  padding: 0px 0;
}
</style>
