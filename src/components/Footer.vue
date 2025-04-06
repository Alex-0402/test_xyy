<script setup>
import {  ref } from 'vue';
const title_hq = ref('后勤管理处')
</script>

<template>
   <footer>
    <a href="https://hqxxh.qd.sdu.edu.cn/index.htm" :title="title_hq">
      {{ title_hq }}
    </a>
    © 2023
  </footer>
</template>

<style lang="scss" scoped>
footer {
  width: 100%;
  min-height: 56px;
  background: url(@/assets/footerBg.png) no-repeat;
  background-size: 100% 100%;
  padding: 16px 0 4px 0;
  text-align: center;
  font-size: 16px;
  color: white;
  position: relative;
  z-index: 10;
}

a {
  text-decoration: none;
  color: white;
}
</style>
