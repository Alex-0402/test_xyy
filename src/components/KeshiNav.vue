<script setup lang="ts">
import { toRefs } from 'vue';
import { useKeshiStore } from '../stores/keshi'
const keshiStore = useKeshiStore()

const props = defineProps({
    keshiList: {
        type: Array<{ id: string, name: string, isActive: boolean }>,
        required: true
    }
})
const { keshiList } = toRefs(props)

function changeNav(keshi) {
    keshiStore.activeKeshi = keshi
}

</script>

<template scoped>
    <el-scrollbar max-height="100%" class="keshi-nav">
        <ul>
            <li v-for="keshi in keshiList" :key="keshi.id" class="keshi-nav-item" :class="{ 'is-active': keshi.id == keshiStore.activeKeshi.id }"
                @click="changeNav(keshi)">
                {{ keshi.name }}
            </li>
        </ul>
        <!-- <ul>
            <li class="keshi-nav-item" :class="{'is-button':true}" @click="showNamePutter">
                添加科室
            </li>
        </ul> -->
    </el-scrollbar>
</template>

<style lang="scss" scoped>
.keshi-nav {
    width: 80px;
}

ul {
    padding-inline-start: 0px;
}

.keshi-nav li {
    font-size: 16px;
}

.keshi-nav .is-active {
    background-color: white;
    color:#9c0c15;
    font-weight: 550;
}

.keshi-nav .is-button {
    background-color: #9c0c15;
    color:#ffffff;
    font-weight: 550;
}

.keshi-nav-item {
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid #ebecf1;
    background: rgba(245, 246, 247, 0.7);
    color: rgb(40, 53, 76);
    font-size: 14px;
    height: 50px;
    width: 100%;
}
</style>
