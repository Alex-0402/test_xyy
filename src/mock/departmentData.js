/**
 * 科室信息管理的模拟数据
 * 用于前端开发和测试
 */

// 科室列表数据
export const departmentsList = {
  code: 200,
  message: "获取成功",
  type: "department",
  data: [
    {
      id: 1,
      name: "内科",
      introduction: "内科是临床医学的一个专业分支，主要通过药物、物理治疗等非手术方式治疗疾病。工作时间：08:00 - 17:30",
      doctors: [
        {
          id: 1,
          name: "张医生",
          title: "主任医师"
        },
        {
          id: 2,
          name: "王医生",
          title: "副主任医师"
        }
      ],
      created_at: "2023-04-08T12:11:18.740154Z",
      updated_at: "2023-04-08T12:11:18.740177Z"
    },
    {
      id: 2,
      name: "外科",
      introduction: "外科是以手术治疗为主要手段的专业，专注于手术治疗和相关护理。工作时间：08:30 - 17:00",
      doctors: [
        {
          id: 3,
          name: "李医生",
          title: "主任医师"
        }
      ],
      created_at: "2023-04-08T12:15:24.740154Z",
      updated_at: "2023-04-08T12:15:24.740177Z"
    },
    {
      id: 3,
      name: "儿科",
      introduction: "儿科专门从事婴幼儿及青少年保健和疾病治疗的临床医学科室。工作时间：08:00 - 18:00",
      doctors: [
        {
          id: 4,
          name: "赵医生",
          title: "主治医师"
        },
        {
          id: 5,
          name: "刘医生",
          title: "住院医师"
        }
      ],
      created_at: "2023-04-09T09:24:18.740154Z",
      updated_at: "2023-04-09T09:24:18.740177Z"
    },
    {
      id: 4,
      name: "妇产科",
      introduction: "妇产科是专门处理女性生殖系统和妊娠相关疾病的医学科室。工作时间：08:30 - 17:30",
      doctors: [],
      created_at: "2023-04-10T10:33:18.740154Z",
      updated_at: "2023-04-10T10:33:18.740177Z"
    },
    {
      id: 5,
      name: "眼科",
      introduction: "眼科是研究发生在视觉系统疾病的诊断和治疗的专业。工作时间：09:00 - 16:30",
      doctors: [
        {
          id: 6,
          name: "陈医生",
          title: "主任医师"
        }
      ],
      created_at: "2023-04-11T08:20:18.740154Z",
      updated_at: "2023-04-11T08:20:18.740177Z"
    }
  ]
};

// 单个科室详情数据 (用于测试获取科室详情)
export const departmentDetail = (id) => {
  const department = departmentsList.data.find(dept => dept.id === Number(id));
  
  if (!department) {
    return {
      code: 404,
      message: "科室不存在",
      data: null
    };
  }
  
  return {
    code: 200,
    message: "获取成功",
    data: { ...department, type: "department" }
  };
};

// 创建科室的成功响应
export const createDepartmentResponse = (data) => {
  return {
    code: 201,
    message: "创建成功",
    data: {
      id: Math.floor(Math.random() * 1000) + 10, // 生成随机ID
      name: data.name,
      introduction: data.introduction,
      doctors: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      type: "department"
    }
  };
};

// 更新科室的成功响应
export const updateDepartmentResponse = (id, data) => {
  const department = departmentsList.data.find(dept => dept.id === Number(id));
  
  if (!department) {
    return {
      code: 404,
      message: "科室不存在",
      data: null
    };
  }
  
  return {
    code: 200,
    message: "更新成功",
    data: {
      ...department,
      ...data,
      updated_at: new Date().toISOString(),
      type: "department"
    }
  };
};

// 删除科室的成功响应
export const deleteDepartmentResponse = (id) => {
  const department = departmentsList.data.find(dept => dept.id === Number(id));
  
  if (!department) {
    return {
      code: 404,
      message: "科室不存在",
      data: null
    };
  }
  
  return {
    code: 204,
    message: "删除成功",
    data: {
      id: Number(id),
      deleted_at: new Date().toISOString(),
      type: "department"
    }
  };
};

// 科室排班数据
export const departmentSchedules = (departmentId) => {
  // 检查科室是否存在
  const department = departmentsList.data.find(dept => dept.id === Number(departmentId));
  
  if (!department) {
    return {
      code: 404,
      message: "科室不存在",
      data: null
    };
  }
  
  // 为科室生成14天的排班数据
  const schedules = [];
  const today = new Date();
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // 周末安排不同的排班
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    if (!isWeekend || Math.random() > 0.5) { // 周末有50%概率有排班
      schedules.push({
        id: 1000 + i,
        date: date.toISOString().split('T')[0],
        start_time: isWeekend ? "09:00:00" : "08:00:00",
        end_time: isWeekend ? "15:00:00" : "17:00:00",
        doctors: department.doctors.filter(() => Math.random() > 0.3) // 随机选择医生值班
      });
    }
  }
  
  return {
    code: 200,
    message: "获取成功",
    type: "schedule",
    data: schedules
  };
};
