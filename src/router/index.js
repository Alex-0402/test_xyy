import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    },
    {
      path:'/gaikuang',
      name:'校医院概况',
      component: () => import('../views/GaikuangView.vue')
    },
    {
      path:'/keshi',
      name:'科室设置',
      component: () => import('../views/KeshiView.vue')
    },
    {
      path:'/guahao',
      name:'门诊排班',
      component: () => import('../views/GuahaoView.vue')
    },
    {
      path:'/yibao-xs',
      name:'学生医保',
      component: () => import('../views/XueshengYibao.vue')
    },

    {
      path:'/medicine-about',
      name:'药品相关',
      component: () => import('../views/MedicineAboutView.vue')
    },
    {
      path:'/medicine',
      name:'药品预约',
      component: () => import('../views/MedicineView.vue')
    },
    {
      path:'/photo',
      name:'水印相机',
      component: () => import('../views/Photo.vue')
    },

    // 文章部分
    {
      path:'/tongzhi',
      name:'校医院通知',
      component: () => import('../views/TongzhiView.vue')
    },
    {
      path:'/zhinan',
      name:'服务指南',
      component: () => import('../views/Zhinan.vue')
    },
    {
      path:'/xinwen',
      name:'校医院新闻',
      component: () => import('../views/XinwenView.vue')
    },
    {
      path:'/kepuList',
      name:'健康科普',
      component: () => import('../views/KepuListView.vue')
    },

    // 登陆
    {
      path:'/login',
      name:'登录',
      component: () => import('../views/LoginView.vue')
    },
    {
      path:'/change-password',
      name:'修改密码',
      component: () => import('../views/ChangePasswordView.vue')
    },
    {
      path:'/security-questions',
      name:'安全问题设置',
      component: () => import('../views/SecurityQuestionsView.vue')
    },

    // 管理员页面
    {
      path: '/doctor-info',
      name: '修改医生个人资料卡',
      component: () => import('../views/DoctorInfoCollect.vue')
    },
    {
      path: '/change-keshi',
      name: '修改值班信息',
      component: () => import('../views/ChangePaibanView.vue')
    },
    {
      path: '/add-keshi-info',
      name: '修改科室信息',
      component: () => import('../views/DepartmentInfoCollect.vue')
    },
    {
      path: '/keshi-schedule',
      name: '科室排班管理',
      component: () => import('../views/KeshiScheduleView.vue')
    },
    {
      path: '/tongzhi-manage',
      name: '通知管理',
      component: () => import('../views/admin/TongzhiManageView.vue')
    },
    {
      path: '/xinwen-manage',
      name: '新闻管理',
      component: () => import('../views/admin/XinwenManageView.vue')
    },
    {
      path: '/zhinan-manage',
      name: '服务指南管理',
      component: () => import('../views/admin/ZhinanManageView.vue')
    },
    {
      path: '/kepu-manage',
      name: '科普文章管理',
      component: () => import('../views/admin/KepuManageView.vue')
    },
  ]
})

// 添加路由守卫，保护需要管理员权限的页面
router.beforeEach((to, from, next) => {
  // 如果是管理员才能访问的页面，在这里添加路径
  const adminRoutes = [
    '/change-password', 
    '/security-questions', 
    '/doctor-info', 
    '/change-keshi', 
    '/add-keshi-info', 
    '/keshi-schedule',
    '/tongzhi-manage',
    '/xinwen-manage',
    '/zhinan-manage',
    '/kepu-manage'
  ];
  
  // 检查是否为管理员页面
  if (adminRoutes.includes(to.path)) {
    // 获取token
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      // 如果没有token，跳转到登录页面
      next('/login');
    } else {
      // 有token，允许访问
      next();
    }
  } else {
    // 不是管理员页面，允许所有人访问
    next();
  }
});

export default router
