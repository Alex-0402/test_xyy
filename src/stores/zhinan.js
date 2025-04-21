import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useZhinanStore = defineStore('zhinan', () => {
  const zhinanArticleList = ref([
    {
      id: 1,
      title: '山东大学青岛校区校医院就医指南',
      pic: 'https://hq.qd.sdu.edu.cn/__local/5/D6/B9/59E3801503CD08D36569C70A0E3_6DC30017_BC2C.jpg',
      url: 'https://hq.qd.sdu.edu.cn/info/1014/2036.htm'
    },
    {
      id: 2,
      title: '校医院处方药品使用指南',
      pic: 'https://hq.qd.sdu.edu.cn/__local/2/03/E4/B778AD0F877022345E62B48F446_4544DA9B_8E84.jpg',
      url: 'https://hq.qd.sdu.edu.cn/info/1014/2037.htm'
    },
    // 可以添加更多服务指南
  ])

  const showShare = ref({
    isShow: 'share' in navigator
  })

  return { zhinanArticleList, showShare }
})
