import { defineStore } from 'pinia';
import axios from 'axios';
import { API_BASE_URL } from './api-config';

export const useTongzhiStore = defineStore('tongzhi', {
  state: () => ({
    tongzhiArticles: [],
    tongzhiArticleList: [], // 保留旧名称以兼容现有视图
    totalPages: 1,
    currentPage: 1,
    error: null,
    isLoading: false,
    showShare: { isShow: true }  // 添加showShare以匹配视图
  }),
  
  actions: {
    async fetchTongzhi(page = 1, pageSize = 10) {
      this.isLoading = true;
      this.error = null;
      
      try {
        console.log('调用通知API:', `${API_BASE_URL}/articles?type=notice&index=${page}&size=${pageSize}`);
        const response = await axios.get(`${API_BASE_URL}/articles`, {
          params: {
            type: 'notice',
            index: page,
            size: pageSize
          }
        });
        
        console.log('通知API返回数据:', response.data);
        
        if (response.data.code === 200 && response.data.data) {
          // 更新两个数组以兼容视图
          this.tongzhiArticles = response.data.data.article_list || [];
          this.tongzhiArticleList = response.data.data.article_list || [];
          this.totalPages = response.data.data.total_pages || 1;
          this.currentPage = response.data.data.current_page || 1;
        } else {
          this.error = response.data.message || '获取通知失败';
          console.error('获取通知失败:', response.data);
        }
      } catch (error) {
        this.error = error.message || '网络错误，请稍后再试';
        console.error('获取通知异常:', error);
      } finally {
        this.isLoading = false;
      }
    },
    updateTongzhiArticles(updatedArticles) {
      this.tongzhiArticles = updatedArticles;
      this.tongzhiArticleList = updatedArticles; // 保持与视图兼容

      // 同步更新到后端
      updatedArticles.forEach(async (article) => {
        try {
          await axios.put(`${API_BASE_URL}/articles/${article.id}`, {
            title: article.title,
            content: article.content,
            pic: article.pic,
            is_pinned: article.is_pinned || false,
          }, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error(`更新文章 ${article.id} 失败:`, error);
        }
      });
    }
  }
});
