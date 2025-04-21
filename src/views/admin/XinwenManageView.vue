<script setup>
import PageTitle from '../../components/PageTitle.vue';
import ArticleManager from '../../components/ArticleManager.vue';
import { useXinwenStore } from '../../stores/xinwen';
import { storeToRefs } from 'pinia';

const xinwenStore = useXinwenStore();
const { xinwenArticleList } = storeToRefs(xinwenStore);

// 更新文章列表的函数
const updateXinwenArticles = (newArticles) => {
  xinwenStore.$patch({
    xinwenArticleList: [...newArticles]
  });
};
</script>

<template>
  <div class="manage-page main-background">
    <page-title title="新闻管理" icon-name="icon-xinwen"></page-title>
    <div class="manage-content">
      <ArticleManager 
        :article-list="xinwenArticleList" 
        title="校医院新闻管理" 
        :store-update-function="updateXinwenArticles"
      />
    </div>
  </div>
</template>

<style scoped>
.manage-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.manage-content {
  flex: 1;
  background-color: #fff;
  margin: 0 10px 10px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
