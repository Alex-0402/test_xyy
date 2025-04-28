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

// 根据cycle_day获取日期
const getDateByCycleDay = (cycleDay) => {
    return moment().add(cycleDay - 1, 'days');
};

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
            }
        }
        
        loadingInstance.close();
    } catch (error) {
        ElMessage.error('加载数据失败，请稍后再试');
        console.error('初始化数据失败:', error);
    }
};

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
            const cycleDay = schedule.cycle_day;
            const scheduleDate = getDateByCycleDay(cycleDay);
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
        for (let i = 0; i < datesFromToday.length; i++) {
            const date = datesFromToday[i];
            if (hasScheduleForDate(date)) {
                showDate.value = date;
                break;
            }
        }
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
        
        // 寻找该科室有排班的第一天
        for (let i = 0; i < datesFromToday.length; i++) {
            const date = datesFromToday[i];
            if (hasScheduleForDate(date)) {
                showDate.value = date;
                break;
            }
        }
    }
});
</script>

<template>
    <div class="guahao-page-wrapper main-background">
        <page-title title="门诊排班" icon-name="icon-rili"></page-title>
        <div class="top">
            <!-- 两周日期分成上下两排显示 -->
            <ul class="date-nav">
                <li v-for="(date, index) in firstWeekDates" :key="'week1-' + index" class="date-item"
                    :class="{ 
                      'is-active': showDate.format('YYYY-MM-DD') === date.format('YYYY-MM-DD'), 
                      'no-schedule': !dateHasSchedule[date.format('MM.DD')] 
                    }" 
                    @click="changeShowDate(date)">
                    <p>{{ date.format('MM.DD') }}</p>
                    <p>{{ weekdaysShort[date.day()] }}</p>
                </li>
            </ul>
            <ul class="date-nav">
                <li v-for="(date, index) in secondWeekDates" :key="'week2-' + index" class="date-item"
                    :class="{ 
                      'is-active': showDate.format('YYYY-MM-DD') === date.format('YYYY-MM-DD'), 
                      'no-schedule': !dateHasSchedule[date.format('MM.DD')] 
                    }" 
                    @click="changeShowDate(date)">
                    <p>{{ date.format('MM.DD') }}</p>
                    <p>{{ weekdaysShort[date.day()] }}</p>
                </li>
            </ul>
        </div>

        <div class="main">
            <!-- 使用科室导航组件，并添加科室切换事件 -->
            <div class="keshi-nav-container">
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
                <el-scrollbar max-height="calc(100% - 32px)">
                    <h3>坐诊时间 <text class="bold10">8:00-17:00</text></h3>
                    <h3 v-if="currentKeshi.hotline">
                        科室电话 <text class="bold10">{{ currentKeshi.hotline }}</text>
                    </h3>
                    <el-divider />
                    <div v-if="loading">加载中...</div>
                    <div v-else-if="doctorList.length === 0">当前日期没有医生出诊</div>
                    <div v-else v-for="(doctor, index) in doctorList" :key="doctor.id">
                        <doctor-card :name="doctor.name" :title="doctor.title" :goodat="doctor.goodat" :pic="doctor.pic" :web="doctor.web"></doctor-card>
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
}

.top {
    padding: 10px 0;
    display: flex;
    flex-direction: column; /* 上下排列两排日期 */
    gap: 0px; /* 两排之间的间距 */
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

.is-active p {
    color: #9c0c15;
    font-weight: 600;
}

.no-schedule {
    background-color: rgba(200, 200, 200, 0.5);
    color: #999;
    cursor: not-allowed;
}

.no-schedule p {
    color: #999;
}

.main {
    height: calc(100% - 140px);
    display: flex;
}

.keshi-detail {
    flex: 1;
    background-color: rgba(255, 255, 255, 0.7);
    padding: 10px 20px;
    color: #333;
}

.bold10 {
    font-weight: 700;
    padding-left: 10px;
}

.sec-title {
    padding-bottom: 10px;
    font-weight: 700;
    font-size: 20px;
}

.keshi-nav-container {
    width: 200px;
    padding: 10px;
    background-color: rgba(255, 255, 255, 0.7);
    margin-right: 20px;
}

.keshi-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.keshi-list li {
    padding: 10px;
    margin-bottom: 5px;
    cursor: pointer;
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.5);
    transition: all 0.3s;
}

.keshi-list li:hover {
    background-color: rgba(255, 255, 255, 0.8);
}

.keshi-list li.active {
    background-color: #9c0c15;
    color: white;
    font-weight: bold;
}
</style>
