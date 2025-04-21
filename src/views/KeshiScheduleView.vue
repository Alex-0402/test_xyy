<script setup>
import { ref, onMounted } from 'vue';
import { useKeshiStore } from '../stores/keshi';
import PageTitle from '../components/PageTitle.vue';
import UserDropdown from '../components/UserDropdown.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import '@/assets/styles/common.css';

const keshiStore = useKeshiStore();
const keshiList = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const editingKeshi = ref(null);
const daysOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// 加载科室数据
const loadKeshiData = () => {
  loading.value = true;
  keshiList.value = keshiStore.keshiList.map(keshi => ({
    ...keshi,
    workDayOriginal: [...keshi.workDay] // 保存原始值用于检测更改
  }));
  loading.value = false;
};

// 编辑科室排班
const editKeshiSchedule = (keshi) => {
  editingKeshi.value = {
    ...keshi,
    workDay: [...keshi.workDay] // 创建副本防止直接修改原数据
  };
  dialogVisible.value = true;
};

// 保存科室排班更改
const saveKeshiSchedule = () => {
  const keshiIndex = keshiStore.keshiList.findIndex(k => k.id === editingKeshi.value.id);
  if (keshiIndex !== -1) {
    const keshi = keshiStore.keshiList[keshiIndex];
    // 更新排班信息
    for (let i = 0; i < 7; i++) {
      keshi.workDay[i] = editingKeshi.value.workDay[i];
    }
    
    // 更新工作日文字描述
    keshiStore.updateKeshiOpDay(keshi);
    
    ElMessage.success(`${keshi.name}的排班信息已更新`);
    loadKeshiData();
  }
  
  dialogVisible.value = false;
};

// 切换单日排班状态
const toggleWorkDay = (keshiId, dayIndex, value) => {
  keshiStore.toggleKeshiWorkDay(keshiId, dayIndex, value);
  // 重新加载数据以反映更改
  loadKeshiData();
  ElMessage.success('排班状态已更新');
};

// 保存所有更改
const saveAllChanges = () => {
  ElMessageBox.confirm('确定要保存所有科室排班更改吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    ElMessage.success('所有科室排班更改已保存');
    // 在实际应用中，这里应该调用API将更改保存到后端
  }).catch(() => {
    // 取消操作
  });
};

onMounted(() => {
  loadKeshiData();
});
</script>

<template>
  <div class="keshi-schedule-page main-background">
    <div class="header-container">
      <user-dropdown></user-dropdown>
    </div>
    
    <page-title title="科室排班管理" icon-name="icon-rili"></page-title>
    
    <div class="main-content">
      <div class="schedule-header">
        <h3>科室每周值班安排</h3>
        <el-button type="primary" @click="saveAllChanges">保存所有更改</el-button>
      </div>
      
      <el-table
        v-loading="loading"
        :data="keshiList"
        style="width: 100%"
      >
        <el-table-column prop="name" label="科室名称" width="120"></el-table-column>
        <el-table-column prop="opDay" label="值班日" width="200"></el-table-column>
        <el-table-column label="周日" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.workDay[0]"
              :active-value="1"
              :inactive-value="0"
              @change="(val) => toggleWorkDay(row.id, 0, val)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="周一" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.workDay[1]"
              :active-value="1"
              :inactive-value="0"
              @change="(val) => toggleWorkDay(row.id, 1, val)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="周二" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.workDay[2]"
              :active-value="1"
              :inactive-value="0"
              @change="(val) => toggleWorkDay(row.id, 2, val)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="周三" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.workDay[3]"
              :active-value="1"
              :inactive-value="0"
              @change="(val) => toggleWorkDay(row.id, 3, val)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="周四" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.workDay[4]"
              :active-value="1"
              :inactive-value="0"
              @change="(val) => toggleWorkDay(row.id, 4, val)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="周五" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.workDay[5]"
              :active-value="1"
              :inactive-value="0"
              @change="(val) => toggleWorkDay(row.id, 5, val)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="周六" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.workDay[6]"
              :active-value="1"
              :inactive-value="0"
              @change="(val) => toggleWorkDay(row.id, 6, val)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="editKeshiSchedule(scope.row)"
            >
              详细设置
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 编辑科室排班的对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingKeshi ? `编辑${editingKeshi.name}排班` : '编辑排班'"
      width="600px"
    >
      <div v-if="editingKeshi" class="keshi-schedule-editor">
        <div class="keshi-info">
          <h3>{{ editingKeshi.name }}</h3>
          <p>当前值班日: {{ editingKeshi.opDay }}</p>
        </div>
        
        <div class="schedule-settings">
          <h4>选择值班日</h4>
          <div class="day-selector">
            <div 
              v-for="(day, index) in daysOfWeek" 
              :key="index"
              class="day-item" 
              :class="{ active: editingKeshi.workDay[index] === 1 }"
              @click="editingKeshi.workDay[index] = editingKeshi.workDay[index] === 1 ? 0 : 1"
            >
              {{ day }}
            </div>
          </div>
        </div>
        
        <div class="schedule-additional-info">
          <h4>其他信息</h4>
          <el-form :model="editingKeshi" label-position="top">
            <el-form-item label="值班时间">
              <el-input v-model="editingKeshi.opTime" placeholder="例如: 8:00-16:00"></el-input>
            </el-form-item>
            <el-form-item label="联系电话">
              <el-input v-model="editingKeshi.hotline" placeholder="例如: (0532) 58 631 039"></el-input>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveKeshiSchedule">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.keshi-schedule-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: 30px;
}

.header-container {
  position: relative;
  width: 100%;
  height: 60px;
}

.main-content {
  margin: 20px;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 4px;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.schedule-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

/* 科室排班编辑器样式 */
.keshi-schedule-editor {
  padding: 10px;
}

.keshi-info {
  margin-bottom: 20px;
}

.keshi-info h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 20px;
  color: #333;
}

.day-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.day-item {
  padding: 10px 15px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.day-item:hover {
  background-color: #f5f7fa;
}

.day-item.active {
  background-color: #9c0c15;
  color: white;
  border-color: #9c0c15;
}

.schedule-additional-info {
  margin-top: 20px;
}

.schedule-additional-info h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}
</style>
