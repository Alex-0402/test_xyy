// 模拟后端API的响应数据

// 模拟用户数据
const mockUsers = [
  {
    username: '111',
    password: '111', // 实际项目中应该使用加密方式存储密码
    securityQuestions: [
      { id: 1, question: '你最喜欢的颜色是什么？', answer: '蓝色' },
      { id: 2, question: '你的出生地是？', answer: '北京' }
    ]
  }
];

// 模拟令牌
export const generateMockToken = (username) => {
  return {
    access: `mock_access_token_${username}_${Date.now()}`,
    refresh: `mock_refresh_token_${username}_${Date.now()}`
  };
};

// 模拟登录API
export const mockLogin = (username, password) => {
  const user = mockUsers.find(u => u.username === username && u.password === password);
  
  if (user) {
    const tokens = generateMockToken(username);
    return {
      status: 999,
      message: '登录成功',
      refresh: tokens.refresh
    };
  } else {
    return {
      status: 1000,
      message: '用户名或密码错误'
    };
  }
};

// 模拟刷新令牌API
export const mockRefreshToken = (refreshToken) => {
  // 简单验证：检查是否包含mock_refresh_token前缀
  if (refreshToken && refreshToken.startsWith('mock_refresh_token_')) {
    const username = refreshToken.split('_')[3];
    const tokens = generateMockToken(username);
    
    return {
      status: 999,
      message: 'Access Token获取成功',
      access: tokens.access
    };
  } else {
    return {
      status: 1003,
      message: 'Refresh Token已过期或被拉黑，请重新登陆'
    };
  }
};

// 模拟登出API
export const mockLogout = () => {
  return {
    status: 999,
    message: '登出成功'
  };
};

// 模拟修改密码API
export const mockChangePassword = (oldPassword, newPassword) => {
  console.log('调用mockChangePassword', oldPassword, newPassword);
  const user = mockUsers[0]; // 假设只操作第一个用户
  
  if (user.password === oldPassword) {
    // 如果有提供新密码，则更新用户密码（实际应用中会更新数据库）
    if (newPassword) {
      user.password = newPassword;
      console.log('模拟修改密码成功，新密码已更新');
    }
    
    return {
      status: 999,
      message: '密码修改成功'
    };
  } else {
    return {
      status: 1000,
      message: '旧密码错误'
    };
  }
};

// 模拟获取安全问题API
export const mockGetSecurityQuestions = (username) => {
  const user = mockUsers.find(u => u.username === username);
  
  if (user && user.securityQuestions && user.securityQuestions.length > 0) {
    return {
      status: 999,
      data: user.securityQuestions.map(q => ({
        id: q.id,
        question: q.question
      }))
    };
  } else {
    return {
      status: 1000,
      message: '该用户未设置安全问题'
    };
  }
};

// 模拟重置密码API
export const mockResetPassword = (username, questionId, answer) => {
  const user = mockUsers.find(u => u.username === username);
  
  if (!user) {
    return {
      status: 1000,
      message: '用户不存在'
    };
  }
  
  const question = user.securityQuestions.find(q => q.id === questionId);
  
  if (question && question.answer === answer) {
    return {
      status: 999,
      message: '密码重置成功'
    };
  } else {
    return {
      status: 1000,
      message: '安全问题答案错误'
    };
  }
};

// 模拟设置安全问题API
export const mockSetSecurityQuestions = (questions) => {
  console.log('模拟设置安全问题:', questions);
  
  if (!questions || questions.length === 0) {
    return {
      status: 1000,
      message: '问题列表不能为空'
    };
  }
  
  // 检查问题和答案是否为空
  const hasEmptyFields = questions.some(q => !q.question || !q.answer);
  if (hasEmptyFields) {
    return {
      status: 1000,
      message: '问题和答案不能为空'
    };
  }
  
  // 存储安全问题(在实际应用中，这里会存储到后端数据库)
  const user = mockUsers.find(u => u.username === 'test_admin');
  if (user) {
    user.securityQuestions = questions.map((q, index) => ({
      id: index + 1,
      question: q.question,
      answer: q.answer
    }));
  }
  
  return {
    status: 999,
    message: '安全问题设置成功'
  };
};
