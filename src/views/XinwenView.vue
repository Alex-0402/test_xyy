<script setup>
import PageTitle from '../components/PageTitle.vue'
import { useXinwenStore } from '../stores/xinwen';
import '@/assets/styles/common.css'; // 引入全局样式
import { onMounted, ref } from 'vue';
import { ElButton, ElImage } from 'element-plus';

const xinwenStore = useXinwenStore();
const isLoading = ref(true);
const loadError = ref(false);
const canShare = ref(false); // 初始设置为 false

onMounted(() => {
  // 在组件挂载后（客户端环境中）安全地检测 share API
  canShare.value = 'share' in navigator;
});

onMounted(async () => {
  isLoading.value = true;
  loadError.value = false;
  
  try {
    await xinwenStore.fetchXinwen();
  } catch (error) {
    console.error('加载新闻失败:', error);
    loadError.value = true;
  } finally {
    isLoading.value = false;
  }
});

function openLink(url) {
  window.open(`${url}`, '_blank');
}

const share = async (article) => {
  if (canShare.value) {
    try {
      const shareData = {
        title: article.title,
        text: article.title,
        url: "http://38.38.251.86:8000/xinwenContent?id=" + article.id,
      }
      await navigator.share(shareData)
      console.log('分享成功')
    } catch (error) {
      console.error('分享失败', error)
    }
  } else {
    console.log('浏览器不支持Web Share API')
  }
}

</script>

<template>
  <div class="xinwen-page-wrapper main-background">
    <page-title title="校医院新闻" icon-name="icon-xinwen"></page-title>
    <div class="main">
      <el-scrollbar max-height="100%">
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
        
        <div v-else-if="loadError || xinwenStore.error" class="error-container">
          <p>加载失败，请稍后再试</p>
          <el-button type="primary" @click="xinwenStore.fetchXinwen()">重新加载</el-button>
        </div>
        
        <div v-else-if="!xinwenStore.xinwenArticles || xinwenStore.xinwenArticles.length === 0" class="empty-container">
          <p>暂无新闻</p>
        </div>
        
        <div v-else v-for="(article, index) in xinwenStore.xinwenArticles" :key="index" class="layout-single-image"  @click="openLink(article.url)">
          <div class="layout-single-image-l">
            <div style="color:#333333;">
              {{ article.title }}
            </div>
            <button v-if="canShare" style="width: fit-content;" @click="share(article)">分享</button>
          </div>
          <el-image 
            :src="article.image_url" 
            fit="cover" 
            class="image-content">
            <template #error>
              <div class="image-placeholder">暂无图片</div>
            </template>
          </el-image>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<style scoped>
.xinwen-page-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main {
  height: calc(100% - 80px);
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: rgba(97, 180, 215, 0.2);
  margin: 0px 10px 10px;
  border-radius: 8px;
}

.layout-single-image {
  height: fit-content;
  margin: 1em;
  display: flex;
  justify-content: space-between;
  padding-bottom: 1em;
  border-bottom: 0.8px solid rgb(183, 181, 181);
  width: calc(100% - 2em); /* 考虑边距的宽度 */
}

.layout-single-image-l {
  display: flex;
  flex-direction: column;
  padding-right: 0.24rem;
  font-size: 1.2rem;
  height: fit-content;
  width: 65vw; /* 固定为65%视口宽度 */
  max-width: 65vw;
  cursor: pointer; /* 确保鼠标悬停时显示为可点击 */
}

.image-content {
  width: 25vw; /* 固定为25%视口宽度 */
  height: calc(25vw * 452 / 580); /* 保持原始宽高比 */
  max-width: 145px;
  max-height: 113px;
  border-radius: 4px;
  object-fit: cover;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 14px;
}

.loading-spinner {
  width: 42px;
  height: 42px;
  border: 2px solid #409EFF;
  border-radius: 50%;
  border-top-color: transparent;
  margin: 20px 0;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<style>
.el-scrollbar__thumb {
  display: none;
}
</style>
