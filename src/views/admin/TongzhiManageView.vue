<script setup>
import PageTitle from '../../components/PageTitle.vue';
import ArticleManager from '../../components/ArticleManager.vue';
import { useTongzhiStore } from '../../stores/tongzhi';
import { storeToRefs } from 'pinia';

const tongzhiStore = useTongzhiStore();
const { tongzhiArticleList } = storeToRefs(tongzhiStore);

// 更新文章列表的函数
const updateTongzhiArticles = (newArticles) => {
  tongzhiStore.$patch({
    tongzhiArticleList: [...newArticles]
  });
};
</script>

<template>
  <div class="manage-page main-background">
    <page-title title="通知管理" icon-name="icon-gonggao"></page-title>
    <div class="manage-content">
      <ArticleManager 
        :article-list="tongzhiArticleList" 
        title="校医院通知管理" 
        :store-update-function="updateTongzhiArticles"
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
