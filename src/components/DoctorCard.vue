<script setup>

defineProps({
    name: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    goodat: {
        type: String,
        required: true
    },
    pic: {
        type: String,
        required: true
    },
    web: {
        type: String,
        required: true
    }
})

function openLink(web) {
    return
    if (web != '') {
        window.location.href = web
    }
}

</script>

<template scoped>
    <el-card class="doctor-card" @click="openLink(web)">
        <div class="card-body">
            <el-avatar class="doctor-pic" shape="circle" :size="100" fit="fill"
                :src="pic == '' ? 'http://static.youlai.cn/images/cnkang/hosexp/man.jpg' : pic" />
            <div class="doctor-info">
                <h3 class="doctor-name">{{ name }}</h3>
                <h3 class="doctor-title">{{ title }}</h3>
            </div>
        </div>
        <h3>专业擅长：{{ goodat }}</h3>
    </el-card>
</template>

<style lang="scss">
.doctor-card {
    margin-bottom: 10px;
    height: fit-content;
}

.el-card__body {
    padding: 10px;
}

.card-body {
    display: flex;
    align-items: flex-end;
    justify-content: left;
    margin-bottom: 10px;
}

.doctor-info {
    margin-left: 20px;
    display: flex;
    flex-direction: column;
    justify-content: end;
}

.doctor-name {
    font-weight: 700;
    font-size: 22px;
}

h3 {
    font-size: 18px;
}
</style>
