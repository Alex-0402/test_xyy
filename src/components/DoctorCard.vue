<template>
  <div class="doctor-card">
    <img :src="pic || defaultAvatar" alt="医生头像" class="doctor-avatar" />
    <div class="doctor-info">
      <div class="doctor-name-title">
        <span class="doctor-name">{{ name }}</span>
        <span class="doctor-title">{{ title }}</span>
      </div>
      <div v-if="goodat" class="doctor-goodat">{{ goodat }}</div>
    </div>
  </div>
</template>

<script setup>
import defaultAvatar from '@/assets/default_avatar.png'
defineProps({
  name: String,
  title: String,
  goodat: String,
  pic: String,
  web: String
});
</script>

<style scoped>
.doctor-card {
  display: flex;
  align-items: flex-start;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.06);
  padding: 20px 24px;
  margin: 0;
  min-width: 0;
}

.doctor-avatar {
  width: 90px;
  height: 90px;
  border-radius: 12px;
  object-fit: cover;
  flex-shrink: 0;
  background: #f5f5f5;
}

.doctor-info {
  flex: 1;
  margin-left: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.doctor-name-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}

.doctor-name {
  font-size: 26px;
  font-weight: bold;
  color: #222;
  line-height: 1.2;
  word-break: break-all;
}

.doctor-title {
  font-size: 18px;
  color: #888;
  font-weight: 400;
  margin-left: 6px;
  line-height: 1.2;
  white-space: nowrap;
}

.doctor-goodat {
  font-size: 18px;
  color: #888;
  margin-top: 0;
  line-height: 1.7;
  word-break: break-all;
}

/* 平板及以下适配 */
@media screen and (max-width: 768px) {
  .doctor-card {
    padding: 14px 12px;
    border-radius: 10px;
  }
  .doctor-avatar {
    width: 65px;
    height: 65px;
    border-radius: 8px;
  }
  .doctor-info {
    margin-left: 14px;
  }
  .doctor-name {
    font-size: 20px;
  }
  .doctor-title {
    font-size: 14px;
  }
  .doctor-goodat {
    font-size: 14px;
  }
}

/* 手机适配 */
@media screen and (max-width: 480px) {
  .doctor-card {
    padding: 10px 6px;
    border-radius: 8px;
  }
  .doctor-avatar {
    width: 48px;
    height: 48px;
    border-radius: 6px;
  }
  .doctor-info {
    margin-left: 8px;
  }
  .doctor-name {
    font-size: 16px;
  }
  .doctor-title {
    font-size: 12px;
    margin-left: 4px;
  }
  .doctor-goodat {
    font-size: 12px;
    line-height: 1.5;
  }
}
</style>
