[toc]

# 校医院后端restful api服务

## 项目结构

```
├── manage.py
├── xyy
│   ├── __init__.py
│   ├── __pycache__
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── xyy_app
    ├── __init__.py
    ├── admin.py
    ├── api   (api的类视图)
    │   └── article_view.py
    |   └── auth_view.py
    |   └── default_schedule_view.py
    │   └── department_view.py
    │   └── doctor_view.py
    |   └── image_upload.py
    |   └── ...
    ├── utils   (封装好的组件)
    │   └── response.py (响应相关组件)
    ├── apps.py
    ├── migrations
    ├── models.py   (实体类定义)
    ├── serializers.py   (序列化器)
    ├── mixins.py   (基础API视图Mixin)
    ├── tests.py
    └── views.py
```

## 关于API

### （1）规范：

**开发规范**：使用restframework开发，符合restful格式，使用序列化器进行序列化；

**基础响应**：对于所有接口，返回值中应当有code（自定义状态码）和message（返回信息）；

**图片策略**：初步想法是做一个图片上传接口，将前端分割好的图片传到后端指定静态目录后，使用nginx托管；

**鉴权策略**：初步想法是JWT+django admin，重置密码可以使用“旧密码”或者“安全问题”，搞邮箱感觉太赘余了，暂且搁置；

**文章类型**：三个类型分别对应前端的通知，新闻，科普板块；

**分页获取**：获取文章应当分页获取，指定page_index（从第几页开始）和page_size（每一页多少对象）；

**关于前端**：有个初步想法，重要通知需要全局置顶和跳转（可关）；

**关于文档**：所有的api url实际上是base_url/api/xxx，base_url取决于端口和域名（如本地就是`http://localhost:8000`）

**关于图片资源**：所有的图片均使用nginx托管，图片上传接口返回的url为静态文件路径，如`/media/doctor_avatars/20250415/a5349c4a60c143529955045b9d733212.jpg`，当前配置中主机ip为38.38.251.234，端口8001，则应当通过`GET http://38.38.251.86:8001/media/doctor_avatars/20250415/a5349c4a60c143529955045b9d733212.jpg`来获取图片。

### （2）接口需求：

（1）鉴权

登录，登出，修改密码（可以使用旧密码或者双重安全问题进行修改，因为要应对忘记密码的情况，所以无需鉴权）

（2）医生板块

创建医生资料卡，修改医生资料卡，删除医生资料卡，分页获取医生列表，获取医生资料详情

（3）科室板块

创建科室，修改科室信息，删除科室，获取科室列表（这个应该不需要分页吧），获取科室详情,获取科室排班，创建排班表，修改排班表，删除排班表，获取排班表详情，获取总排班表列表（需要分页吗）

（4）文章板块

创建文章，修改文章，删除文章，分页获取文章，获取文章详情，上传文章图片

## API文档

### （0）图片上传

#### 1. 上传医生头像

**给指定id的医生上传图片**

- **URL**: `/api/upload/doctor-avatar/<doctor_id>/`  
- **Method**: `POST`  
- **权限**: 需要有效的 Access Token  

**请求参数**
| 参数名       | 类型   | 必填 | 描述    |
|--------------|--------|------|--------|
| `image`   | file | 是   | 图片       |

**成功响应 (200 OK)**
```json
{
    "code": 201,
    "message": "图片上传成功",
    "image_name": "a5349c4a60c143529955045b9d733212.jpg",
    "url": "/media/doctor_avatars/20250415/a5349c4a60c143529955045b9d733212.jpg"
}
```

#### 2. 上传文章图片

**实际上是个通用的图片上传接口，前端只需要拼接出url再拼接出markdown图片渲染格式即可，假如当前配置中主机ip为38.38.251.234，端口8001，则应当通过`GET http://38.38.251.86:8001/media/doctor_avatars/20250415/a5349c4a60c143529955045b9d733212.jpg`来获取图片。**

- **URL**: `/api/upload/article-image/`  
- **Method**: `POST`  
- **权限**: 需要有效的 Access Token  

**请求参数**
| 参数名       | 类型   | 必填 | 描述    |
|--------------|--------|------|--------|
| `image`   | file | 是   | 图片       |

**成功响应 (200 OK)**
```json
{
    "code": 201,
    "message": "图片上传成功",
    "image_name": "4b7ae5f89d28441f9146b0d607da62bc.png",
    "url": "/media/article_images/20250415/4b7ae5f89d28441f9146b0d607da62bc.png"
}
```


### （1）鉴权板块

BUG：貌似不少异常没有自定义处理，建议每当401 Unauthorized时，尝试用refresh token刷新accesstoken，若返回的自定义状态 "status": 1003，则说明refresh token失效，此时应当提示登录过期，跳转到页面重新登录

`python manage.py createsuperuser`创建了一个管理员，用户名：test_admin，密码：test114514!

#### 1. 用户登录

**获取 Refresh Token**

- **URL**: `/api/token/`  
- **Method**: `POST`  
- **权限**: 无  

**请求参数**
| 参数名       | 类型   | 必填 | 描述         |
|--------------|--------|------|--------------|
| `username`   | string | 是   | 用户名       |
| `password`   | string | 是   | 密码         |

**成功响应 (200 OK)**
```json
{
    "code": 999,
    "message": "登录成功",
    "refresh": "aaaaa.bbbbb.ccccc"
}
```

**错误响应**
- **401 Unauthorized** (用户名或密码错误)
```json
{
    "code": 1000,
    "message": "用户名或密码错误"
}
```

---

#### 2. 刷新 Access Token

**使用 Refresh Token 获取新的 Access Token**

- **URL**: `/api/token/refresh/`  
- **Method**: `POST`  
- **权限**: 无  
- **Content-Type**: `application/json`

**请求参数**
| 参数名     | 类型   | 必填 | 描述          |
|------------|--------|------|---------------|
| `refresh`  | string | 是   | 有效的 Refresh Token |

**成功响应 (200 OK)**
```json
{
    "code": 999,
    "message": "Access Token获取成功",
    "access": "xxxxx.yyyyy.zzzzz"
}
```

**错误响应**
- **401 Unauthorized** (Token 无效或过期)
```json
{
    "code": 1003,
    "message": "Refresh Token已过期或被拉黑，请重新登陆"
}
```

---

#### **3. 用户登出**

**使 Refresh Token 失效**

- **URL**: `/api/logout/`  
- **Method**: `POST`  
- **权限**: 需要有效的 Access Token  
- **Headers**:  
  ```
  Authorization: Bearer <access_token>
  ```

**请求参数**
| 参数名     | 类型   | 必填 | 描述          |
|------------|--------|------|---------------|
| `refresh`  | string | 是   | 正在使用的 Refresh Token |

**成功响应 (200 OK)**
```json
{
    "code": 999,
    "message": "登出成功"
}
```

**错误响应**
- **400 Bad Request** (无效 Token)
```json
{
    "code": 1000,
    "message": "Token无效"
}
```

---

#### **4. 修改密码（需旧密码）**
**用户修改自己的密码**

- **URL**: `/api/change-password/`  
- **Method**: `POST`  
- **权限**: 需要有效的 Access Token  
- **Headers**:  
  ```
  Authorization: Bearer <access_token>
  ```

**请求参数**
| 参数名         | 类型   | 必填 | 描述          |
|----------------|--------|------|---------------|
| `old_password` | string | 是   | 旧密码        |
| `new_password` | string | 是   | 新密码        |

**成功响应 (200 OK)**
```json
{
    "code": 999,
    "message": "密码修改成功"
}
```

**错误响应**
- **400 Bad Request** (旧密码错误)
```json
{
    "code": 1000,
    "message": "旧密码错误"
}
```

---

#### **5. 设置安全问题**

**设置或更新用户的安全问题（用于密码重置）**

- **URL**: `/api/security-questions/`  
- **Method**: `POST` 
- **权限**: 需要有效的 Access Token  
- **Headers**:  
  ```
  Authorization: Bearer <access_token>
  ```
**请求参数**
```json
{
    "questions": [
        {
            "question": "你最喜欢的颜色是什么？",
            "answer": "蓝色"
        },
        {
            "question": "你的出生地是？",
            "answer": "北京"
        }
    ]
}
```
- **限制**: 最多设置 3 个安全问题

**成功响应 (201 Created)**
```json
{
    "code": 999,
    "message": "安全问题设置成功"
}
```

**错误响应**
- **400 Bad Request** (问题或答案为空)
```json
{
    "code": 1000,
    "message": "问题和答案不能为空"
}
```

---

#### **6. 获取用户的安全问题**
**用于密码重置页面显示**

- **URL**: `/api/user-security-questions/<username>/`  
- **Method**: `GET`  
- **权限**: 无  

**成功响应 (200 OK)**
```json
{
    "code": 999,
    "data": [
        {
            "id": 1,
            "question": "你最喜欢的颜色是什么？"
        },
        {
            "id": 2,
            "question": "你的出生地是？"
        }
    ]
}
```

**错误响应**
- **404 Not Found** (用户未设置安全问题)
```json
{
    "code": 1000,
    "message": "该用户未设置安全问题"
}
```

---

#### **7. 通过安全问题重置密码**
**忘记密码时使用**

- **URL**: `/api/reset-password/`  
- **Method**: `POST`  
- **权限**: 无  

**请求参数**
| 参数名         | 类型   | 必填 | 描述                 |
|----------------|--------|------|----------------------|
| `username`     | string | 是   | 要重置密码的用户名    |
| `question_id`  | int    | 是   | 安全问题的ID          |
| `answer`       | string | 是   | 安全问题的答案        |
| `new_password` | string | 是   | 新密码                |

**成功响应 (200 OK)**
```json
{
    "code": 999,
    "message": "密码重置成功"
}
```

**错误响应**
- **400 Bad Request** (答案错误)
```json
{
    "code": 1000,
    "message": "安全问题答案错误"
}
```

---
#### **8. 获取旧的用户安全问题**

**获取用户的旧安全问题（用于安全问题更新）**

- **URL**: `/api/security-questions/`  
- **Method**: `GET`
- **权限**: 需要有效的 Access Token  
- **Headers**:  
  ```
  Authorization: Bearer <access_token>
  ```
**成功响应 (200 OK)**
```json
{
    "code": 999,
    "data": [
        {
            "id": 1,
            "question": "你最喜欢的颜色是什么？",
            "answer": "蓝色"
        },
        {
            "id": 2,
            "question": "你的出生地是？",
            "answer": "北京"
        }
    ]
}
```

**状态码说明**
| 状态码 | 描述                                   |
|--------|----------------------------------------|
| 999    | 操作成功                               |
| 1000   | 常规错误（如参数错误、验证失败等）     |
| 1001   | Access Token 无效或过期                |
| 1003   | Refresh Token 无效或过期               |
| 1004   | Authorization 头格式错误               |
| 1006   | 未提供 Authorization 头（未登录）      |

---
## （2）医生板块

#### 1. 获取医生资料卡列表

**分页获取医生信息**

- **URL**: `/api/doctors?size=size&index=index/`  
- **Method**: `GET`  
- **权限**: 无  
- **Content-Type**: `application/json`

**请求参数**
| 参数名        | 类型   | 必填 | 描述          |
|---------------|--------|------|---------------|
| `size`        | string | 否   | 页面大小，默认为10       |
| `index`| string | 否   | 当前页码，默认为1      |


**成功响应 (200 OK)**
```json
{
    "code": 200,
    "message": "获取成功",
    "type": "doctor",
    "data": {
        "doctor_list":[
            {
                "id": 1,
                "name": "老王",
                "title":"老王职称",
                "avatar_url":"头像网址",
                "introduction": "老王医生介绍...",
            },
            {
                "id": 1,
                "name": "小李",
                "title":"小李职称",
                "avatar_url":"头像网址",
                "introduction": "小李医生介绍...",
            }
        ],
        "total_pages":3,
        "current_page":1
     } ,
    

}
```
**错误响应**
- **400 Bad Request** (参数验证失败)
```json
{
    "code": 400,
    "message": "页码格式不符合规范，非整数/页面大小格式不符合规范，非整数"
}
```
---

#### 2. 创建医生资料卡

**创建新的科室信息**

- **URL**: `/api/doctors/`  
- **Method**: `POST`  
- **权限**: 需要管理员权限  
- **Headers**:  
  ```
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```

**请求参数**
| 参数名        | 类型   | 必填 | 描述          |
|---------------|--------|------|---------------|
| `name`        | string | 是   | 医生名称       |
| `introduction`| string | 否   | 医生介绍       |
| `title`        | string | 否   | 医生职称       |
| `avatar_url`| string | 否   | 医生头像对应网址       |

**成功响应 (201 Created)**
```json
{
    "code": 201,
    "message": "创建成功",
    "data": {
        "id": 3,
        "name": "小王",
        "title": "小王职称",
        "introduction": "小王医生介绍...",
        "avatar_url": "头像url",
        "type": "doctor"
    }
}
```

**错误响应**
- **400 Bad Request** (参数验证失败)
```json
{
    "code": 400,
    "message": "名称不能为空"
}
```

---

#### 3. 获取医生资料卡详情

**获取指定医生资料卡的详细信息**

- **URL**: `/api/doctors/<int:pk>/`  
**（注）：此处 `pk`指的是相应医生的`id`**
- **Method**: `GET`  
- **权限**: 无  
- **Content-Type**: `application/json`

**成功响应 (200 OK)**
```json
{
    "code": 200,
    "message": "获取成功",
    "data": {
        "id": 3,
        "name": "小王",
        "title": "小王职称",
        "introduction": "小王医生介绍...",
        "avatar_url": null ,
        "type": "doctor"
    }
}
```

**错误响应**
- **404 Not Found** (医生资料卡不存在)
```json
{
    "code": 404,
    "message": "医生资料卡不存在"
}
```

---

#### 4. 更新医生资料卡信息

**更新指定医生资料卡的信息**

- **URL**: `/api/doctors/<int:pk>/`  
**（注）：此处 `pk`指的是相应医生的`id`**
- **Method**: `PUT`  
- **权限**: 需要管理员权限  
- **Headers**:  
  ```
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```

**请求参数**
| 参数名        | 类型   | 必填 | 描述          |
|---------------|--------|------|---------------|
| `name`        | string | 否   | 医生名称       |
| `introduction`| string | 否   | 医生介绍       |
| `title`        | string | 否   | 医生职称       |
| `avatar_url`| string | 否   | 医生头像对应网址       |

**成功响应 (200 OK)**
```json
{
    "code": 200,
    "message": "更新成功",
    "data": {
        "id": 3,
        "name": "小王",
        "title": "小王职称（更新后）",
        "introduction": "小王医生介绍...（更新后）",
        "avatar_url": "头像url（更新后）",
        "type": "doctor"
    }
}
```

**错误响应**
- **404 Not Found** (医生资料卡不存在)
```json
{
    "code": 404,
    "message": "医生资料卡不存在"
}
```

---

#### 5. 删除医生资料卡

**删除指定医生资料卡**

- **URL**: `/api/doctors/<int:pk>/`  
**（注）：此处 `pk`指的是相应医生的`id`**
- **Method**: `DELETE`  
- **权限**: 需要管理员权限  
- **Headers**:  
  ```
  Authorization: Bearer <access_token>
  ```

**成功响应 (204 No Content)**
```json
{
    "code": 204,
    "message": "删除成功",
    "data": {
        "id": 2,
        "deleted_at": "2025-04-08T12:16:45.789012Z",
        "type": "doctor"
    }
}
```

**错误响应**
- **404 Not Found** (医生资料卡不存在)
```json
{
    "code": 404,
    "message": "医生资料卡不存在"
}
```

--- 
### （3）科室板块

#### 1. 获取科室列表

**获取所有科室信息**

- **URL**: `/api/departments/`  
- **Method**: `GET`  
- **权限**: 无  
- **Content-Type**: `application/json`

**成功响应 (200 OK)**
```json
{
    "code": 200,
    "message": "获取成功",
    "type": "department",
    "data": [
        {
            "id": 1,
            "name": "内科",
            "introduction": "内科科室介绍...",
            "doctors": [],
            "created_at": "2025-04-08T12:11:18.740154Z",
            "updated_at": "2025-04-08T12:11:18.740177Z"
        },
        {
            "id": 2,
            "name": "外科",
            "introduction": "外科科室介绍...",
            "doctors": [],
            "created_at": "2025-04-08T12:11:18.740154Z",
            "updated_at": "2025-04-08T12:11:18.740177Z"
        }
    ]
}
```

---

#### 2. 创建新科室

**创建新的科室信息**

- **URL**: `/api/departments/`  
- **Method**: `POST`  
- **权限**: 需要管理员权限  
- **Headers**:  
  ```
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```

**请求参数**
| 参数名        | 类型   | 必填 | 描述          |
|---------------|--------|------|---------------|
| `name`        | string | 是   | 科室名称       |
| `introduction`| string | 是   | 科室介绍       |
| `doctor_ids`| array | 否   | 科室医生的id       |

**请求参考：**
```json
{
    "name":"test_心血管2",
    "introduction":"test_心血管2",
    "doctor_ids":[1,3]
}
```

**成功响应 (201 Created)**
```json
{
    "code": 201,
    "message": "创建成功",
    "data": {
        "id": 3,
        "name": "儿科",
        "introduction": "儿科科室介绍...",
        "doctors": [],
        "created_at": "2025-04-08T12:11:18.740154Z",
        "updated_at": "2025-04-08T12:11:18.740177Z",
        "type": "department"
    }
}
```

**错误响应**
- **400 Bad Request** (参数验证失败)
```json
{
    "code": 400,
    "message": "名称不能为空"
}
```

---

#### 3. 获取科室详情

**获取指定科室的详细信息**

- **URL**: `/api/departments/<int:pk>/`  
**（注）：此处 `pk`指的是相应科室的`id`**
- **Method**: `GET`  
- **权限**: 无  
- **Content-Type**: `application/json`

**成功响应 (200 OK)**
```json
{
    "code": 200,
    "message": "获取成功",
    "data": {
        "id": 1,
        "name": "内科",
        "introduction": "内科科室介绍...",
        "doctors": [
            {
                "id": 1,
                "name": "张医生",
                "title": "主任医师"
            }
        ],
        "created_at": "2025-04-08T12:11:18.740154Z",
        "updated_at": "2025-04-08T12:11:18.740177Z",
        "type": "department"
    }
}
```

**错误响应**
- **404 Not Found** (科室不存在)
```json
{
    "code": 404,
    "message": "科室不存在"
}
```

---

#### 4. 更新科室信息

**更新指定科室的信息**

- **URL**: `/api/departments/<int:pk>/`  
**（注）：此处 `pk`指的是相应科室的`id`**
- **Method**: `PUT`  
- **权限**: 需要管理员权限  
- **Headers**:  
  ```
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```

**请求参数**
| 参数名        | 类型   | 必填 | 描述          |
|---------------|--------|------|---------------|
| `name`        | string | 否   | 科室名称       |
| `introduction`| string | 否   | 科室介绍       |
| `doctor_ids`| array | 否   | 科室医生的id       |

**成功响应 (200 OK)**
```json
{
    "code": 200,
    "message": "更新成功",
    "data": {
        "id": 1,
        "name": "内科(更新)",
        "introduction": "更新后的介绍...",
        "doctors": [],
        "created_at": "2025-04-08T12:11:18.740154Z",
        "updated_at": "2025-04-08T12:15:30.123456Z",
        "type": "department"
    }
}
```

**错误响应**
- **404 Not Found** (科室不存在)
```json
{
    "code": 404,
    "message": "科室不存在"
}
```

---

#### 5. 删除科室

**删除指定科室**

- **URL**: `/api/departments/<int:pk>/`  
**（注）：此处 `pk`指的是相应科室的`id`**
- **Method**: `DELETE`  
- **权限**: 需要管理员权限  
- **Headers**:  
  ```
  Authorization: Bearer <access_token>
  ```

**成功响应 (204 No Content)**
```json
{
    "code": 204,
    "message": "删除成功",
    "data": {
        "id": 1,
        "deleted_at": "2025-04-08T12:16:45.789012Z",
        "type": "department"
    }
}
```

**错误响应**
- **404 Not Found** (科室不存在)
```json
{
    "code": 404,
    "message": "科室不存在"
}
```

---

### （4）排班板块

**注：**

`start_time`,`end_time`均已废弃，无视即可；

创建科室会自动创建对应科室的这个月+下个月的排班，查询对应科室的排班也会自动创建，那么实际上不需要创建/删除排班了；旧科室不会自动创建，访问对应的`/api/departments/<id>/schedules/`就好了；

获取对应科室排班的话直接获取这个月+下个月两个月的排班；

#### 1. 获取排班列表

**获取所有排班信息（支持按周期过滤）**

- **URL**: `/api/schedules/`  
- **Method**: `GET`  
- **权限**: 无  

**成功响应 (200 OK)**
```json
{
    "code": 200,
    "message": "获取成功",
    "type": "schedule",
    "data": [
        {
            "id": 1,
            "department": 10,
            "date": "2024-05-01",
            "is_scheduled": true,
            "start_time": "08:00:00",
            "end_time": "12:00:00",
            "doctors": [1, 2],
            "created_at": "2024-04-01T00:00:00Z",
            "updated_at": "2024-04-01T00:00:00Z"
        },
        // ...
    ]
}
```
---

#### 2. 获取排班详情

**获取指定排班的详细信息**

- **URL**: `/api/schedules/<id>/`  
- **Method**: `GET`  
- **权限**: 无  

注：`<id>`为排班对象的id。

**成功响应 (200 OK)**
```json
{
    "code": 200,
    "message": "更新成功",
    "data": {
        "id": 1,
        "department": "内科",
        "date": "2024-05-01",
        "is_scheduled": true,
        "doctors": [
            {
                "id": 1,
                "name": "张医生",
                "title": "主任医师",
                "avatar_url": null,
                "introduction": "个人介绍"
            },
            {
                "id": 2,
                "name": "李医生",
                "title": "主任医师",
                "avatar_url": null,
                "introduction": "个人介绍"
            }
        ],
        "created_at": "2024-04-01T00:00:00Z",
        "updated_at": "2024-04-01T00:00:00Z",
        "type": "schedule"
    }
}
```

---

#### 3. 更新排班

**更新排班信息（支持应用到未来周期排班）**

- **URL**: `/api/schedules/<id>/`  
- **Method**: `PUT`  
- **权限**: 需要管理员权限  
- **请求参数**:

注：`<id>`为排班对象的id。
  ```json
  {
      "is_scheduled": true, 
      "doctors": [1,2],
  }
  ```

**成功响应 (200 OK)**
```json
{
    "code": 200,
    "message": "更新成功",
    "data": {
        "id": 1,
        "department": "内科",
        "date": "2024-05-01",
        "is_scheduled": true,
        "start_time": "09:00:00",
        "doctors": [
            {
                "id": 1,
                "name": "张医生",
                "title": "主任医师",
                "avatar_url": null,
                "introduction": "个人介绍"
            },
            {
                "id": 2,
                "name": "李医生",
                "title": "主任医师",
                "avatar_url": null,
                "introduction": "个人介绍"
            }
        ],
        "updated_at": "2024-04-02T00:00:00Z"
    }
}
```

---

#### 4. 获取科室排班（这个月+下个月）

**获取指定科室这个月+下个月的排班（自动生成排班对象）**

- **URL**: `/api/departments/<id>/schedules/`  
- **Method**: `GET`  
- **权限**: 无  

注：`<id>`为科室的id。

**成功响应 (200 OK)**
```json
{
    "code": 200,
    "message": "获取成功",
    "data": [
        {
            "id": 1, //排班对象的id
            "date": "2025-04-01",
            "is_scheduled": true,
            "doctors": [
                {
                    "id": 3,
                    "name": "张医生",
                    "title": "主任医师",
                    "avatar_url": null,
                    "introduction": "个人介绍"
                },
                {
                    "id": 4,
                    "name": "李医生",
                    "title": "主任医师",
                    "avatar_url": null,
                    "introduction": "个人介绍"
                }
            ]
        },
        {
            "id": 2,
            "date": "2025-04-02",
            "is_scheduled": false,
            "doctors": []
        },
        // 获取的日期是从本月的第一天到下个月的最后一天，比如4-01到5-31
    ]
}
```

--- 
## （5）文章板块

注：文章的`article_type`
```
ARTICLE_TYPES = (
        ('notice', '通知公告'),
        ('science', '健康科普'),
        ('news', '医院新闻'),
        ('guide','服务指南')
    )
```

#### 1. 获取文章列表

**分页获取文章**

- **URL**: `/api/articles?size=size&index=index&type=type/`  
- **Method**: `GET`  
- **权限**: 无  
- **Content-Type**: `application/json`

**请求参数**
| 参数名        | 类型   | 必填 | 描述          |
|---------------|--------|------|---------------|
| `size`        | string | 否   | 页面大小，默认为10       |
| `index`| string | 否   | 当前页码，默认为1      |
| `type`| string | 否   | 查询文章的类型，无则返回全部文章      |


**成功响应 (200 OK)**
```json
{
    "code": 200,
    "message": "获取成功",
    "data": {
        "article_list": [
            {
                "id": 11,
                "article_type": "news",
                "is_pinned": false,
                "is_reproduced": false,
                "image_url": null,
                "title": "新年第一天，医疗服务不休息!",
                "url": "https://hq.qd.sdu.edu.cn/info/1020/2454.htm",
                "created_at": "2025-05-01T07:39:54.893804Z"
            },
            {
                "id": 10,
                "article_type": "news",
                "is_pinned": false,
                "is_reproduced": false,
                "image_url": null,
                "title": "校区领导慰问女职工，共迎“三八”妇女节",
                "url": "https://hq.qd.sdu.edu.cn/info/1020/2518.htm",
                "created_at": "2025-05-01T07:05:42.673621Z"
            },
            {
                "id": 3,
                "article_type": "news",
                "is_pinned": false,
                "is_reproduced": true,
                "image_url": null,
                "title": "眼",
                "url": null,
                "created_at": "2025-04-10T02:45:23.444922Z"
            },
            {
                "id": 2,
                "article_type": "news",
                "is_pinned": false,
                "is_reproduced": false,
                "image_url": null,
                "title": "山东大学青岛校区校医院迎来学校领导视察慰问",
                "url": "https://hq.qd.sdu.edu.cn/info/1020/2470.htm",
                "created_at": "2025-04-10T01:08:06.364410Z"
            }
        ],
        "total_pages": 1,
        "current_page": 1,
        "type": "article"
    }
}
```
**错误响应**
- **400 Bad Request** (参数验证失败)
```json
{
    "code": 400,
    "message": "未指定文章类型/页码格式不符合规范，非整数/页面大小格式不符合规范，非整数"
}
```
---

#### 2. 创建文章

**创建新的文章**

- **URL**: `/api/articles/`  
- **Method**: `POST`  
- **权限**: 需要管理员权限  
- **Headers**:  
  ```
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```

**请求参数**
| 参数名        | 类型   | 必填 | 描述          |
|---------------|--------|------|---------------|
| `article_type`        | string | 是   | 文章类型       |
| `title`| string | 是   | 文章标题      |
| `image_url`        | string | 否   | 文章封面的URL       |
| `url`        | string | 否   | 转载文章的URL       |
| `is_pinned`| bool | 否   | 文章是否置顶       |
| `is_reproduced`| bool | 否   | 文章是否为转载文章       |

**成功响应 (201 Created)**
```json
{
    "code": 201,
    "message": "创建成功",
    "data": {
        "id": 13,
        "article_type": "news",
        "is_pinned": false,
        "is_reproduced": false,
        "image_url": null,
        "title": "寒假不“打烊”，校医院的温暖守护",
        "url": "https://hq.qd.sdu.edu.cn/info/1020/2480.htm",
        "created_at": "2025-05-01T07:55:53.749631Z",
        "type": "article"
    }
}
```

**错误响应**
- **400 Bad Request** (参数验证失败)
```json
{
    "code": 400,
    "message": "标题不能为空"
}
```

---

#### 3. 获取文章详情

**获取指定文章的详细信息**

- **URL**: `/api/articles/<int:pk>/`  
**（注）：此处 `pk`指的是相应文章的`id`**
- **Method**: `GET`  
- **权限**: 无  
- **Content-Type**: `application/json`

**成功响应 (200 OK)**
```json
{
    "code": 200,
    "message": "获取成功",
    "data": {
        "id": 11,
        "article_type": "news",
        "is_pinned": false,
        "is_reproduced": false,
        "image_url": null,
        "title": "新年第一天，医疗服务不休息!",
        "url": "https://hq.qd.sdu.edu.cn/info/1020/2454.htm",
        "created_at": "2025-05-01T07:39:54.893804Z",
        "type": "article"
    }
}
```

**错误响应**
- **404 Not Found** (文章不存在)
```json
{
    "code": 404,
    "message": "文章不存在"
}
```

---

#### 4. 更新文章信息

**更新指定文章的信息**

- **URL**: `/api/articles/<int:pk>/`  
**（注）：此处 `pk`指的是相应文章的`id`**
- **Method**: `PUT`  
- **权限**: 需要管理员权限  
- **Headers**:  
  ```
  Authorization: Bearer <access_token>
  Content-Type: application/json
  ```

**请求参数**
| 参数名        | 类型   | 必填 | 描述          |
|---------------|--------|------|---------------|
| `article_type`        | string | 否   | 文章类型       |
| `title`| string | 否   | 文章标题      |
| `image_url`        | string | 否   | 文章封面的URL       |
| `url`        | string | 否   | 转载文章的URL       |
| `is_reproduced`   | bool | 否   | 文章是否为转载文章       |
| `is_pinned`| bool | 否   | 文章是否置顶       |

**成功响应 (200 OK)**
```json
{
    "code": 200,
    "message": "更新成功",
    "data": {
        "id": 2,
        "article_type": "news",
        "is_pinned": false,
        "is_reproduced": false,
        "image_url": null,
        "title": "山东大学青岛校区校医院迎来学校领导视察慰问",
        "url": "https://hq.qd.sdu.edu.cn/info/1020/2470.htm",
        "created_at": "2025-04-10T01:08:06.364410Z",
        "type": "article"
    }
}
```

**错误响应**
- **404 Not Found** (文章不存在)
```json
{
    "code": 404,
    "message": "文章不存在"
}
```

---

#### 5. 删除文章

**删除指定文章**

- **URL**: `/api/articles/<int:pk>/`  
**（注）：此处 `pk`指的是相应文章的`id`**
- **Method**: `DELETE`  
- **权限**: 需要管理员权限  
- **Headers**:  
  ```
  Authorization: Bearer <access_token>
  ```

**成功响应 (204 No Content)**
```json
{
    "code": 204,
    "message": "删除成功",
    "data": {
        "id": 12,
        "deleted_at": "2025-05-01T07:42:05.889606+00:00",
        "type": "article"
    }
}
```

**错误响应**
- **404 Not Found** (文章不存在)
```json
{
    "code": 404,
    "message": "文章不存在"
}
```

--- 
--- 
## （5）默认排班板块

Many BUG：这段代码写得极其抽象，每次创建排版规则时会将旧规则删除，但是和先前相比不变的星期里面的医生安排不会改变。可能有很多异常没有除理，并且缺少注释，后续把注释补充上（

#### 1. 获取默认排班规则

**获取全部默认规则**

- **URL**: `/api/default-schedules/`  
- **Method**: `GET`  
- **权限**: 需要管理员权限  
- **Headers**:  
  ```
  Authorization: Bearer <access_token>
  ```
**成功响应 (200 OK)**
```json
{
    "code": 200,
    "message": "获取成功",
    "data": [
        {
            "id": 104,
            "department": 31,
            "dates_list": [
                5
            ]
        },
        {
            "id": 105,
            "department": 30,
            "dates_list": [
                1,
                3
            ]
        }
    ],
    "type": "default_schedule_rule"
}
```
---
#### 2. 创建默认排班规则

- **URL**: `/api/default-schedules/`  
- **Method**: `POST`  
- **权限**: 需要管理员权限  
- **Headers**:  
  ```
  Authorization: Bearer <access_token>
  ```
**请求参数**
| 参数名        | 类型   | 必填 | 描述          |
|---------------|--------|------|---------------|
| `departments`        | list | 是   | 一个整数列表，存储科室id       |
| `schedules`| dict | 是   | 一个字典对象，存储日程数据，以科室id为键值，     |

其中`schedules`的每个键值对存储的数据如下
| 参数名        | 类型   | 必填 | 描述          |
|---------------|--------|------|---------------|
| `department`        | int | 是   | 科室id       |
| `dates`| string | 否   | 一个代表日程安排的字符串，以逗号分割0-6之间的整数     |

**请求参数示例**
```json
{
    "departments": [
        30,
        31
    ],
    "schedules": {
        "30": [
            {
                "department": 30,
                "dates": "1,3"
            }
        ],
        "31": [
            {
                "department": 31,
                "dates": "5"
            }
        ]
    }
}
```
**成功响应 (200 OK)**
```json
{
    "code": 200,
    "message": "创建成功",
    "data": [
        {
            "id": 104,
            "department": 31,
            "dates_list": [
                5
            ]
        },
        {
            "id": 105,
            "department": 30,
            "dates_list": [
                1,
                3
            ]
        }
    ],
    "type": "default_schedule_rule"
}
```
**错误响应**
- **400 Bad Request** （请求参数缺失）
```json
{
    "code": 400,
    "error": {
        "departments": [
            "This field is required."
        ]
    }
}
```
#### 3. 获取默认排班规则详情

**获取某一天默认规则详情**

- **URL**: `/api/default-schedules/<int:pk>?date=date/`  
- **Method**: `GET`  
- **权限**: 需要管理员权限  
- **Headers**:  
  ```
  Authorization: Bearer <access_token>
  ```

**请求参数**
| 参数名        | 类型   | 必填 | 描述          |
|---------------|--------|------|---------------|
| `date`        | string | 否   | 所查看的某星期排班情况，默认为默认排班计划中最早的一天，如果无计划则返回空列表       |

**成功响应 (200 OK)**
```json
{
    "code": 200,
    "message": "获取成功",
    "data": [
        {
            "id": 104,
            "department": 31,
            "dates_list": [
                5
            ]
        },
        {
            "id": 105,
            "department": 30,
            "dates_list": [
                1,
                3
            ]
        }
    ],
    "type": "default_schedule_rule"
}
```
**错误响应**
- **404 Not Found** （查找的对象不存在）
```json
{
    "code": 404,
    "error": "查找的默认日程不存在"
}
```
---
#### 4. 修改默认排班详情

- **URL**: `/api/default-schedules/<int:pk>/`  
- **Method**: `PUT`  
- **权限**: 需要管理员权限  
- **Headers**:  
  ```
  Authorization: Bearer <access_token>
  ```

**请求参数**
| 参数名        | 类型   | 必填 | 描述          |
|---------------|--------|------|---------------|
| `date`| int | 是   | 所查询的星期     |
| `doctor_ids`| list | 否   | 当天的默认医生的id列表     |

**请求参数示例**
```json
{
    "rule": 104,
    "date": 5,
    "doctors": [23,24,25]
}
```
**成功响应 (200 OK)**
```json
{
    "code": 200,
    "message": "更新成功",
    "data": {
        "id": 67,
        "rule": 104,
        "date": 5,
        "doctors": [
            {
                "id": 25,
                "name": "1",
                "title": "1",
                "avatar_url": null,
                "introduction": "1"
            },
            {
                "id": 24,
                "name": "1",
                "title": "1",
                "avatar_url": null,
                "introduction": "1"
            },
            {
                "id": 23,
                "name": "3",
                "title": "3",
                "avatar_url": null,
                "introduction": "2"
            }
        ],
        "type": "default_schedule"
    }
}
```
**错误响应**
- **400 Bad Request** （请求参数缺失）
```json
{
    "code": 400,
    "message": "星期格式不符合规范，非整数"
}
```
- **404 Not Found** （查找的对象不存在）
```json
{
    "code": 404,
    "error": "查找的默认日程不存在"
}
```
---
## TODO

## 反馈与待修改
