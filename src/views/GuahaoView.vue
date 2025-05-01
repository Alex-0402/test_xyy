<script setup>
import moment from 'moment'
import PageTitle from '../components/PageTitle.vue'
import DoctorCard from '../components/DoctorCard.vue'
import KeshiNav from '../components/KeshiNav.vue';
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useKeshiStore } from '../stores/keshi'
import { useDoctorStore } from "../stores/doctor";
import '@/assets/styles/common.css'; // 引入全局样式
import { getDepartments, getDepartmentSchedules } from '../utils/scheduleApi';
import { ElMessage, ElLoading } from 'element-plus';

const keshiStore = useKeshiStore()
const doctorStore = useDoctorStore()
const route = useRoute();

const weekdaysShort = '周日_周一_周二_周三_周四_周五_周六'.split('_')
const datesFromToday = [];
for (let i = 0; i < 14; i++) {
    datesFromToday.push(moment().add(i, 'days'));
}

// 将日期分成两周
const firstWeekDates = datesFromToday.slice(0, 7);
const secondWeekDates = datesFromToday.slice(7, 14);

const showDate = ref(datesFromToday[0])
const currentKeshiId = ref(null)
const departments = ref([])
const loading = ref(false)
const schedulesByDepartment = ref({}) // 存储每个科室的排班信息

// 从科室简介中提取坐诊时间
const officeHours = computed(() => {
  if (!currentKeshi.value || !currentKeshi.value.introduction) {
    return '08:00-17:00';
  }

  const description = currentKeshi.value.introduction;
  
  // 尝试匹配不同格式的时间表示
  const timePatterns = [
    // 匹配"坐诊时间：XX:XX-XX:XX"格式
    /坐诊时间[：:]\s*(\d{1,2}[:：]\d{1,2}\s*[-至~]\s*\d{1,2}[:：]\d{1,2})/i,
    // 匹配"门诊时间：XX:XX-XX:XX"格式
    /门诊时间[：:]\s*(\d{1,2}[:：]\d{1,2}\s*[-至~]\s*\d{1,2}[:：]\d{1,2})/i,
    // 匹配"工作时间：XX:XX-XX:XX"格式
    /工作时间[：:]\s*(\d{1,2}[:：]\d{1,2}\s*[-至~]\s*\d{1,2}[:：]\d{1,2})/i,
    // 匹配"接诊时间：XX:XX-XX:XX"格式
    /接诊时间[：:]\s*(\d{1,2}[:：]\d{1,2}\s*[-至~]\s*\d{1,2}[:：]\d{1,2})/i,
    // 匹配"上午XX:XX-XX:XX"和"下午XX:XX-XX:XX"格式
    /(上午\s*\d{1,2}[:：]\d{1,2}\s*[-至~]\s*\d{1,2}[:：]\d{1,2})/i,
    /(下午\s*\d{1,2}[:：]\d{1,2}\s*[-至~]\s*\d{1,2}[:：]\d{1,2})/i,
    // 匹配时间段 HH:MM-HH:MM
    /(\d{1,2}[:：]\d{1,2}\s*[-至~]\s*\d{1,2}[:：]\d{1,2})/i
  ];

  // 遍历所有模式，查找匹配
  for (const pattern of timePatterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // 如果科室有openHours字段且不为空，则返回该字段的值
  if (currentKeshi.value.opTime) {
    return currentKeshi.value.opTime;
  }

  // 未找到任何坐诊时间信息，返回默认值
  return '08:00-17:00';
});

// 处理科室信息，从描述中移除已经提取的坐诊时间
const processedDescription = computed(() => {
  if (!currentKeshi.value || !currentKeshi.value.introduction) {
    return '';
  }
  
  const description = currentKeshi.value.introduction;
  
  // 移除提取出的时间信息，避免重复显示
  const patterns = [
    /坐诊时间[：:]\s*\d{1,2}[:：]\d{1,2}\s*[-至~]\s*\d{1,2}[:：]\d{1,2}\s*/i,
    /门诊时间[：:]\s*\d{1,2}[:：]\d{1,2}\s*[-至~]\s*\d{1,2}[:：]\d{1,2}\s*/i,
    /工作时间[：:]\s*\d{1,2}[:：]\d{1,2}\s*[-至~]\s*\d{1,2}[:：]\d{1,2}\s*/i,
    /接诊时间[：:]\s*\d{1,2}[:：]\d{1,2}\s*[-至~]\s*\d{1,2}[:：]\d{1,2}\s*/i
  ];

  let processedDesc = description;
  for (const pattern of patterns) {
    processedDesc = processedDesc.replace(pattern, '');
  }

  return processedDesc.trim();
});

// 初始化数据
const initData = async () => {
    try {
        const loadingInstance = ElLoading.service({ fullscreen: true, text: '加载数据中...' });
        
        // 获取科室列表
        const deptData = await getDepartments();
        departments.value = deptData;
        
        // 更新科室列表到store中
        if (departments.value.length > 0) {
            keshiStore.keshiList = departments.value.map(dept => ({
                id: dept.id,
                name: dept.name,
                intro: dept.introduction || '',
                opTime: '8:00-17:00', // 默认时间，可以根据后端接口调整
                hotline: '', // 如果后端没有提供，可以留空或设置默认值
                doctors: dept.doctors || []
            }));
            
            if (!currentKeshiId.value && deptData.length > 0) {
                currentKeshiId.value = deptData[0].id;
                await loadDepartmentSchedules(currentKeshiId.value);
                
                // 更新当前显示日期为该科室有排班的第一天
                updateShowDateToFirstSchedule();
            }
        }
        
        loadingInstance.close();
    } catch (error) {
        ElMessage.error('加载数据失败，请稍后再试');
        console.error('初始化数据失败:', error);
    }
};

// 辅助函数：更新显示日期为有排班的第一天
const updateShowDateToFirstSchedule = () => {
    for (let i = 0; i < datesFromToday.length; i++) {
        const date = datesFromToday[i];
        if (hasScheduleForDate(date)) {
            showDate.value = date;
            break;
        }
    }
}

// 加载科室排班
const loadDepartmentSchedules = async (departmentId) => {
    if (!departmentId) return;
    
    try {
        loading.value = true;
        const schedules = await getDepartmentSchedules(departmentId);
        
        // 保存该科室的排班信息
        schedulesByDepartment.value[departmentId] = {};
        
        // 映射排班信息到日期
        schedules.forEach(schedule => {
            // 使用排班对象中的日期信息(如果有)，否则根据索引映射
            const scheduleDate = schedule.date ? 
                moment(schedule.date) : 
                moment().add(schedules.indexOf(schedule), 'days');
            const dateKey = scheduleDate.format('MM.DD');
            
            schedulesByDepartment.value[departmentId][dateKey] = schedule;
        });
        
        loading.value = false;
    } catch (error) {
        loading.value = false;
        ElMessage.error('加载科室排班失败');
        console.error('加载科室排班失败:', error);
    }
};

// 检查日期是否有排班
const hasScheduleForDate = (date) => {
    const dateKey = date.format('MM.DD');
    const departmentSchedules = schedulesByDepartment.value[currentKeshiId.value];
    
    if (departmentSchedules && departmentSchedules[dateKey]) {
        const schedule = departmentSchedules[dateKey];
        return schedule.is_scheduled && schedule.doctors && schedule.doctors.length > 0;
    }
    
    return false;
};

// 计算每个日期是否有排班
const dateHasSchedule = computed(() => {
    const result = {};
    datesFromToday.forEach(date => {
        result[date.format('MM.DD')] = hasScheduleForDate(date);
    });
    return result;
});

// 切换显示日期的函数，只允许切换到有排班的日期
function changeShowDate(date) {
    if (dateHasSchedule.value[date.format('MM.DD')]) {
        showDate.value = date;
    }
}

// 切换科室
async function changeKeshi(keshiId) {
    if (keshiId !== currentKeshiId.value) {
        currentKeshiId.value = keshiId;
        await loadDepartmentSchedules(keshiId);
        
        // 更新当前显示日期为该科室有排班的第一天
        updateShowDateToFirstSchedule();
    }
}

// 科室列表
const keshiList = computed(() => {
    return departments.value.map(dept => ({
        id: dept.id,
        name: dept.name,
        intro: dept.introduction || ''
    }));
});

// 获取当前科室
const currentKeshi = computed(() => {
    return departments.value.find(dept => dept.id === currentKeshiId.value) || {};
});

// 获取当前日期的医生列表
const doctorList = computed(() => {
    const dateKey = showDate.value.format('MM.DD');
    const departmentSchedules = schedulesByDepartment.value[currentKeshiId.value];
    
    if (departmentSchedules && departmentSchedules[dateKey]) {
        const schedule = departmentSchedules[dateKey];
        if (schedule.is_scheduled && schedule.doctors) {
            return schedule.doctors.map(doctor => ({
                id: doctor.id,
                name: doctor.name,
                title: doctor.title || '',
                goodat: doctor.introduction || '',
                pic: doctor.avatar_url ? `http://38.38.251.86:8001${doctor.avatar_url}` : '',
                web: '', // 如果后端没有提供，可以留空
                keshi: currentKeshiId.value
            }));
        }
    }
    return [];
});

// 监听路由参数变化
watch(() => route.query.keshi, async (newKeshiId) => {
    if (newKeshiId) {
        currentKeshiId.value = parseInt(newKeshiId);
        await loadDepartmentSchedules(currentKeshiId.value);
    }
});

onMounted(async () => {
    await initData();
    
    // 从路由参数获取科室ID
    if (route.query.keshi !== undefined) {
        currentKeshiId.value = parseInt(route.query.keshi);
        await loadDepartmentSchedules(currentKeshiId.value);
        
        // 更新当前显示日期为该科室有排班的第一天
        updateShowDateToFirstSchedule();
    }
});
</script>

<template>
    <div class="guahao-page-wrapper main-background">
        <page-title title="门诊排班" icon-name="icon-rili"></page-title>
        
        <!-- 修改为顶部一行显示星期几，下面两行显示日期数字 -->
        <div class="date-container">
            <!-- 顶部行 - 只显示周几 -->
            <div class="weekday-row">
                <div v-for="(date, index) in datesFromToday.slice(0, 7)" :key="'weekday-' + index" class="weekday-item">
                    {{ index === 0 ? '今日' : weekdaysShort[date.day()] }}
                </div>
            </div>
            
            <!-- 第一周日期 - 只显示日期数字 -->
            <div class="date-grid">
                <div v-for="(date, index) in firstWeekDates" :key="'date-week1-' + index" 
                     class="date-item"
                     :class="{ 
                       'is-active': showDate.format('YYYY-MM-DD') === date.format('YYYY-MM-DD'), 
                       'no-schedule': !dateHasSchedule[date.format('MM.DD')] 
                     }" 
                     @click="changeShowDate(date)">
                    <div class="date-number">{{ date.format('DD') }}</div>
                </div>
            </div>
            
            <!-- 第二周日期 - 只显示日期数字 -->
            <div class="date-grid">
                <div v-for="(date, index) in secondWeekDates" :key="'date-week2-' + index" 
                     class="date-item"
                     :class="{ 
                       'is-active': showDate.format('YYYY-MM-DD') === date.format('YYYY-MM-DD'), 
                       'no-schedule': !dateHasSchedule[date.format('MM.DD')] 
                     }" 
                     @click="changeShowDate(date)">
                    <div class="date-number">{{ date.format('DD') }}</div>
                </div>
            </div>
        </div>

        <div class="main">
            <!-- 仅当科室数量大于1时显示科室导航栏 -->
            <div class="keshi-nav-container" v-if="keshiList.length > 1">
                <ul class="keshi-list">
                    <li v-for="keshi in keshiList" :key="keshi.id"
                        :class="{ 'active': currentKeshiId === keshi.id }"
                        @click="changeKeshi(keshi.id)">
                        {{ keshi.name }}
                    </li>
                </ul>
            </div>
            
            <div class="keshi-detail">
                <h3 class="sec-title" v-if="currentKeshi">
                    {{ currentKeshi.name }}
                    {{ showDate.format('MM月DD日') }}
                    出诊医生
                </h3>
                <el-scrollbar max-height="calc(100% - 32px)" class="custom-scrollbar">
                    <div class="keshi-info-section">
                        <h3 class="info-title">坐诊时间 <text class="bold10">{{ officeHours }}</text></h3>
                        <h3 class="info-title" v-if="currentKeshi.hotline">
                            科室电话 <text class="bold10">{{ currentKeshi.hotline }}</text>
                        </h3>
                        <!-- 添加科室简介显示 -->
                        <div v-if="processedDescription" class="keshi-description">
                            <h3 class="info-title">科室简介</h3>
                            <p>{{ processedDescription }}</p>
                        </div>
                    </div>
                    <el-divider class="custom-divider" />
                    <div v-if="loading" class="loading-indicator">加载中...</div>
                    <div v-else-if="doctorList.length === 0" class="no-doctor-message">当前日期没有医生出诊</div>
                    <div v-else class="doctor-list">
                        <div v-for="(doctor, index) in doctorList" :key="doctor.id" class="doctor-item">
                            <doctor-card :name="doctor.name" :title="doctor.title" :goodat="doctor.goodat" :pic="doctor.pic" :web="doctor.web"></doctor-card>
                        </div>
                    </div>
                </el-scrollbar>
            </div>
        </div>
    </div>
</template>
  
<style scoped>
.guahao-page-wrapper {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
}

/* 更新日期导航样式 */
.date-container {
    padding: 8px 10px;
    background-color: rgba(255, 255, 255, 0.7);
    margin: 8px 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

/* 顶部星期几行样式 */
.weekday-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
    width: 100%;
    padding-bottom: 2px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.weekday-item {
    text-align: center;
    font-size: 16px;
    font-weight: 500;
    color: #333;
    padding: 4px 0;
}

.date-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
    width: 100%;
}

.date-item {
    display: flex;
    justify-content: center;
    padding: 8px 4px;
    cursor: pointer;
    position: relative;
    transition: all 0.3s ease;
    text-align: center;
    box-sizing: border-box;
    border: 2px solid transparent;
    border-radius: 4px; /* 给所有日期添加相同圆角，防止选中时形状变化 */
}

.date-number {
    font-size: 24px;
    font-weight: 500;
    color: #333;
}

.date-item.no-schedule {
    opacity: 0.5;
    cursor: not-allowed;
}

.date-item.no-schedule .date-number {
    color: #999;
}

/* 修改为使用红色背景填充并将日期文字变为白色 */
.date-item.is-active {
    border: none;
    background-color: #9c0c15;
}

.date-item.is-active .date-number {
    font-weight: bold;
    color: white;
}

/* 在小屏幕上调整网格布局 */
@media screen and (max-width: 768px) {
    .weekday-item {
        font-size: 14px;
    }
    
    .date-grid {
        gap: 4px;
    }
    
    .date-item {
        padding: 6px 2px;
        border-width: 1.5px;
    }
    
    .date-number {
        font-size: 20px;
    }
    
    .date-item.is-active {
        border-width: 1.5px;
    }
}

@media screen and (max-width: 480px) {
    .date-container {
        padding: 6px 5px;
        margin: 5px 0;
        gap: 4px;
    }
    
    .weekday-item {
        font-size: 12px;
        padding: 2px 0;
    }
    
    .date-number {
        font-size: 18px;
    }
    
    .date-item {
        padding: 4px 2px;
        border-width: 1px;
    }
    
    .date-item.is-active {
        border-width: 1px;
    }
}

.main {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.keshi-detail {
    flex: 1;
    background-color: rgba(255, 255, 255, 0.7);
    padding: 10px 15px;
    color: #333;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.sec-title {
    padding-bottom: 8px;
    font-weight: 700;
    font-size: 18px;
    margin: 0 0 8px 0;
}

.info-title {
    font-size: 16px;
    margin: 8px 0;
}

.bold10 {
    font-weight: 700;
    padding-left: 8px;
}

.keshi-nav-container {
    width: 120px;
    padding: 10px 5px;
    background-color: rgba(255, 255, 255, 0.7);
    margin-right: 10px;
    overflow-y: auto;
}

.keshi-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.keshi-list li {
    padding: 10px 8px;
    margin-bottom: 5px;
    cursor: pointer;
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.5);
    transition: all 0.3s;
    font-size: 14px;
    text-align: center;
    word-break: break-all;
}

.keshi-list li:hover {
    background-color: rgba(255, 255, 255, 0.8);
}

.keshi-list li.active {
    background-color: #9c0c15;
    color: white;
    font-weight: bold;
}

.keshi-description {
    margin: 12px 0;
}

.keshi-description p {
    line-height: 1.5;
    color: #555;
    margin-top: 6px;
    font-size: 14px;
}

.keshi-info-section {
    padding: 0 5px;
}

.custom-divider {
    margin: 12px 0;
}

.loading-indicator, .no-doctor-message {
    text-align: center;
    padding: 20px;
    color: #666;
    font-size: 15px;
}

.doctor-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.custom-scrollbar {
    overflow-x: hidden;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
    .date-nav {
        height: 50px;
    }
    
    .date-day {
        font-size: 0.8rem;
    }
    
    .date-weekday {
        font-size: 0.7rem;
    }
    
    .keshi-nav-container {
        width: 90px;
        padding: 8px 4px;
    }
    
    .keshi-list li {
        padding: 8px 4px;
        font-size: 12px;
    }
    
    .sec-title {
        font-size: 16px;
    }
    
    .info-title {
        font-size: 14px;
    }
    
    .keshi-description p {
        font-size: 13px;
    }
    
    .keshi-detail {
        padding: 8px 10px;
    }
    
    /* 医生资料卡适配 */
    .doctor-list {
        gap: 10px; /* 减小间距 */
        padding: 0 2px; /* 减小内边距 */
    }
    
    :deep(.doctor-card) {
        padding: 10px 8px; /* 减小内边距 */
        border-radius: 5px; /* 减小圆角 */
    }
    
    :deep(.doctor-avatar) {
        width: 60px; /* 减小头像尺寸 */
        height: 60px; /* 减小头像尺寸 */
        margin-right: 10px; /* 减小右边距 */
    }
    
    :deep(.doctor-info h3) {
        font-size: 15px; /* 减小字体 */
        margin-bottom: 4px; /* 减小下边距 */
    }
    
    :deep(.doctor-info p) {
        font-size: 12px; /* 减小字体 */
        margin-bottom: 3px; /* 减小下边距 */
    }
    
    :deep(.doctor-goodat) {
        font-size: 12px; /* 减小字体 */
        line-height: 1.35; /* 调整行高 */
        max-height: 70px; /* 减小最大高度 */
    }
}

/* 小屏幕手机适配 */
@media screen and (max-width: 480px) {
    .keshi-nav-container {
        width: 75px;
        margin-right: 5px;
    }
    
    .keshi-list li {
        padding: 7px 3px;
        font-size: 11px;
        margin-bottom: 4px;
    }
    
    .date-nav {
        height: 42px;
    }
    
    .date-day {
        font-size: 0.7rem;
    }
    
    .date-weekday {
        font-size: 0.6rem;
    }
    
    .sec-title {
        font-size: 15px;
        margin-bottom: 6px;
    }
    
    .keshi-detail {
        padding: 6px 8px;
    }
    
    .bold10 {
        padding-left: 5px;
    }
    
    .info-title {
        font-size: 13px;
        margin: 5px 0;
    }
    
    .keshi-description p {
        font-size: 12px;
        line-height: 1.4;
    }
    
    .custom-divider {
        margin: 8px 0;
    }
    
    .loading-indicator, .no-doctor-message {
        padding: 15px;
        font-size: 13px;
    }
    
    /* 小屏幕医生资料卡适配 */
    .doctor-list {
        gap: 8px; /* 进一步减小间距 */
    }
    
    .doctor-item {
        margin-bottom: 1px; /* 调整 */
    }
    
    :deep(.doctor-card) {
        padding: 6px 5px; /* 进一步减小内边距 */
        border-radius: 4px; /* 进一步减小圆角 */
    }
    
    :deep(.doctor-avatar) {
        width: 45px; /* 进一步减小头像尺寸 */
        height: 45px; /* 进一步减小头像尺寸 */
        margin-right: 6px; /* 进一步减小右边距 */
    }
    
    :deep(.doctor-info h3) {
        font-size: 13px; /* 进一步减小字体 */
        margin-bottom: 3px; /* 进一步减小下边距 */
    }
    
    :deep(.doctor-info p) {
        font-size: 11px; /* 进一步减小字体 */
        margin-bottom: 2px; /* 进一步减小下边距 */
    }
    
    :deep(.doctor-goodat) {
        font-size: 10px; /* 进一步减小字体 */
        line-height: 1.25; /* 调整行高 */
        max-height: 55px; /* 进一步减小最大高度 */
    }
    
    :deep(.operation-buttons) {
        margin-top: 4px; /* 减小上边距 */
    }
    
    :deep(.operation-buttons button) {
        font-size: 11px; /* 减小字体 */
        padding: 3px 6px; /* 减小内边距 */
    }
}

/* 超小屏幕手机适配 (如iPhone SE等) */
@media screen and (max-width: 375px) {
    .keshi-nav-container {
        width: 65px;
        margin-right: 3px;
    }
    
    .keshi-list li {
        padding: 6px 2px;
        font-size: 10px;
    }
    
    .date-nav {
        height: 38px;
        flex-wrap: wrap;
    }
    
    .date-day {
        font-size: 0.65rem;
    }
    
    .date-weekday {
        font-size: 0.55rem;
    }
    
    .sec-title {
        font-size: 14px;
    }
    
    .keshi-detail {
        padding: 5px 6px;
    }
    
    :deep(.doctor-avatar) {
        width: 40px; /* 再次减小头像尺寸 */
        height: 40px; /* 再次减小头像尺寸 */
        margin-right: 5px; /* 再次减小右边距 */
    }
    
    :deep(.doctor-info h3) {
        font-size: 12px; /* 再次减小字体 */
    }
    
    :deep(.doctor-info p) {
        font-size: 10px; /* 再次减小字体 */
    }
    
    :deep(.doctor-goodat) {
        font-size: 9px; /* 再次减小字体 */
        max-height: 45px; /* 再次减小最大高度 */
        line-height: 1.2; /* 调整行高 */
    }

    .date-item {
        margin: 1px 0;
    }
}
</style>
