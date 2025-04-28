import { defineStore } from 'pinia';
import axios from 'axios';
import { API_BASE_URL } from './api-config';

export const useKepuStore = defineStore('kepu', {
  state: () => ({
    kepuArticles: [],
    kepuArticleList: [], // 保留旧名称以兼容现有视图
    totalPages: 1,
    currentPage: 1,
    error: null,
    isLoading: false,
    showShare: { isShow: true }  // 添加showShare以匹配视图
  }),
  
  actions: {
    async fetchKepu(page = 1, pageSize = 10) {
      this.isLoading = true;
      this.error = null;
      
      try {
        console.log('调用科普API:', `${API_BASE_URL}/articles?type=science&index=${page}&size=${pageSize}`);
        const response = await axios.get(`${API_BASE_URL}/articles`, {
          params: {
            type: 'science',
            index: page,
            size: pageSize
          }
        });
        
        console.log('科普API返回数据:', response.data);
        
        if (response.data.code === 200 && response.data.data) {
          // 更新两个数组以兼容视图
          this.kepuArticles = response.data.data.article_list || [];
          this.kepuArticleList = response.data.data.article_list || [];
          this.totalPages = response.data.data.total_pages || 1;
          this.currentPage = response.data.data.current_page || 1;
        } else {
          this.error = response.data.message || '获取科普内容失败';
          console.error('获取科普内容失败:', response.data);
        }
      } catch (error) {
        this.error = error.message || '网络错误，请稍后再试';
        console.error('获取科普内容异常:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }
});
