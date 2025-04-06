<script setup>

defineProps({
    iconName: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    }
})

</script>

<template scoped>
    <div class="title">
        <span class="iconfont" :class="iconName"></span>
        <h1>{{ title }}</h1>
    </div>
</template>

<style lang="scss">
@import url('../assets/iconfont.css');

.title {
    display: flex;
    padding: 15px 20px;
    line-height: 40px;
}

.title h1 {
    font-size: 20px;
    font-family: "微软雅黑";
    color: #333333;
    font-weight: bold;
    line-height: 40px;
    padding: 0 10px;
}

.title .iconfont {
    font-size: 30px;
    color: #9c0c15;
}
</style>
