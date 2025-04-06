<template>
    <div class="watermark-camera">
      <vue-web-cam @camera-change="handleCameraChange" @拍照="takePhoto" />
      <canvas ref="canvas" class="snapshot" />
      <watermark-settings :settings="settings" @update:settings="updateSettings" />
    </div>
  </template>
  
  <script>
  import { ref } from 'vue';
  import VueWebCam from 'vue-web-cam';
  import WatermarkSettings from './WatermarkSettings.vue';
  
  export default {
    components: {
      VueWebCam,
      WatermarkSettings
    },
    setup() {
      const webcamStream = ref(null);
      const canvas = ref(null);
      const settings = ref({
        text: '默认水印',
        color: '#fff',
        fontSize: 20,
        opacity: 0.5,
        position: { x: '10px', y: '20px' }
      });
  
      const handleCameraChange = (stream) => {
        webcamStream.value = stream;
      };
  
      const takePhoto = () => {
        const ctx = canvas.value.getContext('2d');
        const video = webcamStream.value; // 假设你有一个视频元素
  
        if (video) {
          ctx.drawImage(video, 0, 0, canvas.value.width, canvas.value.height);
          applyWatermark(ctx);
        }
      };
  
      const applyWatermark = (ctx) => {
        ctx.font = `${settings.value.fontSize}px sans-serif`;
        ctx.fillStyle = settings.value.color;
        ctx.globalAlpha = settings.value.opacity;
        ctx.fillText(settings.value.text, ...parsePosition());
      };
  
      const parsePosition = () => {
        // 解析位置字符串为数值
        return [
          parseInt(settings.value.position.x, 10),
          parseInt(settings.value.position.y, 10)
        ];
      };
  
      const updateSettings = (newSettings) => {
        settings.value = { ...settings.value, ...newSettings };
      };
  
      return {
        webcamStream,
        canvas,
        settings,
        handleCameraChange,
        takePhoto,
        updateSettings
      };
    }
  };
  </script>
  
  <style>
  .watermark-camera {
    position: relative;
  }
  .snapshot {
    display: none; /* 默认隐藏canvas，仅用于绘制 */
  }
  </style>