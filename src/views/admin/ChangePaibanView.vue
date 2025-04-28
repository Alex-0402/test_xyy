<script setup>
import moment from 'moment';
import PageTitle from '../../components/PageTitle.vue';
import KeshiNav from '../../components/KeshiNav.vue';
import UserDropdown from '../../components/UserDropdown.vue';
import { computed, ref, reactive, onMounted } from 'vue';
import { useKeshiStore } from '../../stores/keshi';
import { useDoctorStore } from "../../stores/doctor";
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';
import '@/assets/styles/common.css';
import { 
  getDepartments, 
  getDepartmentSchedules, 
  updateSchedule, 
  getDepartmentDoctors,
  getScheduleDetail
} from '../../utils/scheduleApi';

const keshiStore = useKeshiStore();
const doctorStore = useDoctorStore();

// 获取当前日期和未来两周的日期
const weekdaysShort = '周日_周一_周二_周三_周四_周五_周六'.split('_');
const datesFromToday = [];
for (let i = 0; i < 14; i++) {
  datesFromToday.push(moment().add(i, 'days'));
}

// 将日期分成两周
const firstWeekDates = datesFromToday.slice(0, 7);
const secondWeekDates = datesFromToday.slice(7, 14);

const showDate = ref(datesFromToday[0]);
const tableData = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const editingDoctor = ref(null);
const departments = ref([]);
const activeKeshi = ref(null);
const scheduleMap = ref({});  // 用于存储科室两周的排班信息
const modified = ref(false);  // 标记是否有未保存的修改

// 根据日期获取cycle_day (1-14)
const getCycleDay = (date) => {
  const today = moment().startOf('day');
  const targetDate = moment(date).startOf('day');
  const diffDays = targetDate.diff(today, 'days');
  return diffDays + 1;
};

// 根据cycle_day获取日期
const getDateByCycleDay = (cycleDay) => {
  return moment().add(cycleDay - 1, 'days');
};

// 初始化数据
onMounted(async () => {
  try {
    const loadingInstance = ElLoading.service({ fullscreen: true, text: '加载数据中...' });
    
    // 获取科室列表
    const deptData = await getDepartments();
    departments.value = deptData;
    
    if (departments.value.length > 0) {
      activeKeshi.value = departments.value[0];
      
      // 获取该科室的排班
      await loadDepartmentSchedules(activeKeshi.value.id);
    }
    
    loadingInstance.close();
  } catch (error) {
    ElMessage.error('加载数据失败，请稍后再试');
    console.error('初始化数据失败:', error);
  }
});

// 加载科室排班
const loadDepartmentSchedules = async (departmentId) => {
  try {
    loading.value = true;
    const schedules = await getDepartmentSchedules(departmentId);
    console.log('schedules:', schedules);
    // 初始化或重置排班映射
    scheduleMap.value = {};
    
    // 将排班数据按cycle_day组织并映射到对应日期
    schedules.forEach(schedule => {
      const cycleDay = schedule.cycle_day;
      const scheduleDate = getDateByCycleDay(cycleDay);
      const dateKey = scheduleDate.format('MM.DD');
      
      scheduleMap.value[dateKey] = {
        ...schedule,
        date: scheduleDate.format('YYYY-MM-DD')
      };
    });
    
    // 加载当前选中日期的医生数据
    await loadDoctorData();
    loading.value = false;
  } catch (error) {
    loading.value = false;
    ElMessage.error('加载科室排班失败');
    console.error('加载科室排班失败:', error);
  }
};

// 科室列表
const keshiList = computed(() => {
  return departments.value;
});

// 切换日期
function changeShowDate(date) {
  showDate.value = date;
  loadDoctorData();
}

// 切换科室
async function changeKeshi(keshi) {
  if (modified.value) {
    const result = await ElMessageBox.confirm(
      '有未保存的排班修改，是否保存当前修改？',
      '未保存修改',
      {
        confirmButtonText: '保存',
        cancelButtonText: '不保存',
        type: 'warning'
      }
    ).catch(() => 'cancel');
    
    if (result === 'confirm') {
      await saveAllChanges();
    }
    
    modified.value = false;
  }
  
  activeKeshi.value = keshi;
  await loadDepartmentSchedules(keshi.id);
}

// 加载医生数据
const loadDoctorData = async () => {
  if (!activeKeshi.value) return;
  
  loading.value = true;
  
  try {
    // 获取当前科室的医生列表
    const departmentDoctors = await getDepartmentDoctors(activeKeshi.value.id);
    
    // 获取当前日期的排班
    const currentDate = showDate.value.format('MM.DD');
    const currentSchedule = scheduleMap.value[currentDate];
    console.log('scheduleMap:', scheduleMap.value);
    if (!currentSchedule) {
      // 如果没有当前日期的排班数据
      ElMessage.warning('无法获取当前日期排班数据，请刷新页面重试');
      tableData.value = [];
      loading.value = false;
      return;
    }
    
    // 检查医生是否在选定日期出诊
    tableData.value = departmentDoctors.map(doctor => {
      const isScheduled = currentSchedule.doctors.some(d => d.id === doctor.id);
      
      return {
        ...doctor,
        isScheduled,
        originalStatus: isScheduled // 保存原始状态用于检测更改
      };
    });
  } catch (error) {
    ElMessage.error('加载医生数据失败');
    console.error('加载医生数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 编辑医生排班
const editDoctorSchedule = (doctor) => {
  editingDoctor.value = { ...doctor };
  dialogVisible.value = true;
};

// 保存医生排班更改
const saveDoctorSchedule = async () => {
  const formattedDate = showDate.value.format('MM.DD');
  
  try {
    // 获取当前日期的排班
    const currentSchedule = scheduleMap.value[formattedDate];
    
    if (!currentSchedule) {
      ElMessage.error('无法获取当前日期排班数据');
      return;
    }
    
    // 更新本地数据
    if (editingDoctor.value.isScheduled) {
      // 添加该医生到排班
      if (!currentSchedule.doctors.some(d => d.id === editingDoctor.value.id)) {
        currentSchedule.doctors.push({
          id: editingDoctor.value.id,
          name: editingDoctor.value.name,
          title: editingDoctor.value.title
        });
      }
    } else {
      // 从排班中移除该医生
      currentSchedule.doctors = currentSchedule.doctors.filter(d => d.id !== editingDoctor.value.id);
    }
    
    // 更新排班到后端
    await updateSchedule(currentSchedule.id, {
      is_scheduled: false,
      doctors: currentSchedule.doctors.map(d => d.id)
    });
    
    ElMessage.success(`已${editingDoctor.value.isScheduled ? '添加' : '取消'}${editingDoctor.value.name}在${formattedDate}的出诊`);
    
    // 刷新表格数据
    await loadDoctorData();
  } catch (error) {
    ElMessage.error('保存排班失败');
    console.error('保存排班失败:', error);
  }
  
  dialogVisible.value = false;
};

// 批量更改排班状态
const changeScheduleStatus = async (index, row, status) => {
  const formattedDate = showDate.value.format('MM.DD');
  
  try {
    // 获取当前日期的排班
    const currentSchedule = scheduleMap.value[formattedDate];
    
    if (!currentSchedule) {
      ElMessage.error('无法获取当前日期排班数据');
      return;
    }
    
    // 标记有修改
    modified.value = true;
    
    // 更新本地数据，先不发送到后端
    row.isScheduled = status;
    
    // 在本地更新医生列表
    if (status) {
      if (!currentSchedule.doctors.some(d => d.id === row.id)) {
        currentSchedule.doctors.push({
          id: row.id,
          name: row.name,
          title: row.title
        });
      }
    } else {
      currentSchedule.doctors = currentSchedule.doctors.filter(d => d.id !== row.id);
    }
    
    ElMessage.success(`已${status ? '添加' : '取消'}${row.name}在${formattedDate}的出诊（未保存）`);
  } catch (error) {
    ElMessage.error('更改排班状态失败');
    console.error('更改排班状态失败:', error);
    loadDoctorData(); // 重新加载以恢复状态
  }
};

// 保存所有更改
const saveAllChanges = async () => {
  try {
    const loadingInstance = ElLoading.service({ fullscreen: true, text: '保存中...' });
    
    // 获取当前日期的排班
    const formattedDate = showDate.value.format('MM.DD');
    const currentSchedule = scheduleMap.value[formattedDate];
    
    if (!currentSchedule) {
      ElMessage.error('无法获取当前日期排班数据');
      loadingInstance.close();
      return;
    }
    
    // 更新排班到后端
    try {
      await updateSchedule(currentSchedule.id, {
        is_scheduled: false,
        doctors: currentSchedule.doctors.map(d => d.id)
      });
      
      modified.value = false;
      ElMessage.success('排班更改已保存');
    } catch (error) {
      if (error.message === '身份验证失败，请重新登录') {
        ElMessageBox.alert('登录已过期，请重新登录', '提示', {
          confirmButtonText: '确定',
          callback: () => {
            // 重定向到登录页面
            window.location.href = '/login';
          }
        });
      } else {
        ElMessage.error(`保存排班失败: ${error.message}`);
      }
    }
    
    loadingInstance.close();
  } catch (error) {
    ElMessage.error('保存排班失败');
    console.error('保存排班失败:', error);
  }
};

// 修复BASE_URL为正确的API端口
const BASE_URL = 'http://38.38.251.86:8000/api';
</script>

<template>
  <div class="paiban-page-wrapper main-background">
    <div class="header-container">
      <user-dropdown></user-dropdown>
    </div>
    
    <page-title title="排班管理" icon-name="icon-rili"></page-title>
    
    <div class="top">
      <!-- 两周日期分成上下两排显示 -->
      <ul class="date-nav">
        <li v-for="(date, index) in firstWeekDates" :key="'week1-' + index" class="date-item"
          :class="{ 'is-active': showDate.format('YYYY-MM-DD') === date.format('YYYY-MM-DD') }" 
          @click="changeShowDate(date)">
          <p>{{ date.format('MM.DD') }}</p>
          <p>{{ weekdaysShort[date.day()] }}</p>
        </li>
      </ul>
      <ul class="date-nav">
        <li v-for="(date, index) in secondWeekDates" :key="'week2-' + index" class="date-item"
          :class="{ 'is-active': showDate.format('YYYY-MM-DD') === date.format('YYYY-MM-DD') }" 
          @click="changeShowDate(date)">
          <p>{{ date.format('MM.DD') }}</p>
          <p>{{ weekdaysShort[date.day()] }}</p>
        </li>
      </ul>
    </div>

    <div class="main">
      <div class="keshi-section">
        <h3 class="section-title">选择科室</h3>
        <ul class="keshi-list">
          <li v-for="keshi in keshiList" :key="keshi.id" 
              class="keshi-item"
              :class="{ 'is-active': activeKeshi && activeKeshi.id === keshi.id }"
              @click="changeKeshi(keshi)">
            {{ keshi.name }}
          </li>
        </ul>
      </div>

      <div class="schedule-section">
        <div class="schedule-header">
          <h3 class="section-title">
            {{ activeKeshi ? activeKeshi.name : '请选择科室' }} - 
            {{ showDate.format('YYYY年MM月DD日') }} {{ weekdaysShort[showDate.day()] }}排班情况
          </h3>
          <el-button type="primary" @click="saveAllChanges" :disabled="!activeKeshi || !modified">保存更改</el-button>
        </div>
        
        <el-table
          v-loading="loading"
          :data="tableData"
          style="width: 100%"
          :empty-text="activeKeshi ? '该科室暂无医生' : '请先选择科室'"
        >
          <!-- 保留图片URL的端口为8001 -->
          <el-table-column label="头像" width="80">
            <template #default="{ row }">
              <el-avatar :size="50" :src="row.avatar_url ? `http://38.38.251.86:8001${row.avatar_url}` : ''" v-if="row.avatar_url"></el-avatar>
              <el-avatar :size="50" icon="el-icon-user" v-else></el-avatar>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="姓名" width="100"></el-table-column>
          <el-table-column prop="title" label="职称" width="150"></el-table-column>
          <el-table-column prop="introduction" label="专长" show-overflow-tooltip></el-table-column>
          <el-table-column label="排班状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.isScheduled ? 'success' : 'info'">
                {{ row.isScheduled ? '已排班' : '未排班' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button
                :type="scope.row.isScheduled ? 'danger' : 'primary'"
                size="small"
                @click="changeScheduleStatus(scope.$index, scope.row, !scope.row.isScheduled)"
              >
                {{ scope.row.isScheduled ? '取消排班' : '添加排班' }}
              </el-button>
              <el-button
                type="info"
                size="small"
                @click="editDoctorSchedule(scope.row)"
              >
                详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 编辑医生排班的对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑排班信息"
      width="500px"
    >
      <div v-if="editingDoctor" class="doctor-detail">
        <div class="doctor-info">
          <el-avatar 
            :size="80" 
            :src="editingDoctor.avatar_url ? `http://38.38.251.86:8001${editingDoctor.avatar_url}` : ''" 
            v-if="editingDoctor.avatar_url">
          </el-avatar>
          <el-avatar :size="80" icon="el-icon-user" v-else></el-avatar>
          <div class="doctor-text">
            <h3>{{ editingDoctor.name }} {{ editingDoctor.title }}</h3>
            <p>{{ editingDoctor.introduction || '暂无专长信息' }}</p>
          </div>
        </div>
        
        <div class="schedule-info">
          <h4>{{ showDate.format('YYYY年MM月DD日') }} {{ weekdaysShort[showDate.day()] }}</h4>
          <el-switch
            v-model="editingDoctor.isScheduled"
            active-text="已排班"
            inactive-text="未排班"
            :active-value="true"
            :inactive-value="false"
          ></el-switch>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveDoctorSchedule">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
  
<style scoped>
.paiban-page-wrapper {
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

.top {
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 0px;
}

.date-nav {
  display: flex;
  flex-direction: row;
  background-color: rgba(255, 255, 255, 0.3);
  height: 70px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.date-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: justify;
  border: 1px solid rgba(146, 222, 236, 0.493);
  color: #333;
  cursor: pointer;
}

.date-item:hover {
  background-color: rgba(255, 255, 255, 0.5);
}

.is-active {
  background-color: rgba(255, 255, 255, 0.7);
  border: 1px solid #9c0c15;
}

.is-active p {
  color: #9c0c15;
  font-weight: 600;
}

.main {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  padding: 0 20px;
}

.keshi-section {
  width: 200px;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 15px;
  border-radius: 4px;
}

.schedule-section {
  flex: 1;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 15px;
  border-radius: 4px;
}

.section-title {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  color: #333;
  font-weight: bold;
}

.keshi-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.keshi-item {
  padding: 10px;
  margin-bottom: 5px;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.keshi-item:hover {
  background-color: rgba(255, 255, 255, 0.8);
}

.keshi-item.is-active {
  background-color: #9c0c15;
  color: white;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

/* 医生详情样式 */
.doctor-detail {
  padding: 10px;
}

.doctor-info {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.doctor-text {
  flex: 1;
}

.doctor-text h3 {
  margin-top: 0;
  margin-bottom: 10px;
}

.doctor-text p {
  margin: 0;
  color: #666;
}

.schedule-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid #eee;
}
</style>
