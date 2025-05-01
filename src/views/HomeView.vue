<script setup>
import { reactive, computed } from 'vue';
import { RouterLink } from 'vue-router'
import PageTitle from '../components/PageTitle.vue'
import UserDropdown from '../components/UserDropdown.vue'
import { Guide } from '@element-plus/icons-vue'
import '@/assets/styles/common.css'; // 引入全局样式
import { isAuthenticated } from '@/utils/auth'; // 导入身份验证函数

const jkfwList = reactive([
  { iconName: "icon-mianxingyishengtubiao3", servName: "校医院概况", url: '/gaikuang' },
  { iconName: "icon-rili", servName: "校医院排班", url: "/keshi" },
  { iconName: "icon-baojian", servName: "校医院通知", url: "/tongzhi"},
  { iconName: "icon-a-yibaoyibaoka", servName: "学生医保", url: "/yibao-xs" },
  { iconName: "icon-mianxingshizibiaozhitubiao", servName: "服务指南", url: "/zhinan" },
  { iconName: "icon-mianxingyaotubiao2", servName: "药品相关", url: "/medicine-about" },
  { iconName: "icon-mianxingyishengtubiao3", servName: "校医院新闻", url: '/xinwen' },
  { iconName: "icon-baojian", servName: "健康科普", url: "/kepuList" },
  // { iconName: "icon-mianxingyaotubiao2", servName: "药品预约", url: "/" },
  // { iconName: "icon-mianxingdianhuatubiao", servName: "办公电话", url: "/" }
])

const adminList = reactive([
  { iconName: "icon-mianxingyishengtubiao3", servName: "医生信息管理", url: "/doctor-info" },
  { iconName: "icon-rili", servName: "医生排班管理", url: "/change-keshi" },
  //{ iconName: "icon-rili", servName: "科室排班管理", url: "/keshi-schedule" },
  { iconName: "icon-mianxingshizibiaozhitubiao", servName: "科室管理", url: "/add-keshi-info" },
  { iconName: "icon-baojian", servName: "校医院通知管理", url: "/tongzhi-manage" },
  { iconName: "icon-baojian", servName: "校医院新闻管理", url: "/xinwen-manage" },
  { iconName: "icon-mianxingshizibiaozhitubiao", servName: "服务指南管理", url: "/zhinan-manage" },
  { iconName: "icon-baojian", servName: "科普文章管理", url: "/kepu-manage" },
])

// 添加计算属性检查用户是否已登录
const isAdmin = computed(() => {
  return isAuthenticated();
});
</script>

<template>
  <div class="home-page main-background">
    <div class="header-container">
      <user-dropdown></user-dropdown>
    </div>
    <page-title title="健康服务" icon-name="icon-mianxingyiyuantubiao"></page-title>
    <el-row class="sect_content">
      <el-col v-for="(item, index) in jkfwList" :key="index" :span="8">
        <router-link :to="item.url">
          <div class="grid-content">
            <span class="iconfont" :class="item.iconName"></span>
            <p>{{ item.servName }}</p>
          </div>
        </router-link>
      </el-col>
      <!-- temp -->
      <!-- <el-col :span="8">
        <a href="https://hq.qd.sdu.edu.cn/info/1014/2036.htm">
          <div class="grid-content">
            <el-icon class="iconfont" style="height: 80px;">
              <Guide />
            </el-icon>
            <p>服务指南</p>
          </div>
        </a>
      </el-col> -->

      <!-- <el-col :span="8">
        <router-link to="/">
          <div class="grid-content">
            <span class="iconfont icon-mianxingyaotubiao2 disabled"></span>
            <p>药品预约</p>
          </div>
        </router-link>
      </el-col> -->
      <!-- temp -->
    </el-row>
    <div class="header-container">
    </div>
    
    <!-- 只有登录用户才能看到管理功能 -->
    <template v-if="isAdmin">
      <page-title title="管理功能" icon-name="icon-mianxingyiyuantubiao"></page-title>
      <el-row class="sect_content">
        <el-col v-for="(item, index) in adminList" :key="index" :span="6">
          <router-link :to="item.url">
            <div class="grid-content">
              <span class="iconfont" :class="item.iconName"></span>
              <p>{{ item.servName }}</p>
            </div>
          </router-link>
        </el-col>
      </el-row>
    </template>

    <!-- <page-title title="管理功能" icon-name="icon-setting"></page-title>
    <el-row class="sect_content">
      <el-col v-for="(item, index) in adminList" :key="index" :span="8">
        <router-link :to="item.url">
          <div class="grid-content">
            <span class="iconfont" :class="item.iconName"></span>
            <p>{{ item.servName }}</p>
          </div>
        </router-link>
      </el-col>
    </el-row> -->
  </div>
</template>


<style lang="scss" scoped>
@import url('../assets/iconfont.css');

.home-page {
  min-height: 100vh;
}

.header-container {
  position: relative;
  width: 100%;
  height: 60px;
}

.sect_content {
  padding: 0 30px;
}

.grid-content {
  min-height: 15vh;
  // background-color: rgba(168, 192, 165, 0.3);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: black;
  margin-top: 20px;
}

.iconfont {
  font-size: 50px;
  color: #9c0c15;
}

.disabled {
  color: rgb(88, 88, 88)
}

a {
  text-decoration: none;
  color: white;
  font-size: 16px;
}
</style>

