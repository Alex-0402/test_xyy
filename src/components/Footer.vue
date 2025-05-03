<script setup>
import {  ref } from 'vue';
const title_hq = ref('后勤管理处')
</script>

<template>
   <footer style="line-height: 50px;">
    <!-- <div class="back-fonts">
      Powered by
    </div> -->
    <a href="https://hqxxh.qd.sdu.edu.cn/index.htm" :title="title_hq">
      {{ title_hq }}
    </a>
    &times;
    <img src="@/assets/openlab.png" alt="logo" style="width: 150px; height: 50px; margin-left: -5px; vertical-align: middle; transform: translate(0, -3px);" />
    <!-- © 2025  -->
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

.back-fonts {
  position: absolute;
  left: 0px;
  top: 0px;
  font-size: 24px;
  font-weight: bold;
  color: #ffffff56;
  padding-left: 20px;
  line-height: 56px;
}
</style>
