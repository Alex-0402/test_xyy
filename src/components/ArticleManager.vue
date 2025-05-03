<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';
import { API_BASE_URL } from '../stores/api-config';

const props = defineProps({
  title: String,
  articleType: String, // 文章类型（如 'news', 'guide', 'notice', 'science'）
});

const articles = ref([]);
const searchQuery = ref(''); // 搜索框绑定的值
const dialogVisible = ref(false);
const editingIndex = ref(-1);
const isEditing = ref(false);
const form = ref({
  id: 0,
  title: '',
  pic: '',
  url: '',
  content: '',
});

// 计算属性：根据搜索条件筛选文章
const filteredArticles = computed(() => {
  if (!searchQuery.value.trim()) {
    return articles.value;
  }
  return articles.value.filter(article =>
    article.title.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 加载文章列表
const loadArticles = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/articles`, {
      params: {
        type: props.articleType,
        size: 100, // 假设一次加载所有文章
        index: 1,
      },
    });
    if (response.data.code === 200) {
      articles.value = response.data.data.article_list || [];
    } else {
      ElMessage.error(response.data.message || '加载文章失败');
    }
  } catch (error) {
    console.error('加载文章失败:', error);
    ElMessage.error('加载文章失败，请稍后再试');
  }
};

// 重置表单
const resetForm = () => {
  form.value = {
    id: articles.value.length > 0 ? Math.max(...articles.value.map(a => a.id)) + 1 : 1,
    title: '',
    pic: '',
    url: '',
    content: '',
  };
};

// 处理编辑
const handleEdit = (index) => {
  editingIndex.value = index;
  isEditing.value = true;
  form.value = { ...articles.value[index] };
  dialogVisible.value = true;
};

// 处理删除
const handleDelete = async (index) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文章"${articles.value[index].title}"吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    const articleId = articles.value[index].id;
    await axios.delete(`${API_BASE_URL}/articles/${articleId}`);
    articles.value.splice(index, 1);
    ElMessage.success('删除成功');
  } catch (error) {
    console.error('删除文章失败:', error);
    ElMessage.error('删除失败，请稍后再试');
  }
};

// 处理添加
const handleAdd = () => {
  isEditing.value = false;
  resetForm();
  dialogVisible.value = true;
};

// 提交表单
const submitForm = async () => {
  if (!form.value.title || !form.value.content) {
    ElMessage.error('标题和内容为必填项');
    return;
  }

  try {
    if (isEditing.value) {
      // 编辑现有文章
      await axios.put(`${API_BASE_URL}/articles/${form.value.id}`, {
        title: form.value.title,
        content: form.value.content,
        article_type: props.articleType,
        is_pinned: false,
      });
      articles.value[editingIndex.value] = { ...form.value };
      ElMessage.success('文章已更新');
    } else {
      // 添加新文章
      const response = await axios.post(`${API_BASE_URL}/articles`, {
        title: form.value.title,
        content: form.value.content,
        article_type: props.articleType,
        is_pinned: false,
      });
      articles.value.push({ ...form.value, id: response.data.data.id });
      ElMessage.success('文章已添加');
    }
    dialogVisible.value = false;
  } catch (error) {
    console.error('提交表单失败:', error);
    ElMessage.error('操作失败，请稍后再试');
  }
};

// 页面加载时获取文章列表
onMounted(() => {
  loadArticles();
});
</script>

<template>
  <div class="article-manager">
    <div class="header">
      <h2>{{ title }}</h2>
      <div class="actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索文章标题"
          size="small"
          clearable
          style="width: 200px; margin-right: 10px;"
        />
        <el-button type="primary" @click="handleAdd" size="small">添加文章</el-button>
      </div>
    </div>

    <el-table :data="filteredArticles" style="width: 100%" border>
      <el-table-column label="ID" prop="id" width="70" />
      <el-table-column label="标题" prop="title" min-width="200" />
      <el-table-column label="封面" min-width="120">
        <template #default="{ row }">
          <el-image :src="row.pic" style="width: 80px; height: 60px;" fit="cover" />
        </template>
      </el-table-column>
      <el-table-column label="链接" prop="url" min-width="150" />
      <el-table-column label="操作" width="150">
        <template #default="{ $index }">
          <el-button type="primary" size="small" @click="handleEdit($index)">编辑</el-button>
          <el-button type="danger" size="small" @click="handleDelete($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑文章' : '添加文章'"
      width="500px"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="请输入文章标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input type="textarea" v-model="form.content" placeholder="请输入文章内容" />
        </el-form-item>
        <el-form-item label="封面URL">
          <el-input v-model="form.pic" placeholder="请输入封面图片URL" />
        </el-form-item>
        <el-form-item label="文章链接">
          <el-input v-model="form.url" placeholder="请输入文章链接URL" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.article-manager {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  align-items: center;
}

.el-table {
  margin-bottom: 20px;
}
</style>
