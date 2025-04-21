import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useKepuStore = defineStore('kepu', () => {
    const showShare = ref({
        isShow: 'share' in navigator
    });
    
    const kepuArticleList = ref([
 	    {
            id: 1,
            title: '校区领导慰问女职工，共迎"三八"妇女节',
            url: 'https://hq.qd.sdu.edu.cn/info/1020/2518.htm',
            pic: 'https://hq.qd.sdu.edu.cn/__local/0/29/15/0EB9B84A933F42F86CFB68F7407_FAED3D15_182B7.jpeg',
        },
 	    {
            id: 2,
            title: '保卫师生健康，守护校园国际化健康防线',
            url: 'https://hq.qd.sdu.edu.cn/info/1020/2516.htm',
            pic: 'https://hq.qd.sdu.edu.cn/__local/4/8C/C8/8291DC03F1D5EEF55F562826292_B5F974FB_23E12.jpeg',
        },
        {
            id: 3,
            title: '冬季呼吸道保卫战：教你如何"免疫升级"',
            url: 'https://hq.qd.sdu.edu.cn/info/1020/2481.htm',
            pic: 'https://hq.qd.sdu.edu.cn/__local/7/99/52/943B4E76224D01BAC0CA415D5FD_017E9EED_3B68.jpeg',
        },
        {
            id: 10202480,
            title: '寒假不“打烊”，校医院的温暖守护',
            url: 'https://hq.qd.sdu.edu.cn/info/1020/2480.htm',
            pic: 'https://hq.qd.sdu.edu.cn/__local/C/DF/E2/A070736A295C093EE8827F4408C_95784EB6_1BCA1.jpeg',
        },
        {
            id: 10202470,
            title: '山东大学青岛校区校医院迎来学校领导视察慰问',
            url: 'https://hq.qd.sdu.edu.cn/info/1020/2470.htm',
            pic: 'https://hq.qd.sdu.edu.cn/__local/7/80/26/D734E3A012EEA00A99326A3ACA3_488ED9A4_34111.png',
        },
        {
            id: 10202456,
            title: '致敬白衣天使：山东大学青岛校区校医院的坚守与奉献',
            url: 'https://hq.qd.sdu.edu.cn/info/1020/2456.htm',
            pic: 'https://hq.qd.sdu.edu.cn/__local/3/43/FD/BC2605B51EBF5E9B610EE9FC6E3_8F29A1CC_24C6ED.png',
        },
        {
            id: 10202454,
            title: '新年第一天，医疗服务不休息!',
            url: 'https://hq.qd.sdu.edu.cn/info/1020/2454.htm',
            pic: 'https://hq.qd.sdu.edu.cn/__local/5/B9/01/8CD514A5CDB3196D9D42E9F1CCC_4AC489B3_108430.png',
        },
        {
            id: 10202210,
            title: '春季校园传染病预防',
            url: 'https://hq.qd.sdu.edu.cn/info/1020/2210.htm',
            pic: 'https://ppt-cdn.hrxz.com/d/file/01202005/5cyvuluvmdm.png',
        },
        {
            id: 10202161,
            title: '快讯：无需签约！2月1日起职工医保普通门诊费用在校医院可直接报销',
            url: 'https://hq.qd.sdu.edu.cn/info/1020/2161.htm',
            pic: 'https://img2.baidu.com/it/u=247179938,1084790980&fm=253&fmt=auto&app=120&f=JPEG?w=608&h=469',
        },
        {
            id: 10202122,
            title: '肺炎支原体抗体阳性，就是支原体肺炎吗？看看专家怎么说',
            url: 'https://hq.qd.sdu.edu.cn/info/1020/2122.htm',
            pic: 'https://hq.qd.sdu.edu.cn/__local/D/FE/B3/586CDCFC5FA5F5AF965EAEBCFFD_1385AA5B_6B1F0.png',
        },
        {
            id: 10202097,
            title: '世界糖尿病日|警惕这些糖尿病并发症！',
            url: 'https://hq.qd.sdu.edu.cn/info/1020/2097.htm',
            pic: 'https://img1.baidu.com/it/u=344516272,2258116463&fm=253&fmt=auto&app=120&f=JPEG?w=800&h=500',
        },
        {
            id: 10202071,
            title: '诺如病毒胃肠炎健康提示',
            url: 'https://hq.qd.sdu.edu.cn/info/1020/2071.htm',
            pic: 'https://hq.qd.sdu.edu.cn/__local/5/4D/09/0D115C76BF6CD98C9C3B75E9A01_E9E46B3B_EBCC.jpg',
        },
        {
            id: 10202069,
            title: '预防呼吸道传染病，这些措施是关键！',
            url: 'https://hq.qd.sdu.edu.cn/info/1020/2069.htm',
            pic: 'https://hq.qd.sdu.edu.cn/__local/A/4F/01/092E746AF79E5530D03767B6C07_051AAE77_3E8C4.png',
        },
        {
            id: 10202063,
            title: '对于牙膏，不必谈“氟”色变',
            url: 'https://hq.qd.sdu.edu.cn/info/1020/2063.htm',
            pic: 'https://hq.qd.sdu.edu.cn/__local/1/31/75/65705EDE401E55C0FF7DB41E05B_77563CBC_7242.jpg',
        },
        {
            id: 10201910,
            title: '用好AED，织牢急救网 | 你想了解的“救命神器”，就在这里！',
            url: 'https://hq.qd.sdu.edu.cn/info/1020/1910.htm',
            pic: 'https://hq.qd.sdu.edu.cn/__local/C/32/61/385B87C0292E454C8DCD98721EC_ED189E5D_4435A.png',
        },
        {
            id: 10201862,
            title: '高温天气，小心热射病！',
            url: 'https://hq.qd.sdu.edu.cn/info/1020/1862.htm',
            pic: 'https://img0.baidu.com/it/u=524933575,3703646990&fm=253&fmt=auto&app=120&f=JPEG?w=627&h=470',
        },
        {
            id: 10201860,
            title: '如何应对高温中暑',
            url: 'https://hq.qd.sdu.edu.cn/info/1020/1860.htm',
            pic: 'https://img1.baidu.com/it/u=2386929321,2736539149&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=538',
        },
        {
            id: 10201850,
            title: '夏季空调使用小贴士',
            url: 'https://hq.qd.sdu.edu.cn/info/1020/1850.htm',
            pic: 'https://img1.baidu.com/it/u=3148057606,604455803&fm=253&fmt=auto&app=138&f=JPEG?w=766&h=500',
        }
    ]);

    // 添加更新文章列表的函数
    function updateKepuArticles(newArticles) {
        kepuArticleList.value = [...newArticles];
    }

    return { kepuArticleList, showShare, updateKepuArticles }
})
