<script setup>
import moment from 'moment';
import PageTitle from '../../components/PageTitle.vue';
import UserDropdown from '../../components/UserDropdown.vue';
import { computed, ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';
import '@/assets/styles/common.css';
import { 
  getDepartments, 
  getDepartmentSchedules, 
  updateSchedule, 
  getDepartmentDoctors
} from '../../utils/scheduleApi';

// 获取当前月和下个月的日期
const weekdaysShort = '周日_周一_周二_周三_周四_周五_周六'.split('_');

// 修改为获取本月和下个月的全部日期
const currentMonth = moment().startOf('month');
const nextMonth = moment().add(1, 'month').startOf('month');
const currentMonthDays = currentMonth.daysInMonth();
const nextMonthDays = nextMonth.daysInMonth();

// 生成两个月的日期
const allDates = [];
// 本月日期
for (let i = 0; i < currentMonthDays; i++) {
  allDates.push(moment().startOf('month').add(i, 'days'));
}
// 下个月日期
for (let i = 0; i < nextMonthDays; i++) {
  allDates.push(moment().add(1, 'month').startOf('month').add(i, 'days'));
}

// 按月份和周分组日期
const datesByMonth = {};
const datesByWeek = {};

allDates.forEach(date => {
  // 按月份分组
  const monthKey = date.format('YYYY-MM');
  if (!datesByMonth[monthKey]) {
    datesByMonth[monthKey] = [];
    // 为每个月初始化周分组
    datesByWeek[monthKey] = [];
  }
  datesByMonth[monthKey].push(date);
});

// 将每个月的日期按每7天分成一周
Object.keys(datesByMonth).forEach(monthKey => {
  const monthDates = datesByMonth[monthKey];
  const weeks = [];
  
  for (let i = 0; i < monthDates.length; i += 7) {
    weeks.push(monthDates.slice(i, i + 7));
  }
  
  datesByWeek[monthKey] = weeks;
});

// 取得月份列表
const monthKeys = Object.keys(datesByMonth);
const monthNames = monthKeys.map(key => {
  const [year, month] = key.split('-');
  return `${year}年${month}月`;
});

const showDate = ref(allDates[0]);
const activeMonthIndex = ref(0); // 当前显示的月份索引
const tableData = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const editingDoctor = ref(null);
const departments = ref([]);
const activeKeshi = ref(null);
const scheduleMap = ref({});  // 用于存储科室两周的排班信息

// 添加更新触发器，用于强制重新计算 dateHasSchedule
const scheduleUpdateTrigger = ref(0);

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
    
    // 将排班数据按日期映射到对应的键值
    schedules.forEach(schedule => {
      // 使用日期字符串作为键
      const dateObj = new Date(schedule.date);
      const dateKey = moment(dateObj).format('MM.DD');
      
      scheduleMap.value[dateKey] = {
        ...schedule,
        date: schedule.date // 保持原始日期格式
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

// 切换月份显示
function changeMonth(monthIndex) {
  activeMonthIndex.value = monthIndex;
  // 选中该月第一天
  showDate.value = datesByMonth[monthKeys[monthIndex]][0];
  loadDoctorData();
}

// 切换日期
function changeShowDate(date) {
  showDate.value = date;
  loadDoctorData();
}

// 切换科室
async function changeKeshi(keshi) {
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
    
    if (!currentSchedule) {
      // 如果没有当前日期的排班数据
      ElMessage.warning('无法获取当前日期排班数据，请刷新页面重试');
      tableData.value = [];
      loading.value = false;
      return;
    }
    
    // 检查医生是否在选定日期出诊
    // 注意：这里假设currentSchedule.doctors是医生信息的数组，如果只是id数组，需要调整逻辑
    tableData.value = departmentDoctors.map(doctor => {
      // 根据医生ID判断是否已排班
      const isScheduled = currentSchedule.doctors.some(d => {
        return (typeof d === 'object' ? d.id : d) === doctor.id;
      });
      
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

// 保存医生排班更改 - 更新为立即保存
const saveDoctorSchedule = async () => {
  const formattedDate = showDate.value.format('MM.DD');
  
  try {
    const loadingInstance = ElLoading.service({ fullscreen: true, text: '保存中...' });
    
    // 获取当前日期的排班
    const currentSchedule = scheduleMap.value[formattedDate];
    
    if (!currentSchedule) {
      ElMessage.error('无法获取当前日期排班数据');
      loadingInstance.close();
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
      is_scheduled: currentSchedule.doctors.length > 0, // 如果有医生排班，则设置为true
      doctors: currentSchedule.doctors.map(d => d.id)
    });
    
    // 更新is_scheduled状态
    currentSchedule.is_scheduled = currentSchedule.doctors.length > 0;
    
    // 增加触发器值，强制重新计算 dateHasSchedule
    scheduleUpdateTrigger.value++;
    
    ElMessage.success(`已${editingDoctor.value.isScheduled ? '添加' : '取消'}${editingDoctor.value.name}在${formattedDate}的出诊`);
    
    // 刷新表格数据
    await loadDoctorData();
    
    loadingInstance.close();
  } catch (error) {
    ElMessage.error('保存排班失败');
    console.error('保存排班失败:', error);
  }
  
  dialogVisible.value = false;
};

// 修改批量更改排班状态的函数
const changeScheduleStatus = async (index, row, status) => {
  const formattedDate = showDate.value.format('MM.DD');
  
  try {
    // 获取当前日期的排班
    const currentSchedule = scheduleMap.value[formattedDate];
    
    if (!currentSchedule) {
      ElMessage.error('无法获取当前日期排班数据');
      return;
    }
    
    const loadingInstance = ElLoading.service({ fullscreen: true, text: '保存中...' });
    
    // 更新本地数据
    row.isScheduled = status;
    
    // 在本地更新医生列表（只保存ID）
    let doctorIds;
    if (status) {
      // 获取当前所有医生ID
      doctorIds = currentSchedule.doctors.map(d => typeof d === 'object' ? d.id : d);
      // 添加当前医生ID（如果不存在）
      if (!doctorIds.includes(row.id)) {
        doctorIds.push(row.id);
      }
    } else {
      // 从排班中移除该医生ID
      doctorIds = currentSchedule.doctors
        .map(d => typeof d === 'object' ? d.id : d)
        .filter(id => id !== row.id);
    }
    
    // 立即保存到后端
    try {
      await updateSchedule(currentSchedule.id, {
        is_scheduled: doctorIds.length > 0, // 如果有医生排班，则设置为true
        doctors: doctorIds
      });
      
      ElMessage.success(`已${status ? '添加' : '取消'}${row.name}在${formattedDate}的出诊`);
      
      // 更新本地缓存的医生列表
      currentSchedule.doctors = doctorIds;
      
      // 更新is_scheduled状态
      currentSchedule.is_scheduled = doctorIds.length > 0;
      
      // 增加触发器值，强制重新计算 dateHasSchedule
      scheduleUpdateTrigger.value++;
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
        // 恢复原始状态
        row.isScheduled = !status;
        // 重新加载数据
        loadDoctorData();
      }
    }
    
    loadingInstance.close();
  } catch (error) {
    ElMessage.error('更改排班状态失败');
    console.error('更改排班状态失败:', error);
    loadDoctorData(); // 重新加载以恢复状态
  }
};

// 可以保留saveAllChanges但不再使用，以备将来需要批量保存功能
// const saveAllChanges = async () => {
//   try {
//     const loadingInstance = ElLoading.service({ fullscreen: true, text: '保存中...' });
    
//     // 获取当前日期的排班
//     const formattedDate = showDate.value.format('MM.DD');
//     const currentSchedule = scheduleMap.value[formattedDate];
    
//     if (!currentSchedule) {
//       ElMessage.error('无法获取当前日期排班数据');
//       loadingInstance.close();
//       return;
//     }
    
//     // 更新排班到后端
//     try {
//       await updateSchedule(currentSchedule.id, {
//         is_scheduled: currentSchedule.doctors.length > 0, // 如果有医生排班，则设置为true
//         doctors: currentSchedule.doctors.map(d => d.id)
//       });
      
//       modified.value = false;
//       ElMessage.success('排班更改已保存');
//     } catch (error) {
//       if (error.message === '身份验证失败，请重新登录') {
//         ElMessageBox.alert('登录已过期，请重新登录', '提示', {
//           confirmButtonText: '确定',
//           callback: () => {
//             // 重定向到登录页面
//             window.location.href = '/login';
//           }
//         });
//       } else {
//         ElMessage.error(`保存排班失败: ${error.message}`);
//       }
//     }
    
//     loadingInstance.close();
//   } catch (error) {
//     ElMessage.error('保存排班失败');
//     console.error('保存排班失败:', error);
//   }
// };

// 修复BASE_URL为正确的API端口
const BASE_URL = 'http://38.38.251.86:8000/api';

// 添加检查日期是否有排班的函数
const hasScheduleForDate = (date) => {
  const dateKey = date.format('MM.DD');
  const schedule = scheduleMap.value[dateKey];
  
  if (schedule) {
    // 检查排班是否有医生并且is_scheduled为true
    return schedule.is_scheduled && schedule.doctors && schedule.doctors.length > 0;
  }
  return false;
};

// 计算每个日期是否有排班
const dateHasSchedule = computed(() => {
  // 添加依赖以便在排班更新时重新计算
  const trigger = scheduleUpdateTrigger.value;
  
  const result = {};
  allDates.forEach(date => {
    result[date.format('MM.DD')] = hasScheduleForDate(date);
  });
  return result;
});
</script>

<template>
  <div class="paiban-page-wrapper main-background">
    <div class="header-container">
      <user-dropdown></user-dropdown>
    </div>
    
    <page-title title="排班管理" icon-name="icon-rili"></page-title>
    
    <div class="top">
      <!-- 月份选择器 -->
      <div class="month-selector">
        <div 
          v-for="(name, index) in monthNames" 
          :key="index" 
          class="month-item"
          :class="{ 'is-active': activeMonthIndex === index }"
          @click="changeMonth(index)"
        >
          {{ name }}
        </div>
      </div>
      
      <!-- 当前选中月份的日期显示，按周显示，每周一行 -->
      <div class="dates-container" v-if="datesByMonth[monthKeys[activeMonthIndex]]">
        <ul class="date-nav" v-for="(weekDates, weekIndex) in datesByWeek[monthKeys[activeMonthIndex]]" :key="weekIndex">
          <li 
            v-for="(date, dateIndex) in weekDates" 
            :key="dateIndex" 
            class="date-item"
            :class="{ 
              'is-active': showDate.format('YYYY-MM-DD') === date.format('YYYY-MM-DD'),
              'has-schedule': dateHasSchedule[date.format('MM.DD')]
            }"
            @click="changeShowDate(date)"
          >
            <p>{{ date.format('MM.DD') }}</p>
            <p>{{ weekdaysShort[date.day()] }}</p>
          </li>
        </ul>
      </div>
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
          <el-table-column label="操作" width="140">
            <template #default="scope">
              <el-button
                :type="scope.row.isScheduled ? 'danger' : 'primary'"
                size="small"
                @click="changeScheduleStatus(scope.$index, scope.row, !scope.row.isScheduled)"
              >
                {{ scope.row.isScheduled ? '取消排班' : '添加排班' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 保留编辑医生排班的对话框，以便将来可能需要恢复此功能 -->
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

.month-selector {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.5);
}

.month-item {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.7);
  transition: all 0.3s;
}

.month-item:hover {
  background-color: rgba(255, 255, 255, 0.9);
}

.month-item.is-active {
  background-color: #9c0c15;
  color: white;
}

.dates-container {
  overflow-x: auto;
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
  width: 14.2857%; /* 每个日期项占据一周的1/7 */
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

/* 有排班日期的样式 - 将红色改为绿色 */
.has-schedule {
  background-color: rgba(40, 167, 69, 0.1); /* 改为绿色背景 */
  border-bottom: 2px solid #28a745; /* 改为绿色边框 */
}

.is-active {
  background-color: rgba(255, 255, 255, 0.7);
  border: 1px solid #9c0c15;
}

.is-active.has-schedule {
  background-color: rgba(40, 167, 69, 0.2); /* 改为更深的绿色背景 */
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
