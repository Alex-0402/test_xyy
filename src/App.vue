<script setup>
import { RouterView } from 'vue-router';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
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

.main-background {
  background: url(assets/sect1_bg.png) no-repeat center center;
  background-size: cover;
}

main {
  height: calc(100vh - 56px);
  padding: 0px 0;
}
</style>
