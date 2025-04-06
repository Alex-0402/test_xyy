<template>
    <div class="settings">
      <input v-model="watermarkText" placeholder="输入水印文本" />
      <input type="color" v-model="color" />
      <input type="range" v-model="fontSize" min="12" max="48" />
      <input type="range" v-model="opacity" min="0" max="1" step="0.1" />
      <div>
        X: <input type="text" v-model="position.x" />
        Y: <input type="text" v-model="position.y" />
      </div>
      <button @click="saveSettings">保存设置</button>
    </div>
  </template>
  
  <script>
  import { ref } from 'vue';
  
  export default {
    setup() {
      const watermarkText = ref('默认水印');
      const color = ref('#fff');
      const fontSize = ref(20);
      const opacity = ref(0.5);
      const position = ref({ x: '10px', y: '20px' });
  
      const saveSettings = () => {
        // 触发更新事件
        window.dispatchEvent(new CustomEvent('update:settings', {
          detail: {
            text: watermarkText.value,
            color: color.value,
            fontSize: fontSize.value,
            opacity: opacity.value,
            position: position.value
          }
        }));
      };
  
      return {
        watermarkText,
        color,
        fontSize,
        opacity,
        position,
        saveSettings
      };
    }
  };
  </script>
  
  <style>
  .settings {
    /* 样式 */
  }
  .settings input,
  .settings button {
    margin: 5px;
  }
  </style>