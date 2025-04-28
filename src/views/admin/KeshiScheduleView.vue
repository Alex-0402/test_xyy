<script setup>
import { ref, onMounted } from 'vue';
import { useKeshiStore } from '../../stores/keshi';
import PageTitle from '../../components/PageTitle.vue';
import UserDropdown from '../../components/UserDropdown.vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import '@/assets/styles/common.css';
import {
  fetchAllDepartments,
  fetchDepartmentSchedules,
  updateDepartmentSchedule,
  bulkUpdateDepartmentSchedules,
  convertToBackendDates,
  convertToFrontendWorkDays
} from '../../api/keshiScheduleApi';

const keshiStore = useKeshiStore();
const keshiList = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const editingKeshi = ref(null);
const daysOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// 加载科室数据
const loadKeshiData = async () => {
  loading.value = true;
  try {
    // 从后端获取所有科室信息
    const response = await fetchAllDepartments();
    if (response.code === 200) {
      // 将后端数据映射到前端数据格式
      const departments = response.data;
      keshiList.value = await Promise.all(departments.map(async (dept) => {
        let workDay = [0, 0, 0, 0, 0, 0, 0]; // 默认所有天都不排班
        
        try {
          // 获取科室的排班信息
          const scheduleResponse = await fetchDepartmentSchedules(dept.id);
          
          if (scheduleResponse.code === 200 && scheduleResponse.data.length > 0) {
            // 从默认排班规则中提取工作日信息
            const schedules = scheduleResponse.data;
            schedules.forEach(schedule => {
              if (schedule.department === dept.id && schedule.dates_list) {
                workDay = convertToFrontendWorkDays(schedule.dates_list);
              }
            });
          }
        } catch (error) {
          console.error(`加载科室${dept.id}排班数据出错:`, error);
        }
        
        return {
          id: dept.id,
          name: dept.name,
          opDay: convertWorkDayToText(workDay),
          workDay: workDay,
          workDayOriginal: [...workDay],
          opTime: "8:00-16:00", // 暂时使用默认值
          hotline: dept.hotline || "", // 如果后端提供了这个字段，则使用；否则使用空字符串
        };
      }));
    } else {
      ElMessage.error('加载科室数据失败');
    }
  } catch (error) {
    console.error('加载科室数据出错:', error);
    ElMessage.error('加载科室数据时出现错误');
  } finally {
    loading.value = false;
  }
};

// 将工作日数组转换为文本描述
const convertWorkDayToText = (workDay) => {
  const days = [];
  workDay.forEach((day, index) => {
    if (day === 1) {
      days.push(daysOfWeek[index]);
    }
  });
  return days.length > 0 ? days.join('、') : '无';
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
const saveKeshiSchedule = async () => {
  try {
    if (!editingKeshi.value) return;
    
    // 获取科室ID和工作日信息
    const keshiId = editingKeshi.value.id;
    const workDay = editingKeshi.value.workDay;
    
    // 转换为后端格式的日期列表
    const backendDates = convertToBackendDates(workDay);
    
    // 发送更新请求
    const response = await updateDepartmentSchedule(keshiId, backendDates);
    
    if (response.code === 200) {
      // 更新本地科室数据
      const keshiIndex = keshiList.value.findIndex(k => k.id === keshiId);
      if (keshiIndex !== -1) {
        keshiList.value[keshiIndex].workDay = [...editingKeshi.value.workDay];
        keshiList.value[keshiIndex].opDay = convertWorkDayToText(editingKeshi.value.workDay);
        keshiList.value[keshiIndex].opTime = editingKeshi.value.opTime;
        keshiList.value[keshiIndex].hotline = editingKeshi.value.hotline;
        keshiList.value[keshiIndex].workDayOriginal = [...editingKeshi.value.workDay];
      }
      
      ElMessage.success(`${editingKeshi.value.name}的排班信息已更新`);
    } else {
      ElMessage.error('保存排班信息失败');
    }
  } catch (error) {
    console.error('保存排班信息出错:', error);
    ElMessage.error('保存排班信息时出现错误');
  } finally {
    dialogVisible.value = false;
  }
};

// 切换单日排班状态
const toggleWorkDay = async (keshiId, dayIndex, value) => {
  try {
    const keshi = keshiList.value.find(k => k.id === keshiId);
    if (!keshi) return;
    
    // 更新本地状态
    keshi.workDay[dayIndex] = value;
    
    // 转换为后端格式的日期列表
    const backendDates = convertToBackendDates(keshi.workDay);
    
    // 发送更新请求
    const response = await updateDepartmentSchedule(keshiId, backendDates);
    
    if (response.code === 200) {
      // 更新本地opDay文本描述
      keshi.opDay = convertWorkDayToText(keshi.workDay);
      ElMessage.success('排班状态已更新');
    } else {
      // 如果更新失败，回滚本地状态
      keshi.workDay[dayIndex] = value === 1 ? 0 : 1;
      ElMessage.error('更新排班状态失败');
    }
  } catch (error) {
    console.error('更新排班状态出错:', error);
    ElMessage.error('更新排班状态时出现错误');
    // 回滚本地状态
    const keshi = keshiList.value.find(k => k.id === keshiId);
    if (keshi) {
      keshi.workDay[dayIndex] = value === 1 ? 0 : 1;
    }
  }
};

// 保存所有更改
const saveAllChanges = async () => {
  try {
    ElMessageBox.confirm('确定要保存所有科室排班更改吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(async () => {
      // 遍历所有科室，检查是否有更改
      const changedKeshis = keshiList.value.filter(keshi => {
        return !keshi.workDay.every((val, idx) => val === keshi.workDayOriginal[idx]);
      });
      
      if (changedKeshis.length === 0) {
        ElMessage.info('没有发现需要保存的更改');
        return;
      }
      
      // 构建批量请求数据
      const departmentSchedules = {};
      
      changedKeshis.forEach(keshi => {
        departmentSchedules[keshi.id] = convertToBackendDates(keshi.workDay);
      });
      
      // 发送批量更新请求
      const response = await bulkUpdateDepartmentSchedules(departmentSchedules);
      
      if (response.code === 200) {
        // 更新本地数据的原始值
        changedKeshis.forEach(keshi => {
          const index = keshiList.value.findIndex(k => k.id === keshi.id);
          if (index !== -1) {
            keshiList.value[index].workDayOriginal = [...keshiList.value[index].workDay];
            keshiList.value[index].opDay = convertWorkDayToText(keshiList.value[index].workDay);
          }
        });
        
        ElMessage.success('所有科室排班更改已保存');
      } else {
        ElMessage.error('保存排班更改失败');
      }
    }).catch(() => {
      // 取消操作
    });
  } catch (error) {
    console.error('保存所有更改出错:', error);
    ElMessage.error('保存过程中出现错误');
  }
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
