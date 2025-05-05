import { defineStore } from 'pinia';
import axios from 'axios';
import { API_BASE_URL } from './api-config';

export const useZhinanStore = defineStore('zhinan', {
  state: () => ({
    zhinanArticles: [],
    zhinanArticleList: [], // 保留旧名称以兼容现有视图
    totalPages: 1,
    currentPage: 1,
    error: null,
    isLoading: false,
    showShare: { isShow: true }  // 添加showShare以匹配视图
  }),
  
  actions: {
    async fetchZhinan(page = 1, pageSize = 10) {
      this.isLoading = true;
      this.error = null;
      
      try {
        console.log('调用指南API:', `${API_BASE_URL}/articles?type=guide&index=${page.index}&size=${pageSize}/`);
        const response = await axios.get(`${API_BASE_URL}/articles/`, {
          params: {
            type: 'guide',
            index: page.index,
            size: pageSize
          }
        });
        
        console.log('指南API返回数据:', response.data);
        
        if (response.data.code === 200 && response.data.data) {
          // 更新两个数组以兼容视图
          this.zhinanArticles = response.data.data.article_list || [];
          this.zhinanArticleList = response.data.data.article_list || []; 
          this.totalPages = response.data.data.total_pages || 1;
          this.currentPage = response.data.data.current_page || 1;
        } else {
          this.error = response.data.message || '获取服务指南失败';
          console.error('获取服务指南失败:', response.data);
        }
      } catch (error) {
        this.error = error.message || '网络错误，请稍后再试';
        console.error('获取服务指南异常:', error);
      } finally {
        this.isLoading = false;
      }
    },
    updateZhinanArticles(updatedArticles) {
      this.zhinanArticles = updatedArticles;
      this.zhinanArticleList = updatedArticles; // 保持与视图兼容

      // 同步更新到后端
      updatedArticles.forEach(async (article) => {
        try {
          await axios.put(`${API_BASE_URL}/articles/${article.id}/`, {
            article_type: 'guide',
            title: article.title,
            url: article.url,
            pic: article.pic, // 添加封面图片字段
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
