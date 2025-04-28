<script setup>
import { defineProps, inject } from 'vue';
import { useKeshiStore } from '../stores/keshi';
import { useDoctorStore } from '../stores/doctor';
import { ElMessage } from 'element-plus';

const props = defineProps({
  keshiList: {
    type: Array,
    required: true
  }
});

const keshiStore = useKeshiStore();
const doctorStore = useDoctorStore();

// 切换选中的科室
async function switchKeshi(keshi) {
  try {
    keshiStore.setActiveKeshi(keshi);
    
    // 加载该科室的医生列表
    await doctorStore.fetchDoctorsByDepartment(keshi.id);
  } catch (error) {
    console.error('切换科室时出错:', error);
    ElMessage.error('加载科室医生列表失败，请稍后再试');
  }
}
</script>

<template>
  <div class="keshi-nav">
    <h3 class="nav-title">科室列表</h3>
    <el-scrollbar height="calc(100vh - 140px)">
      <div
        v-for="(item, index) in keshiList"
        :key="index"
        class="keshi-item"
        :class="{'active': keshiStore.activeKeshi && keshiStore.activeKeshi.id === item.id}"
        @click="switchKeshi(item)"
      >
        {{ item.name }}
      </div>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.keshi-nav {
  width: 80px;
}

.keshi-item {
  font-size: 16px;
  cursor: pointer;
}

.keshi-item.active {
  background-color: white;
  color: #9c0c15;
  font-weight: 550;
}

.keshi-nav .is-button {
  background-color: #9c0c15;
  color: #ffffff;
  font-weight: 550;
}

.keshi-nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #ebecf1;
  background: rgba(245, 246, 247, 0.7);
  color: rgb(40, 53, 76);
  font-size: 14px;
  height: 50px;
  width: 100%;
}
</style>
