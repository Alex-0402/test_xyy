<script setup>
import { ref } from 'vue';
const title_xyy = ref('校医院')
</script>

<template>
  <header>
    <a href="/" :title="title_xyy">
      <img :alt="title_xyy" class="logo" src="@/assets/logo.png" width="125" height="125" />
    </a>
    <div class="header_text">
      <p>| {{ title_xyy }}</p>
    </div>
  </header>
</template>

<style lang="scss" scoped>
header {
  width: 100%;
  height: 56px;
  padding: 12px 0;
  background-color: #9c0c15;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.header_text {
  // margin-bottom: 10px;
  margin-left: 10px;
  color: rgb(235, 228, 230);
  font-size: 25px;
  font-family: '黑体';
  font-weight: bolder;
}

.logo {
  width: 174px;
  height: 37px;
  margin-top: 10px;
}
</style>
