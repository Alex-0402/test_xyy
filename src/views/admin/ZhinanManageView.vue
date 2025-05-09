<script setup>
import PageTitle from '../../components/PageTitle.vue';
import { useZhinanStore } from '../../stores/zhinan';
import { ref, onMounted } from 'vue';
import { API_BASE_URL, MEDIA_BASE_URL } from '../../stores/api-config';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';

const zhinanStore = useZhinanStore();
const articles = ref([]);

const getToken = () => {
  return localStorage.getItem('access_token');
};

const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

onMounted(async () => {
  try {
    await zhinanStore.fetchZhinan({
      index: currentPage.value,
      size: pageSize.value
    });
    articles.value = [...zhinanStore.zhinanArticleList];
    total.value = zhinanStore.totalPages * pageSize.value;
  } catch (error) {
    console.error('加载服务指南文章失败:', error);
  }
});

const handlePageChange = async (page) => {
  try {
    currentPage.value = page;
    await zhinanStore.fetchZhinan({
      index: currentPage.value,
      size: pageSize.value
    });
    articles.value = [...zhinanStore.zhinanArticleList];
  } catch (error) {
    console.error('加载服务指南文章失败:', error);
  }
};

const dialogVisible = ref(false);
const editingIndex = ref(-1);
const isEditing = ref(false);
const form = ref({
  id: 0,
  title: '',
  content: '',
  image_url: '', // 修改字段名
});

const resetForm = () => {
  form.value = {
    id: articles.value.length > 0 ? Math.max(...articles.value.map(a => a.id || 0)) + 1 : 1,
    title: '',
    content: '',
    image_url: '', // 修改字段名
  };
};

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
        'Content-Type': 'application/json'
      }
    });
    articles.value.splice(index, 1);
    ElMessage.success('删除成功');
    zhinanStore.updateZhinanArticles(articles.value);
  } catch (error) {
    ElMessage.error('删除失败，请检查权限或稍后再试');
    console.error('删除文章失败:', error);
  }
};

const handleAdd = () => {
  isEditing.value = false;
  resetForm();
  dialogVisible.value = true;
};

const submitForm = async () => {
  try {
    // 构造完整的表单数据
    const formData = {
      article_type: 'guide',
      title: form.value.title || '',
      url: form.value.url || '',
      image_url: form.value.image_url || '',
      is_pinned: false,
      is_reproduced: false,
    };

    if (isEditing.value) {
      const response = await axios.put(`${API_BASE_URL}/articles/${form.value.id}/`, formData, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.code === 200) {
        // 更新本地数据
        articles.value[editingIndex.value] = {
          ...form.value,
          ...response.data.data
        };
        ElMessage.success('文章已更新');
      }
    } else {
      const response = await axios.post(`${API_BASE_URL}/articles/`, formData, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.code === 201) {
        // 添加新数据到列表
        articles.value.push({
          ...form.value,
          ...response.data.data
        });
        ElMessage.success('文章已添加');
      }
    }

    zhinanStore.updateZhinanArticles(articles.value);
    dialogVisible.value = false;
  } catch (error) {
    console.error('提交表单失败:', error);
    ElMessage.error(error.response?.data?.message || '操作失败，请检查权限或稍后再试');
  }
};

// 修改上传URL和处理函数
const uploadUrl = `${API_BASE_URL}/upload/article-image/`;

const handleUploadSuccess = (response) => {
  if (response && response.code === 201) {
    // 修正返回数据的处理方式
    console.log(response);
    const imageUrl = `${MEDIA_BASE_URL}/${response.url}`;
    form.value.image_url = imageUrl;
    ElMessage.success('图片上传成功');
  } else {
    ElMessage.error('图片上传失败');
  }
};

const handleUploadError = (error) => {
  console.error('上传失败:', error);
  ElMessage.error('图片上传失败');
};
</script>

<template>
  <div class="manage-page main-background">
    <page-title title="服务指南管理" icon-name="icon-zhinan"></page-title>
    <div class="manage-content">
      <div class="article-manager">
        <div class="header">
          <h2>服务指南管理</h2>
          <el-button type="primary" @click="handleAdd" size="small">添加文章</el-button>
        </div>

        <el-table :data="articles" style="width: 100%" border>
          <el-table-column label="ID" prop="id" width="70" />
          <el-table-column label="标题" prop="title" min-width="200" />
          <el-table-column label="封面" min-width="120">
            <template #default="{ row }">
              <el-image :src="row.image_url" style="width: 80px; height: 60px;" fit="cover" />
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

        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          @current-change="handlePageChange"
          layout="prev, pager, next"
        />

        <el-dialog
          v-model="dialogVisible"
          :title="isEditing ? '编辑文章' : '添加文章'"
          width="500px"
        >
          <el-form :model="form" label-width="80px">
            <el-form-item label="标题">
              <el-input v-model="form.title" placeholder="请输入文章标题" />
            </el-form-item>
            <el-form-item label="封面">
              <div class="image-uploader">
                <el-upload
                  class="upload-demo"
                  :action="uploadUrl"
                  :headers="{ Authorization: `Bearer ${getToken()}` }"
                  :on-success="handleUploadSuccess"
                  :on-error="handleUploadError"
                  :show-file-list="false"
                  accept="image/*"
                  name="image" 
                >
                  <template v-if="form.image_url">
                    <el-image 
                      :src="form.image_url" 
                      class="preview-image"
                      fit="cover"
                    />
                  </template>
                  <el-button v-else size="small" type="primary">上传图片</el-button>
                </el-upload>
              </div>
            </el-form-item>
            <el-form-item label="链接">
              <el-input v-model="form.url" placeholder="请输入文章链接" />
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

.image-uploader {
  display: flex;
  align-items: center;
}

.preview-image {
  width: 200px;
  height: 120px;
  border-radius: 4px;
  cursor: pointer;
}

.preview-image:hover {
  opacity: 0.8;
}
</style>
