<script setup>
import { RouterView } from 'vue-router'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
</script>

<template>
  <Header></Header>
  <main>
    <router-view></router-view>
  </main>
  <Footer></Footer>
</template>

<style lang="scss" scoped>
main {
  background: url(assets/sect1_bg.png) no-repeat center center;
  height: calc(100vh - 56px);
  padding: 0px 0;
  background-size: cover;
}
</style>
