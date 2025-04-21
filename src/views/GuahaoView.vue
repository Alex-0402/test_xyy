<script setup>
import moment from 'moment'
import PageTitle from '../components/PageTitle.vue'
import DoctorCard from '../components/DoctorCard.vue'
import KeshiNav from '../components/KeshiNav.vue';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useKeshiStore } from '../stores/keshi'
import { useDoctorStore } from "../stores/doctor";
import '@/assets/styles/common.css'; // 引入全局样式

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

if (route.query.keshi !== undefined) {
    for (let i = 0; i < datesFromToday.length; i++) {
        let date = datesFromToday[i]
        let list = keshiStore.keshiListByDay[date.day()]
        let index = list.findIndex(keshi => keshi.id == route.query.keshi)
        if (index > -1) {
            showDate.value = date
            keshiStore.activeKeshi = list[index]
            break;
        }
    }
}

const keshiList = computed(() => {
    const list = keshiStore.keshiListByDay[showDate.value.day()]
    if (list.findIndex(keshi => keshi.id == keshiStore.activeKeshi.id) == -1) {
        keshiStore.activeKeshi = list[0]
    }
    return list
})

const doctorList = computed(() => {
    return doctorStore.doctorList.filter(doctor => {
        return doctor.keshi == keshiStore.activeKeshi.id &&
            doctor.workat.findIndex(date => date == showDate.value.format('MM.DD')) > -1
    });
})

function changeShowDate(date) {
    showDate.value = date
}
</script>


<template>
    <div class="guahao-page-wrapper main-background">
        <page-title title="门诊排班" icon-name="icon-rili"></page-title>
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
            <keshi-nav :keshi-list="keshiList"></keshi-nav>
            <div class="keshi-detail">
                <h3 class="sec-title">
                    {{ keshiStore.activeKeshi.name }}
                    {{ showDate.format('MM月DD日') }}
                    出诊医生
                </h3>
                <el-scrollbar max-height="calc(100% - 32px)">
                    <h3>坐诊时间 <text class="bold10">{{ keshiStore.activeKeshi.opTime }}</text></h3>
                    <h3 v-if="keshiStore.activeKeshi.hotline !== undefined">
                        科室电话 <text class="bold10">{{ keshiStore.activeKeshi.hotline }}</text>
                    </h3>
                    <el-divider />
                    <div v-for="(doctor, index) in doctorList" :key="index">
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
}

.is-active p {
    color: #9c0c15;
    font-weight: 600;
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
</style>
