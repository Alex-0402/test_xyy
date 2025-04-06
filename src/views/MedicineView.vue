<script setup>
import PageTitle from '../components/PageTitle.vue'
import { Search } from '@element-plus/icons-vue'
import { useKepuStore } from '../stores/kepu';
const kepuStore = useKepuStore();
const input1 = ref('')

function handleInput() {
    console.log(input1)
}

</script>

<template>
    <page-title title="药品预约" icon-name="iconfont icon-mianxingyaotubiao2"></page-title>

    <div class="main">
        <div class="sec-title">校医院药品查询：
            <el-input v-model="input1" style="width: 145px" placeholder="Please Input" :suffix-icon="Search"
                @input="handleInput" />
        </div>
        <div class="sec-title">不在库药品预约： 0532-58630120</div>

        <el-scrollbar max-height="100%">
            <div v-for="(article, index) in kepuStore.kepuArticleList" :key="index" @click="openLink(article.url)"
                class="layout-single-image">
                <div class="layout-single-image-l">
                    {{ article.title }}
                </div>
                <el-image :src="article.pic" fit="cover" class="image-content">
                </el-image>
            </div>
        </el-scrollbar>
    </div>
</template>


<style scoped>
.main {
    height: calc(100% - 80px);
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: rgba(97, 180, 215, 0.2);
    margin: 0px 10px 10px;
}

.layout-single-image {
    height: fit-content;
    margin: 1em;
    display: flex;
    justify-content: space-between;
    padding-bottom: 1em;
    border-bottom: 0.8px solid rgb(183, 181, 181);
}

.layout-single-image-l {
    display: flex;
    flex-direction: column;
    padding-right: 0.24rem;
    font-size: 1.2rem;
    height: fit-content;
    max-width: 57vw;
}

.image-content {
    width: calc(100vw * 580 /1920);
    height: calc(100vw * 452 /1920);
    max-width: 145px;
    max-height: 113px;
    border-radius: 4px;
}

.sec-title {
    padding-bottom: 10px;
    font-weight: 700;
    font-size: 20px;
}
</style>

<style>
.el-scrollbar__thumb {
    display: none;
}
</style>