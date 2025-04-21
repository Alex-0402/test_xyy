import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTongzhiStore = defineStore('tongzhi', () => {
  const tongzhiArticleList = ref([
    {
      id: 1,
      title: '关于开展校医院义诊服务的通知',
      pic: 'https://hq.qd.sdu.edu.cn/__local/2/B0/2B/25A64E8BE72CB203D5394481F6F_9913523E_BC2C.jpg',
      url: 'https://hq.qd.sdu.edu.cn/info/1014/2035.htm'
    },
    {
      id: 2,
      title: '关于山大青岛校区核酸检测的通知',
      pic: 'https://hq.qd.sdu.edu.cn/__local/9/C6/D0/85D6EC5553B2A3FDBF472ECDBE4_26FCBC75_5AF0.jpg',
      url: 'https://hq.qd.sdu.edu.cn/info/1014/2034.htm'
    },
    // 可以添加更多通知
  ])

  const showShare = ref({
    isShow: 'share' in navigator
  })

  return { tongzhiArticleList, showShare }
})
