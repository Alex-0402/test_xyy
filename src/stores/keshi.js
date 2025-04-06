import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'

export const useKeshiStore = defineStore('keshi', () => {
  const keshiList = [
    // {
    //   id: 'jz', name: '急诊内科',
    //   opDay: '周一至周日，节假日不休', workDay: [1, 1, 1, 1, 1, 1, 1],
    //   opTime: '24小时', hotline: '(0532) 58 630 120',
    // },
    {
      id: 'jz', name: '急诊',
      opDay: '周一至周日，节假日不休', workDay: [1, 1, 1, 1, 1, 1, 1],
      // opTime: '24小时', hotline: '(0532) 58 630 120',
      opTime: '1月23日-27日、2月5日-2月13日，24小时值班；1月28日-2月4日（除夕至初七）期间，值班时间：8:00~16:00', hotline: '18561813312，58630120',
    },
    // {
    //   id: 'wk', name: '外科',
    //   opDay: '周一至周五', workDay: [0, 1, 1, 1, 1, 1, 0],
    //   opTime: '8:00-16:00', hotline: '(0532) 58 631 031',
    // },
    // {
    //   id: 'nk', name: '内科',
    //   opDay: '周一至周五', workDay: [0, 1, 1, 1, 1, 1, 0],
    //   opTime: '8:00-16:00', hotline: '(0532) 58 631 036',
    // },
    // {
    //   id: 'll', name: '理疗室',
    //   opDay: '周一至周五', workDay: [0, 1, 0, 0, 0, 1, 0],
    //   opTime: '8:00-16:00',
    // },
    {
      id: 'kq', name: '口腔科',
      opDay: '周一、周五', workDay: [0, 1, 0, 0, 0, 1, 0],
      // opTime: '8:30-16:30', hotline: '(0532) 58 631 039',
      opTime: '口腔科、眼科、耳鼻喉科、妇科、心理门诊等其他科室2月17日后正常工作，具体值班时间见后续排班表。', hotline: '(0532) 58 631 039',
    },
    {
      id: 'fk', name: '妇科',
      opDay: '周五', workDay: [0, 0, 0, 0, 0, 1, 0],
      // opTime: '8:30-16:30', hotline: '(0532) 58 631 032',
      opTime: '口腔科、眼科、耳鼻喉科、妇科、心理门诊等其他科室2月17日后正常工作，具体值班时间见后续排班表。', hotline: '(0532) 58 631 039',
    },
    {
      id: 'yk', name: '眼科',
      opDay: '周六', workDay: [0, 0, 0, 0, 0, 0, 1],
      // opTime: '8:00-16:00',
      opTime: '口腔科、眼科、耳鼻喉科、妇科、心理门诊等其他科室2月17日后正常工作，具体值班时间见后续排班表。', hotline: '(0532) 58 631 039',
    },
    {
      id: 'eb', name: '耳鼻喉科',
      opDay: '周六', workDay: [0, 0, 0, 0, 0, 0, 1],
      // opTime: '8:30-16:30',
      opTime: '口腔科、眼科、耳鼻喉科、妇科、心理门诊等其他科室2月17日后正常工作，具体值班时间见后续排班表。', hotline: '(0532) 58 631 039',
    },
    {
      id: 'xl', name: '心理门诊',
      opDay: '周三（间隔一周）', workDay: [0, 0, 0, 1, 0, 0, 0],
      // opTime: '8:30-16:30',
      opTime: '口腔科、眼科、耳鼻喉科、妇科、心理门诊等其他科室2月17日后正常工作，具体值班时间见后续排班表。', hotline: '(0532) 58 631 039',
    }
  ]

  const activeKeshi = ref(keshiList[0])

  const keshiListByDay = computed(() => {
    const list = [[],[],[],[],[],[],[]]
    keshiList.forEach(keshi => {
      keshi.workDay.forEach((v, i) => {
        if (v == 1) {
          list[i].push(keshi)
        }
      })
    })

    return list
  })

  return { keshiList, activeKeshi, keshiListByDay }
})
