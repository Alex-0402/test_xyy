<template>
    <div class="photo-capture">
      <video ref="video" width="640" height="480" autoplay></video>
      <canvas ref="canvas" width="640" height="480" style="display: none;"></canvas>
      <button @click="openCamera">打开摄像头</button>
      <button @click="takePhoto">拍照</button>
      <button @click="stopCamera">关闭摄像头</button>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const video = ref(null);
  const canvas = ref(null);
  
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.value.srcObject = stream;
    } catch (error) {
      console.error('打开摄像头失败:', error);
    }
  };
  
  const takePhoto = () => {
    const context = canvas.value.getContext('2d');
    if (context) {
      context.drawImage(video.value, 0, 0, canvas.value.width, canvas.value.height);
      // 这里可以获取拍照图片的base64数据或者Blob对象
      const imageData = canvas.value.toDataURL('image/png');
      console.log(imageData);
      // 可以触发一个事件，将图片数据传递给父组件
      // emit('photo-taken', imageData);
    }
  };
  
  const stopCamera = () => {
    if (video.value.srcObject) {
      const tracks = video.value.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };
  </script>
  
  <style scoped>
  .photo-capture video {
    border: 1px solid #000;
    width: 100%;
  }
  </style>