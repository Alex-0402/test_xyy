<template>
  <div class="about">
    <h1>This is an about page</h1>
  </div>

  <el-row class="mb-4">
    <el-button>Default</el-button>
    <el-button type="primary">Primary</el-button>
    <el-button type="success">Success</el-button>
    <el-button type="warning">Warning</el-button>
  </el-row>

  <el-calendar v-model="value" />
</template>

<script setup>
import { ref } from 'vue'
const value = ref(new Date())
const tabPosition = ref('left')
const type1 = ref('border-card')
</script>

<style scoped>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}

.el-tabs__content {
  padding: 32px;
  color: #6b778c;
  font-size: 32px;
  font-weight: 600;
}

.el-tabs--right .el-tabs__content,
.el-tabs--left .el-tabs__content {
  height: 100%;
}
</style>
