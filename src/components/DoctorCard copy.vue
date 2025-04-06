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
    }
})

</script>

<template scoped>
    <el-card class="doctor-card">
        <div class="card-body">
            <el-avatar shape="square" :size="70" fit="cover"
                src="https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg" />
            <div class="doctor-info">
                <div>
                    <text class="doctor-name">{{ name }}</text>
                    <span class="doctor-title">{{ title }}</span>
                </div>
                <h3>擅长：{{ goodat }}</h3>
            </div>
        </div>
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
    align-items: center;

}

.doctor-info {
    margin-left: 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.doctor-name {
    font-weight: 700;
    font-size: 22px;
}

.doctor-title {
    margin-left: 10px;
    font-size: 18px;
}

h3 {
    flex: 1;
}
</style>
