<script setup>
import PageTitle from '../components/PageTitle.vue'
import { useZhinanStore } from '../stores/zhinan';
import '@/assets/styles/common.css'; // 引入全局样式
const zhinanStore = useZhinanStore();

function openLink(url) {
  window.location.href = url
}

const share = async (article) => {
  if ('share' in navigator) {
    try {
      const shareData = {
        title: article.title,
        text: article.title,
        url: "https://xyy.qd.sdu.edu.cn/zhinanContent?id=" + article.id,
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
  <div class="zhinan-page-wrapper main-background">
    <page-title title="服务指南" icon-name="icon-zhinan"></page-title>
    <div class="main">
      <el-scrollbar max-height="100%">
        <div v-for="(article, index) in zhinanStore.zhinanArticleList" :key="index" class="layout-single-image">
          <div class="layout-single-image-l">
            <div style="color:#333333;" @click="openLink(article.url)">
              {{ article.title }}
            </div>
            <button v-if="zhinanStore.showShare.isShow" style="width: fit-content;" @click="share(article)">分享</button>
          </div>
          <el-image :src="article.pic" fit="cover" class="image-content" @click="openLink(article.url)">
          </el-image>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<style scoped>
.zhinan-page-wrapper {
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
}

.layout-single-image-l {
  display: flex;
  flex-direction: column;
  padding-right: 0.24rem;
  font-size: 1.2rem;
  height: fit-content;
  max-width: 57vw;
}

.image-content {
  width: calc(100vw * 580 /1920);
  height: calc(100vw * 452 /1920);
  max-width: 145px;
  max-height: 113px;
  border-radius: 4px;
}
</style>

<style>
.el-scrollbar__thumb {
  display: none;
}
</style>