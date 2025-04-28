<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import PageTitle from '../components/PageTitle.vue'
import DoctorCard from '../components/DoctorCard.vue'
// 移除KeshiNav组件的导入，我们将直接在页面实现科室导航
import { useRouter, useRoute } from 'vue-router';
import { useKeshiStore } from '../stores/keshi'
import { useDoctorStore } from '../stores/doctor'
import { ArrowRight } from '@element-plus/icons-vue'
import '@/assets/styles/common.css'; // 引入全局样式
import { ElLoading, ElMessage } from 'element-plus';

const router = useRouter()
const route = useRoute()
const keshiStore = useKeshiStore()
const doctorStore = useDoctorStore()
const loading = ref(false)

// 定义一周七天的简写名称
const weekdaysShort = '日_一_二_三_四_五_六'.split('_')

// 获取当前科室对应的医生列表
const doctorList = computed(() => {
    if (!keshiStore.activeKeshi) return [];
    
    // 如果activeKeshi中已经包含医生信息，直接使用
    if (keshiStore.activeKeshi.doctors && keshiStore.activeKeshi.doctors.length > 0) {
        return keshiStore.activeKeshi.doctors;
    }
    
    // 否则从doctorStore中获取
    return doctorStore.doctorsByDepartment[keshiStore.activeKeshi.id] || [];
})

function toGuahao() {
    router.push({
        path: '/guahao',
        query: {
            keshi: keshiStore.activeKeshi.id
        }
    })
}

// 从科室简介中提取坐诊时间
const officeHours = computed(() => {
  if (!keshiStore.activeKeshi || !keshiStore.activeKeshi.description) {
    return null;
  }

  const description = keshiStore.activeKeshi.description;
  
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
  if (keshiStore.activeKeshi.openHours) {
    return keshiStore.activeKeshi.openHours;
  }

  // 未找到任何坐诊时间信息，返回默认值
  return '08:00-17:00';
});

// 处理科室信息，从描述中移除已经提取的坐诊时间
const processedDescription = computed(() => {
  if (!keshiStore.activeKeshi || !keshiStore.activeKeshi.description) {
    return '';
  }
  
  const description = keshiStore.activeKeshi.description;
  
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

// 从URL参数中获取科室ID
function getKeshiIdFromRoute() {
    return route.query.id ? parseInt(route.query.id) : null;
}

// 选择科室的方法
function selectKeshi(keshi) {
    try {
        keshiStore.setActiveKeshi(keshi);
    } catch (err) {
        console.error('选择科室失败:', err);
        ElMessage.error('选择科室失败，请稍后再试');
    }
}

// 监听activeKeshi的变化，加载对应的医生列表
watch(() => keshiStore.activeKeshi, async (newKeshi) => {
    if (newKeshi && newKeshi.id) {
        try {
            // 如果科室已有医生列表且不为空，则不需要重新加载
            if (!newKeshi.doctors || newKeshi.doctors.length === 0) {
                await doctorStore.fetchDoctorsByDepartment(newKeshi.id);
            }
        } catch (error) {
            console.error(`加载科室${newKeshi.id}的医生列表失败:`, error);
        }
    }
}, { immediate: false });

// 初始化数据
onMounted(async () => {
    loading.value = true;
    const loadingInstance = ElLoading.service({
        fullscreen: true,
        text: '加载科室数据中...',
        background: 'rgba(255, 255, 255, 0.7)'
    });
    
    try {
        // 获取科室列表
        await keshiStore.fetchDepartments();
        
        // 检查URL中是否有指定科室ID
        const keshiIdFromRoute = getKeshiIdFromRoute();
        if (keshiIdFromRoute) {
            // 选择指定的科室
            await selectKeshi(keshiIdFromRoute);
        }
        
        // 如果有活跃科室，确保获取该科室的详细信息和医生列表
        if (keshiStore.activeKeshi) {
            // 获取科室详情（包括排班等信息）
            await keshiStore.fetchDepartmentDetail(keshiStore.activeKeshi.id);
            
            // 获取科室医生列表
            await doctorStore.fetchDoctorsByDepartment(keshiStore.activeKeshi.id);
        }
    } catch (error) {
        console.error('加载科室数据失败:', error);
        ElMessage.error('获取科室数据失败，请稍后再试');
    } finally {
        loadingInstance.close();
        loading.value = false;
    }
})
</script>

<template>
  <div class="keshi-page-wrapper main-background">
    <page-title title="科室设置" icon-name="icon-mianxingyishengtubiao3"></page-title>
    <div class="main">
      <!-- 替换KeshiNav组件为与GuahaoView相似的科室列表 -->
      <div class="keshi-nav-container">
        <ul class="keshi-list">
          <li v-for="keshi in keshiStore.keshiList" 
              :key="keshi.id"
              :class="{ 'active': keshiStore.activeKeshi && keshiStore.activeKeshi.id === keshi.id }"
              @click="selectKeshi(keshi)">
              {{ keshi.name }}
          </li>
        </ul>
      </div>
      
      <div class="keshi-detail" v-if="keshiStore.activeKeshi">
        <h3 class="sec-title">{{ keshiStore.activeKeshi.name }}</h3>
        <el-scrollbar max-height="calc(100% - 27px)">
          <div v-if="loading">
            <el-skeleton :rows="3" animated />
          </div>
          <div v-else>
            <div>
              <h3>开放日期</h3>
              <ul class="week">
                <li v-for="(item, index) in weekdaysShort" :key="index" class="list-item day"
                    :class="{ 'is-work': (keshiStore.activeKeshi.workDays || []).includes(index) }">{{ item }}</li>
              </ul>
            </div>
            <h3>坐诊时间 <text class="bold10">{{ officeHours }}</text></h3>
            <h3 v-if="keshiStore.activeKeshi.phone">
              科室电话 <text class="bold10">{{ keshiStore.activeKeshi.phone }}</text>
            </h3>
            <div v-if="processedDescription" class="keshi-description">
              <h3>科室简介</h3>
              <p>{{ processedDescription }}</p>
            </div>
            <el-divider />
            <div class="keshi-header">
              <h3 class="sec-title">科室医生</h3>
              <el-button type="primary" text @click="toGuahao" :disabled="!doctorList.length">
                  查看排班
                  <el-icon class="el-icon--right">
                      <ArrowRight />
                  </el-icon>
              </el-button>
            </div>
            <div v-if="keshiStore.loading" class="loading-doctors">
              <el-skeleton :rows="2" animated />
            </div>
            <div v-else-if="doctorList.length === 0" class="no-doctors">
              暂无医生信息
            </div>
            <div v-else>
              <div v-for="doctor in doctorList" :key="doctor.id">
                <doctor-card 
                    :name="doctor.name" 
                    :title="doctor.title" 
                    :goodat="doctor.introduction || doctor.intro" 
                    :pic="doctor.avatarUrl" 
                    :web="doctor.web">
                </doctor-card>
              </div>
            </div>
          </div>
        </el-scrollbar>
      </div>
      <div class="keshi-detail empty-state" v-else>
        <el-empty description="请选择科室"></el-empty>
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

.no-doctors {
    padding: 20px 0;
    text-align: center;
    color: #909399;
    font-size: 14px;
}

.empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
}

.keshi-description {
    margin: 15px 0;
}

.keshi-description p {
    line-height: 1.6;
    color: #555;
    margin-top: 8px;
}

.loading-doctors {
    padding: 20px 0;
}

/* 添加与GuahaoView一致的科室导航样式 */
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

<style>
.el-scrollbar__thumb {
    display: none;
}
</style>