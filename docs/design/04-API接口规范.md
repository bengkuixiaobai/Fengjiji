# 风迹集 — API 接口规范

> 版本：v1.0 | 更新日期：2026-06-30
> 协议：RESTful | 数据格式：JSON | 根路径：`/api`

---

## 目录

1. [通用规范](#1-通用规范)
2. [认证模块](#2-认证模块)
3. [用户模块](#3-用户模块)
4. [文章模块](#4-文章模块)
5. [分类模块](#5-分类模块)
6. [标签模块](#6-标签模块)
7. [项目模块](#7-项目模块)
8. [签到模块](#8-签到模块)
9. [统计模块](#9-统计模块)
10. [文件上传](#10-文件上传)
11. [健康检查](#11-健康检查)

---

## 1. 通用规范

### 1.1 统一响应格式

**成功响应**：

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

**错误响应**：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "人类可读的错误信息"
  }
}
```

### 1.2 HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| `200` | 成功 |
| `201` | 创建成功 |
| `400` | 请求参数错误 |
| `401` | 未授权（Token 缺失/无效/过期） |
| `403` | 禁止访问（无权限） |
| `404` | 资源不存在 |
| `409` | 资源冲突（如用户名已存在） |
| `429` | 请求过于频繁（限流） |
| `500` | 服务器内部错误 |

### 1.3 错误码

| 错误码 | HTTP 状态 | 说明 |
|--------|-----------|------|
| `UNAUTHORIZED` | 401 | 未登录或 Token 无效 |
| `FORBIDDEN` | 403 | 无操作权限 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `VALIDATION_ERROR` | 400 | 参数校验失败 |
| `CONFLICT` | 409 | 资源冲突 |
| `RATE_LIMIT` | 429 | 请求频率过高 |
| `INVALID_CREDENTIALS` | 401 | 用户名/密码错误 |
| `INVITE_INVALID` | 400 | 邀请码无效 |
| `INVITE_USED` | 400 | 邀请码已被使用 |
| `SERVER_ERROR` | 500 | 服务器内部错误 |

### 1.4 认证方式

Header 传参：

```
Authorization: Bearer <access_token>
```

### 1.5 分页参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码（从 1 开始） |
| `limit` | number | 10 | 每页条数（最大 50） |

分页响应：

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5
    }
  }
}
```

---

## 2. 认证模块

### POST /auth/register

注册新用户。

**Request Body**：

```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "password123",
  "inviteCode": "FENGJI2026"
}
```

**验证规则**：
- `username` — 字母数字，3-20 字符
- `email` — 合法邮箱格式
- `password` — 至少 6 字符
- `inviteCode` — 必填，需是有效的未使用邀请码

**Response `201`**：

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "nickname": "admin",
      "role": "admin",
      "createdAt": "2026-06-30T10:00:00Z"
    },
    "token": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

**Error**：`409` — 用户名/邮箱已存在 | `400` — 邀请码无效/已使用

---

### POST /auth/login

用户登录。

**Request Body**：

```json
{
  "usernameOrEmail": "admin",
  "password": "password123"
}
```

**Response `200`**：

```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "username": "admin", ... },
    "token": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

**Error**：`401` — 用户名/邮箱或密码错误 | `429` — 请求过于频繁

---

### POST /auth/refresh

刷新 Access Token。

**Request Body**：

```json
{
  "refreshToken": "eyJhbG..."
}
```

**Response `200`**：

```json
{
  "success": true,
  "data": {
    "token": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

---

### POST /auth/logout

登出（后端预留 token 黑名单扩展，当前仅返回成功）。

**Auth**：需登录

**Response `200`**：

```json
{
  "success": true,
  "message": "登出成功"
}
```

---

## 3. 用户模块

### GET /users/me

获取当前登录用户信息。

**Auth**：需登录

**Response `200`**：

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "nickname": "风迹集主",
    "avatar": null,
    "bio": null,
    "role": "admin",
    "createdAt": "2026-06-30T10:00:00Z",
    "updatedAt": "2026-06-30T10:00:00Z"
  }
}
```

---

### PUT /users/me

更新个人资料。

**Auth**：需登录

**Request Body**：

```json
{
  "nickname": "新昵称",
  "avatar": "https://example.com/avatar.jpg",
  "bio": "个人简介（不超过 500 字）"
}
```

所有字段可选。

---

### PUT /users/me/password

修改密码。

**Auth**：需登录

**Request Body**：

```json
{
  "oldPassword": "旧密码",
  "newPassword": "新密码（至少 6 位）"
}
```

---

## 4. 文章模块

### GET /posts

获取文章列表。

**Query Parameters**：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | — |
| `limit` | number | 10 | — |
| `categoryId` | number | — | 按分类筛选 |
| `tagId` | number | — | 按标签筛选 |
| `status` | string | `published` | `published` / `draft` / 空（全部） |
| `authorId` | number | — | 按作者筛选 |
| `search` | string | — | 标题/摘要搜索（LIKE） |
| `orderBy` | string | `createdAt` | `createdAt` / `views` / `likes` |
| `order` | string | `desc` | `asc` / `desc` |

**Response `200`**：

```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "文章标题",
        "slug": "article-slug",
        "summary": "摘要内容",
        "coverImage": null,
        "viewCount": 42,
        "likeCount": 5,
        "status": "published",
        "createdAt": "2026-06-30T10:00:00Z",
        "publishedAt": "2026-06-30T10:00:00Z",
        "author": { "id": 1, "username": "admin", "nickname": "风迹集主", "avatar": null },
        "category": { "id": 1, "name": "技术", "slug": "tech" },
        "tags": [
          { "id": 1, "name": "React", "slug": "react" }
        ]
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
  }
}
```

---

### GET /posts/:id

获取文章详情（id 或 slug 均可）。

> 注意：调用此接口会自动增加 `viewCount`（+1）。前端应先显示文章内容，再异步调用此接口记录阅读量。

**Response `200`**：

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "文章标题",
    "slug": "article-slug",
    "summary": "...",
    "content": "# Markdown 正文...",
    "coverImage": null,
    "viewCount": 43,
    "likeCount": 5,
    "status": "published",
    "createdAt": "2026-06-30T10:00:00Z",
    "publishedAt": "2026-06-30T10:00:00Z",
    "author": { ... },
    "category": { ... },
    "tags": [ ... ],
    "project": { "id": 1, "name": "风迹集" }
  }
}
```

---

### POST /posts

创建文章。

**Auth**：需登录

**Request Body**：

```json
{
  "title": "文章标题",
  "slug": "article-slug",
  "summary": "摘要（可选）",
  "content": "# Markdown 正文",
  "coverImage": "https://...（可选）",
  "categoryId": 1,
  "tagIds": [1, 2],
  "status": "draft",
  "projectId": 1
}
```

---

### PUT /posts/:id

更新文章。

**Auth**：需登录（仅作者可编辑）

同创建的结构，所有字段可选。

---

### DELETE /posts/:id

删除文章（软删除，设置 `is_deleted = true`）。

**Auth**：需登录（仅作者可删除）

---

### POST /posts/:id/view

记录阅读量（同一访客 30 分钟内只计一次）。

**Headers**：`X-Visitor-Id`（前端生成持久化 ID，缺省用 'anon'）

**Response `200`**：

```json
{
  "success": true,
  "data": { "viewCount": 44 }
}
```

---

### POST /posts/:id/like/toggle

切换点赞状态。

**Headers**：`X-Visitor-Id`

**Response `200`**（点赞成功）：

```json
{
  "success": true,
  "data": { "liked": true, "likeCount": 6 }
}
```

**Response `200`**（取消点赞）：

```json
{
  "success": true,
  "data": { "liked": false, "likeCount": 5 }
}
```

---

### GET /posts/:id/like/status

获取当前访客的点赞状态。

**Headers**：`X-Visitor-Id`

**Response `200`**：

```json
{
  "success": true,
  "data": { "liked": true, "likeCount": 5 }
}
```

---

### GET /posts/:id/adjacent

获取上下篇文章（同分类按发布时间）。

**Response `200`**：

```json
{
  "success": true,
  "data": {
    "prev": { "id": 0, "title": "上一篇标题", "slug": "prev-slug", "createdAt": "..." },
    "next": { "id": 2, "title": "下一篇标题", "slug": "next-slug", "createdAt": "..." }
  }
}
```

`prev` 或 `next` 可能为 `null`（没有上/下篇时）。

---

## 5. 分类模块

### GET /categories

获取全部分类列表。

**Response `200`**：

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "技术",
      "slug": "tech",
      "description": null,
      "sortOrder": 0,
      "_count": { "posts": 12 }
    }
  ]
}
```

### POST /categories

创建分类。

**Auth**：需登录

**Request Body**：

```json
{ "name": "技术" }
```

### DELETE /categories/:id

删除分类。属于该分类的文章会自动设为未分类（`categoryId = null`）。

**Auth**：需登录

### GET /categories/:id

获取分类详情（含文章数量）。

---

## 6. 标签模块

### GET /tags

获取全部标签列表。

**Response**：

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "React", "slug": "react", "_count": { "posts": 5 } }
  ]
}
```

### POST /tags

创建标签。

**Auth**：需登录

**Request Body**：

```json
{ "name": "React" }
```

---

## 7. 项目模块

### GET /projects

获取项目列表。

**Query Parameters**：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | — |
| `limit` | number | 10 | — |
| `status` | string | — | `planning` / `in_progress` / `completed` |
| `isPublic` | boolean | `true` | 是否公开 |
| `search` | string | — | 名称/描述搜索 |

**Response `200`**：

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": 1,
        "name": "风迹集",
        "description": "个人博客系统",
        "techStack": ["React", "TypeScript", "Express"],
        "plan": [{ "what": "需求分析", "time": "2天", "weight": 20 }],
        "codeUrl": "https://github.com/...",
        "demoUrl": null,
        "status": "in_progress",
        "completionRate": 65,
        "isPublic": true,
        "startDate": "2026-04-15T00:00:00Z",
        "expectedEndDate": "2026-09-30T00:00:00Z",
        "bufferDays": 7,
        "createdAt": "2026-04-14T00:00:00Z",
        "completedAt": null,
        "author": { "id": 1, "username": "admin", "nickname": "风迹集主" },
        "stagesCount": 3,
        "tasksCompletedCount": 8,
        "postsCount": 2
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 5, "totalPages": 1 }
  }
}
```

### GET /projects/:id

获取项目详情（含阶段、任务、关联文章）。

### POST /projects

创建项目。

**Auth**：需登录

**Request Body**：

```json
{
  "name": "项目名称",
  "description": "项目描述",
  "techStack": ["React", "Node.js"],
  "codeUrl": "https://github.com/owner/repo",
  "demoUrl": "https://demo.com",
  "status": "planning",
  "isPublic": true,
  "startDate": "2026-04-15T00:00:00Z",
  "expectedEndDate": "2026-09-30T00:00:00Z",
  "bufferDays": 7,
  "plan": [{ "what": "需求分析", "time": "2天", "weight": 20 }]
}
```

### PUT /projects/:id

更新项目。

**Auth**：需登录（仅作者可编辑）

### DELETE /projects/:id

删除项目（物理删除，级联删除关联的阶段和任务）。

**Auth**：需登录（仅作者可删除）

---

## 8. 签到模块

### GET /checkins

获取签到记录。

**Auth**：需登录

**Query Parameters**：

| 参数 | 类型 | 说明 |
|------|------|------|
| `year` | number | 年份 |
| `month` | number | 月份（1-12） |

**Response `200`**：

```json
{
  "success": true,
  "data": {
    "dates": ["2026-06-01", "2026-06-02", "2026-06-05"],
    "total": 3
  }
}
```

### POST /checkins

签到。

**Auth**：需登录

**Request Body**：

```json
{ "date": "2026-06-30" }
```

**Error**：`409` — 今日已签到

### GET /checkins/stats

获取签到统计。

**Auth**：需登录

**Response `200`**：

```json
{
  "success": true,
  "data": {
    "totalDays": 42,
    "thisMonthDays": 15
  }
}
```

---

## 9. 统计模块

### GET /stats/dashboard

获取仪表盘统计数据。

**Auth**：需登录

**Response `200`**：

```json
{
  "success": true,
  "data": {
    "postsCount": 12,
    "projectsCount": 3,
    "checkinsCount": 42,
    "totalViews": 6023
  }
}
```

---

## 10. 文件上传

### POST /upload

上传图片。

**Auth**：需登录

**Request**：`multipart/form-data`

| 字段 | 类型 | 说明 |
|------|------|------|
| `image` | File | 图片文件（jpg/png/gif/webp/svg） |

**限制**：
- 最大 5MB
- 仅支持 jpg / png / gif / webp / svg（扩展名 + MIME 魔数双重校验）

**Response `200`**：

```json
{
  "success": true,
  "data": {
    "url": "/uploads/1688111111111-123456789.jpg",
    "filename": "1688111111111-123456789.jpg"
  }
}
```

---

## 11. 健康检查

### GET /health

服务健康检查。

**Response `200`**：

```json
{
  "success": true,
  "message": "服务器运行正常",
  "timestamp": "2026-06-30T10:00:00.000Z"
}
```

---

## 附录：前后端接口对应表

| 前端页面 | 调用的 API |
|----------|-----------|
| 登录页 | `POST /auth/login`, `POST /auth/register` |
| 首页 Dashboard | `GET /posts`, `GET /projects`, `GET /categories`, `GET /checkins`, `GET /stats/dashboard` |
| 博客列表 | `GET /posts` |
| 博客详情 | `GET /posts/:id`, `POST /posts/:id/view`, `POST /posts/:id/like/toggle`, `GET /posts/:id/like/status`, `GET /posts/:id/adjacent` |
| 博客管理 | `GET /posts`, `PUT /posts/:id`, `DELETE /posts/:id`, `GET /categories`, `POST /categories` |
| 博客编辑 | `GET /posts/:id`, `POST /posts`, `PUT /posts/:id`, `POST /upload` |
| 项目展示 | `GET /projects` |
| 项目详情 | `GET /projects/:id` |
| 项目管理 | `GET /projects`, `POST /projects`, `PUT /projects/:id`, `DELETE /projects/:id` |
| 项目创建 | `POST /projects` |
| 个人中心 | `GET /users/me`, `PUT /users/me`, `PUT /users/me/password` |
| 签到 | `GET /checkins`, `POST /checkins`, `GET /checkins/stats` |
