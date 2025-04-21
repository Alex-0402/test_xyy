import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useXinwenStore = defineStore('xinwen', () => {
  const xinwenArticleList = ref([
    {
      id: 1,
      title: '校医院举办健康义诊活动',
      pic: 'https://hq.qd.sdu.edu.cn/__local/6/69/D2/052E593B8AB3BEA9904C2C01F12_BD6D5569_16C58.jpg',
      url: 'https://hq.qd.sdu.edu.cn/info/1015/1948.htm'
    },
    {
      id: 2,
      title: '校医院开展疫情防控培训',
      pic: 'https://hq.qd.sdu.edu.cn/__local/B/25/C8/4D2F2A2A48BCAA18852114ACBD0_37A2422E_E975.jpg',
      url: 'https://hq.qd.sdu.edu.cn/info/1015/1947.htm'
    },
    // 可以添加更多新闻
  ])

  const showShare = ref({
    isShow: 'share' in navigator
  })

  return { xinwenArticleList, showShare }
})
