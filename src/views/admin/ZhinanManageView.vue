<script setup>
import PageTitle from '../../components/PageTitle.vue';
import ArticleManager from '../../components/ArticleManager.vue';
import { useZhinanStore } from '../../stores/zhinan';
import { storeToRefs } from 'pinia';

const zhinanStore = useZhinanStore();
const { zhinanArticleList } = storeToRefs(zhinanStore);

// 更新文章列表的函数
const updateZhinanArticles = (newArticles) => {
  zhinanStore.$patch({
    zhinanArticleList: [...newArticles]
  });
};
</script>

<template>
  <div class="manage-page main-background">
    <page-title title="服务指南管理" icon-name="icon-zhinan"></page-title>
    <div class="manage-content">
      <ArticleManager 
        :article-list="zhinanArticleList" 
        title="服务指南管理" 
        :store-update-function="updateZhinanArticles"
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
