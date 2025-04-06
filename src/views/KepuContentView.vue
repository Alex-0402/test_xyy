<template>
  <div></div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useKepuStore } from '../stores/kepu';
import { useRoute } from 'vue-router';
// import { useMeta } from 'vue-meta';
const route = useRoute();
const kepuStore = useKepuStore();

const kepuArticle = kepuStore.kepuArticleList.find(k => k.id == route.query.id)

// try {
//   useMeta({
//   title: 'Home Page',
//   meta: [
//     {
//       property: 'og:image',
//       content: kepuArticle.pic,
//     },
//     {
//       property: 'og:description',
//       content: '山东大学青岛校区校医院',
//     }
//   ]
// });
// } catch (error) {
  
// }


let ogImage = document.querySelector('meta[property="og:image"]')
if (ogImage) {
  ogImage.setAttribute('content', kepuArticle.pic)
}
let ogTitle = document.querySelector('meta[property="og:title"]')
if (ogTitle) {
  ogTitle.setAttribute('content', kepuArticle.title)
}
let ogDesc = document.querySelector('meta[property="og:description"]')
if (ogDesc) {
  ogDesc.setAttribute('content', "山东大学校医院（青岛）")
}

onMounted(() => {
  setTimeout(function() {
    window.location.href = kepuArticle.url;
}, 800);
  
});
</script>
