<script setup>
import moment from 'moment'
import PageTitle from '../components/PageTitle.vue'
import KeshiNav from '../components/KeshiNav.vue';
import UserDropdown from '../components/UserDropdown.vue';
import { computed, ref, reactive, onMounted } from 'vue';
import { useKeshiStore } from '../stores/keshi'
import { useDoctorStore } from "../stores/doctor";
import { ElMessage, ElMessageBox } from 'element-plus';
import '@/assets/styles/common.css';

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

// 定义选中的科室
const keshiList = computed(() => {
  const list = keshiStore.keshiListByDay[showDate.value.day()];
  return list;
});

const activeKeshi = ref(null);

// 监听showDate变化时更新activeKeshi
const updateActiveKeshi = () => {
  const list = keshiStore.keshiListByDay[showDate.value.day()];
  if (list.length > 0) {
    if (!activeKeshi.value || list.findIndex(k => k.id === activeKeshi.value.id) === -1) {
      activeKeshi.value = list[0];
    }
  } else {
    activeKeshi.value = null;
  }
  loadDoctorData();
};

// 切换日期
function changeShowDate(date) {
  showDate.value = date;
  updateActiveKeshi();
}

// 切换科室
function changeKeshi(keshi) {
  activeKeshi.value = keshi;
  loadDoctorData();
}

// 加载医生数据
const loadDoctorData = () => {
  if (!activeKeshi.value) return;
  
  loading.value = true;
  
  // 获取当前科室的所有医生
  const allDoctors = doctorStore.doctorList.filter(doctor => doctor.keshi === activeKeshi.value.id);
  
  // 检查医生是否在选定日期出诊
  const currentDate = showDate.value.format('MM.DD');
  tableData.value = allDoctors.map(doctor => {
    const isScheduled = doctor.workat.includes(currentDate);
    return {
      ...doctor,
      isScheduled,
      originalStatus: isScheduled // 保存原始状态用于检测更改
    };
  });
  
  loading.value = false;
};

// 编辑医生排班
const editDoctorSchedule = (doctor) => {
  editingDoctor.value = { ...doctor };
  dialogVisible.value = true;
};

// 保存医生排班更改
const saveDoctorSchedule = () => {
  const currentDate = showDate.value.format('MM.DD');
  const doctorIndex = doctorStore.doctorList.findIndex(d => d.id === editingDoctor.value.id);
  
  if (doctorIndex !== -1) {
    const doctor = doctorStore.doctorList[doctorIndex];
    
    // 如果要安排排班但原来没有
    if (editingDoctor.value.isScheduled && !doctor.workat.includes(currentDate)) {
      doctor.workat.push(currentDate);
      ElMessage.success(`已将${doctor.name}安排在${currentDate}出诊`);
    } 
    // 如果要取消排班但原来有
    else if (!editingDoctor.value.isScheduled && doctor.workat.includes(currentDate)) {
      const dateIndex = doctor.workat.indexOf(currentDate);
      if (dateIndex !== -1) {
        doctor.workat.splice(dateIndex, 1);
        ElMessage.success(`已取消${doctor.name}在${currentDate}的出诊`);
      }
    }
    
    // 刷新表格数据
    loadDoctorData();
  }
  
  dialogVisible.value = false;
};

// 批量更改排班状态
const changeScheduleStatus = (index, row, status) => {
  const currentDate = showDate.value.format('MM.DD');
  const doctorIndex = doctorStore.doctorList.findIndex(d => d.id === row.id);
  
  if (doctorIndex !== -1) {
    const doctor = doctorStore.doctorList[doctorIndex];
    const hasDate = doctor.workat.includes(currentDate);
    
    if (status && !hasDate) {
      // 添加排班
      doctor.workat.push(currentDate);
      row.isScheduled = true;
      ElMessage.success(`已将${doctor.name}安排在${currentDate}出诊`);
    } else if (!status && hasDate) {
      // 取消排班
      const dateIndex = doctor.workat.indexOf(currentDate);
      if (dateIndex !== -1) {
        doctor.workat.splice(dateIndex, 1);
        row.isScheduled = false;
        ElMessage.success(`已取消${doctor.name}在${currentDate}的出诊`);
      }
    }
  }
};

// 保存所有更改
const saveAllChanges = () => {
  ElMessageBox.confirm('确定要保存所有排班更改吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    ElMessage.success('所有排班更改已保存');
    // 在实际应用中，这里应该调用API将更改保存到后端
  }).catch(() => {
    // 取消操作
  });
};

onMounted(() => {
  updateActiveKeshi();
});
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
          :class="{ 'is-active': showDate.date() == date.date() }" @click="changeShowDate(date)">
          <p>{{ date.format('MM.DD') }}</p>
          <p>{{ weekdaysShort[date.day()] }}</p>
        </li>
      </ul>
      <ul class="date-nav">
        <li v-for="(date, index) in secondWeekDates" :key="'week2-' + index" class="date-item"
          :class="{ 'is-active': showDate.date() == date.date() }" @click="changeShowDate(date)">
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
          <el-button type="primary" @click="saveAllChanges" :disabled="!activeKeshi">保存所有更改</el-button>
        </div>
        
        <el-table
          v-loading="loading"
          :data="tableData"
          style="width: 100%"
          :empty-text="activeKeshi ? '该科室暂无医生' : '请先选择科室'"
        >
          <el-table-column label="头像" width="80">
            <template #default="{ row }">
              <el-avatar :size="50" :src="row.pic" v-if="row.pic"></el-avatar>
              <el-avatar :size="50" icon="el-icon-user" v-else></el-avatar>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="姓名" width="100"></el-table-column>
          <el-table-column prop="title" label="职称" width="150"></el-table-column>
          <el-table-column prop="goodat" label="专长" show-overflow-tooltip></el-table-column>
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
          <el-avatar :size="80" :src="editingDoctor.pic" v-if="editingDoctor.pic"></el-avatar>
          <el-avatar :size="80" icon="el-icon-user" v-else></el-avatar>
          <div class="doctor-text">
            <h3>{{ editingDoctor.name }} {{ editingDoctor.title }}</h3>
            <p>{{ editingDoctor.goodat || '暂无专长信息' }}</p>
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
