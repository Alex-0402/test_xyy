<script setup>
import { computed } from 'vue';
import PageTitle from '../components/PageTitle.vue'
import DoctorCard from '../components/DoctorCard.vue'
import KeshiNav from '../components/KeshiNav.vue';
import { useRouter } from 'vue-router';
import { useKeshiStore } from '../stores/keshi'
import { useDoctorStore } from '../stores/doctor'
import { ArrowRight } from '@element-plus/icons-vue'
import '@/assets/styles/common.css'; // 引入全局样式

const router = useRouter()
const keshiStore = useKeshiStore()
const doctorStore = useDoctorStore()

const weekdaysShort = '日_一_二_三_四_五_六'.split('_')

const doctorList = computed(() => {
    return doctorStore.doctorList.filter(doctor => doctor.keshi == keshiStore.activeKeshi.id);
})

function toGuahao() {
    router.push({
        path: '/guahao',
        query: {
            keshi: keshiStore.activeKeshi.id
        }
    })
} 
</script>


<template>
    <div class="keshi-page-wrapper main-background">
        <page-title title="科室设置" icon-name="icon-mianxingyishengtubiao3"></page-title>
        <div class="main">
            <keshi-nav :keshi-list="keshiStore.keshiList"></keshi-nav>
            <div class="keshi-detail">
                <h3 class="sec-title">{{ keshiStore.activeKeshi.name }}</h3>
                <el-scrollbar max-height="calc(100% - 27px)">
                    <div>
                        <h3>{{ keshiStore.activeKeshi.opDay }}</h3>
                        <ul class="week">
                            <li v-for="(item, index) in weekdaysShort" :key="index" class="list-item day"
                                :class="{ 'is-work': keshiStore.activeKeshi.workDay[index] == 1 }">{{ item }}</li>
                        </ul>
                    </div>
                    <h3>坐诊时间 <text class="bold10">{{ keshiStore.activeKeshi.opTime }}</text></h3>
                    <h3 v-if="keshiStore.activeKeshi.hotline !== undefined">
                        科室电话 <text class="bold10">{{ keshiStore.activeKeshi.hotline }}</text>
                    </h3>
                    <el-divider />
                    <div class="keshi-header">
                        <h3 class="sec-title">科室医生</h3>
                        <el-button type="primary" text @click="toGuahao">
                            查看排班
                            <el-icon class="el-icon--right">
                                <ArrowRight />
                            </el-icon>
                        </el-button>
                    </div>
                    <div v-for="(doctor, index) in doctorList" :key="index">
                        <doctor-card :name="doctor.name" :title="doctor.title" :goodat="doctor.goodat" :pic="doctor.pic" :web="doctor.web"></doctor-card>
                    </div>
                </el-scrollbar>
            </div>
        </div>
    </div>
</template>
  
 
<style scoped>
.keshi-page-wrapper {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.main {
    height: calc(100% - 70px);
    display: flex;
    flex: 1;
}

ul {
    padding-inline-start: 1px;
}

.keshi-detail {
    flex: 1;
    background-color: rgba(255, 255, 255, 0.7);
    padding: 20px;
    color: #333; /* 设置字体颜色为深灰色 */
}

.keshi-header {
    display: flex;
    justify-content: space-between;
}

.list-item {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    border-bottom: 1px solid #ebecf1;
    background: rgba(245, 246, 247, 0.7);
    color: #333; /* 设置字体颜色为深灰色 */
    font-size: 14px;
}

.week {
    display: flex;
    border: 1px solid rgb(245, 246, 247);
    margin-bottom: 15px;
    margin-top: 3px;
}

.day {
    height: 40px;
    width: 100%;
    border: 1px solid #747477;
    margin-left: -1px;
}

.week .is-work {
    background-color: rgba(146, 222, 236, 0.2);
}

.bold10 {
    font-weight: 700;
    padding-left: 10px;
}

.sec-title {
    padding-bottom: 15px;
    font-weight: 700;
    font-size: 20px;
}
</style>
  
<style>
.el-scrollbar__thumb {
    display: none;
}
</style>