<script setup>
import PageTitle from '../../components/PageTitle.vue';
import { useKepuStore } from '../../stores/kepu';
import { ref, onMounted } from 'vue';
import { API_BASE_URL } from '../../stores/api-config';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';

const kepuStore = useKepuStore();
const articles = ref([]);

const getToken = () => {
  return localStorage.getItem('access_token');
};

// 在组件挂载时获取文章列表
onMounted(async () => {
  try {
    await kepuStore.fetchKepu();
    articles.value = [...kepuStore.kepuArticleList];
  } catch (error) {
    console.error('加载科普文章失败:', error);
  }
});

// 表单数据
const dialogVisible = ref(false);
const editingIndex = ref(-1);
const isEditing = ref(false);
const form = ref({
  id: 0,
  title: '',
  pic: '',
  url: ''
});

// 重置表单
const resetForm = () => {
  form.value = {
    id: articles.value.length > 0 ? Math.max(...articles.value.map(a => a.id || 0)) + 1 : 1,
    title: '',
    pic: '',
    url: ''
  };
};

// 处理编辑
const handleEdit = (index) => {
  editingIndex.value = index;
  isEditing.value = true;
  form.value = { ...articles.value[index] };
  form.value.url = articles.value[index].url || ''; // 确保 url 字段存在
  dialogVisible.value = true;
};

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
    await axios.delete(`${API_BASE_URL}/articles/${articles.value[index].id}/`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      }
    });
    articles.value.splice(index, 1);
    ElMessage.success('删除成功');
    kepuStore.updateKepuArticles(articles.value);
  } catch (error) {
    ElMessage.error('删除失败，请检查权限或稍后再试');
    console.error('删除文章失败:', error);
  }
};

// 处理添加
const handleAdd = () => {
  isEditing.value = false;
  resetForm();
  dialogVisible.value = true;
};

const submitForm = async () => {
  form.value.title = form.value.title || ''; // 如果为空则置为空字符串
  form.value.pic = form.value.pic || ''; // 如果为空则置为空字符串
  form.value.url = form.value.url || ''; // 如果为空则置为空字符串

  try {
    if (isEditing.value) {
      await axios.put(`${API_BASE_URL}/articles/${form.value.id}/`, {
        title: form.value.title,
        url: form.value.url,
        pic: form.value.pic,
        is_pinned: false,
        article_type: 'science',
      }, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        }
      });
      articles.value[editingIndex.value] = { ...form.value };
      ElMessage.success('文章已更新');
    } else {
      const response = await axios.post(`${API_BASE_URL}/articles/`, {
        article_type: 'science',
        title: form.value.title,
        url: form.value.url,
        pic: form.value.pic,
        is_pinned: false,
      }, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        }
      });
      articles.value.push({ ...form.value, id: response.data.data.id });
      ElMessage.success('文章已添加');
    }

    kepuStore.updateKepuArticles(articles.value);
    dialogVisible.value = false;
  } catch (error) {
    ElMessage.error('操作失败，请检查权限或稍后再试');
    console.error('提交表单失败:', error);
  }
};
</script>

<template>
  <div class="manage-page main-background">
    <page-title title="科普文章管理" icon-name="icon-baojian"></page-title>
    <div class="manage-content">
      <div class="article-manager">
        <div class="header">
          <h2>健康科普文章管理</h2>
          <el-button type="primary" @click="handleAdd" size="small">添加文章</el-button>
        </div>

        <el-table :data="articles" style="width: 100%" border>
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

.article-manager {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.el-table {
  margin-bottom: 20px;
}
</style>
