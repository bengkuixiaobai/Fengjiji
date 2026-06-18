# 风迹集 - 产品需求文档 (PRD)

| 属性 | 内容 |
|------|------|
| 项目名称 | 风迹集 |
| 项目类型 | 前后端分离 - 个人博客 + 项目管理平台 |
| 核心用户 | 博主本人 |
| 文档版本 | v1.0 |
| 创建日期 | 2026/04/14 |
| 更新日期 | 2026/04/14 |

---

## 一、项目概述

### 1.1 项目愿景

**风迹集**是一个个人博客与项目管理系统，用于：

1. **博客展示** - 记录技术思考、分享项目经验、沉淀个人知识
2. **项目进度管理** - 可视化追踪个人项目的开发进度，分阶段规划

> "风过留痕，迹存于心" — 每一份努力都会留下痕迹

### 1.2 核心价值

| 需求 | 解决方案 |
|------|----------|
| 博客展示 | 个人作品集页面，支持分类、索引、Markdown 编写 |
| 项目追踪 | 看板管理 + 完成度统计 |
| 互动交流 | 点赞、分享功能 |
| 内容沉淀 | 每年约 20 篇新文章，分类管理 |

---

## 二、用户角色

| 角色 | 权限 | 说明 |
|------|------|------|
| 博主 (Admin) | 全部 | 管理博客、项目、账户设置 |
| 访客 (Visitor) | 浏览/互动 | 查看博客、点赞、分享 |

---

## 三、功能模块详细说明

### 3.1 登录模块

| 属性 | 说明 |
|------|------|
| 功能描述 | 用户登录/注册系统 |
| 角色 | 博主本人 |
| 登录方式 | 用户名 + 密码 |
| 安全要求 | JWT Token 认证 |
| 后续扩展 | 可扩展第三方登录 |

#### 用户故事
> 博主打开网站，输入账号密码，即可进入管理后台，发表博客或管理项目。

#### 功能流程

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐
│  访问   │ ──►  │  登录页      │ ──► │  注册页     │
│  登录页 │      │  (GET)      │     │  (POST)    │
└─────────┘     └──────┬──────┘     └──────┬──────┘
                       │                    │
                       ▼                    ▼
              ┌────────────────┐   ┌───────────────┐
              │  登录成功        │   │  注册成功     │
              │  返回 Token     │   │  自动登录    │
              │  跳转首页        │   │  返回 Token  │
              └────────────────┘   └───────────────┘
```

#### 登录流程详细步骤

| 步骤 | 操作 | 系统响应 | 异常处理 |
|------|------|----------|----------|
| 1 | 用户输入邮箱/密码 | - | 字段校验，密码不少于 6 位 |
| 2 | 点击登录 | 发送 POST /api/auth/login | 网络错误时显示重试按钮 |
| 3 | 后端验证密码 | - | 密码错误返回 401 |
| 4 | 生成 JWT Token | 返回 {token, refreshToken} | - |
| 5 | 前端存储 Token | 存 localStorage/HttpOnly Cookie | - |
| 6 | 跳转首页 | 显示登录状态 | - |

#### 注册流程详细步骤

| 步骤 | 操作 | 系统响应 | 异常处理 |
|------|------|----------|----------|
| 1 | 用户输入用户名/邮箱/密码 | - | 字段校验，邮箱格式验证 |
| 2 | 点击注册 | 发送 POST /api/auth/register | 网络错误时显示重试按钮 |
| 3 | 后端检查用户是否存在 | - | 存在返回 409 Conflict |
| 4 | 密码加密存储 | - | - |
| 5 | 创建用户记录 | - | - |
| 6 | 自动登录，生成 Token | 返回 {token, refreshToken} | - |
| 7 | 跳转设置页 | 引导完善个人信息 | - |

#### Token 刷新机制

```
┌──────────┐    请求 API     ┌──────────┐
│  前端    │ ──────────────► │  后端    │
│          │                 │          │
│  存 Token│◄────────────── │  验证    │
│  +Refresh│   Token 无效    │  Token   │
└──────────┘                 └────┬─────┘
      │                          │
      │  POST /auth/refresh      │
      │ ───────────────────────►│
      │                          │
      │  返回新 Token            │
      │◄─────────────────────── │
      │                          │
      ▼                          ▼
```

---

### 3.2 博客展示模块

| 属性 | 说明 |
|------|------|
| 功能描述 | 展示博客文章列表和详情 |
| 展示内容 | 标题、摘要、封面图、发布日期、阅读量、点赞数 |
| 列表样式 | 支持列表视图 |
| 排序规则 | 按发布时间倒序 |

#### 用户故事
> 访客打开博客列表页，点击感兴趣的文章，阅读完整内容，并进行点赞或分享。

#### 博客列表页流程

```
┌─────────────┐    GET /api/posts?page=1&limit=10    ┌─────────────┐
│  博客列表页  │ ───────────────────────────────────► │   后端      │
│  (首页)     │                                     │             │
│             │◄─────────────────────────────────── │  返回文章    │
│  展示文章   │         {posts[], total, page}       │  列表数据   │
│  卡片列表   │                                     │             │
└─────────────┘                                     └─────────────┘
        │
        │ 点击文章
        ▼
┌─────────────┐    GET /api/posts/:slug              ┌─────────────┐
│  文章详情页   │ ───────────────────────────────────► │   后端      │
│             │                                      │             │
│  渲染 MD     │◄─────────────────────────────────── │  返回文章   │
│  代码高亮     │       {post: {title, content...}}   │  详情数据   │
│  显示互动     │                                     │             │
└─────────────┘                                     └─────────────┘
```

#### 博客列表 API 详细参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 当前页码 |
| limit | number | 10 | 每页数量 |
| category | string | - | 按分类过滤（slug） |
| tag | string | - | 按标签过滤（slug） |
| status | string | published | 草稿/发布状态 |

#### 文章详情页功能

| 功能 | 说明 |
|------|------|
| Markdown 渲染 | 完整支持 Markdown 语法 |
| 代码高亮 | Prism.js 实现，60+ 语言支持 |
| 阅读量统计 | 每次访问 +1 |
| 点赞按钮 | 显示状态，可点击切换 |
| 分享按钮 | 复制链接到剪贴板 |
| 相关项目 | 底部展示关联项目卡片 |
| 上一篇/下一篇 | 按发布时间导航 |

#### 异常处理

| 场景 | 系统响应 |
|------|----------|
| 文章不存在 | 返回 404，提示"文章不存在" |
| 文章未发布（访客访问） | 返回 404（隐藏草稿） |
| 网络错误 | 显示错误提示，提供重试按钮 |

---

### 3.3 博客撰写模块

| 属性 | 说明 |
|------|------|
| 编辑器 | Markdown 编辑器（支持实时预览） |
| 支持内容 | 文字、图片、代码块、视频链接 |
| 自动保存 | 草稿自动保存（每 30 秒） |
| 发布状态 | 草稿 / 已发布 |

#### 博客撰写流程

```
┌─────────────┐                                    ┌─────────────┐
│  撰写页面   │                                      │   后端      │
│             │                                    │             │
│  左侧编辑器 │  POST /api/posts (草稿)               │             │
│  ◄──────►   │ ─────────────────────────────────► │  保存草稿     │
│  右侧预览   │                                      │             │
│             │                                     │             │
└─────────────┘                                     └─────────────┘
        │
        │ 填写元数据
        │ - 标题
        │ - 分类
        │ - 标签
        │ - 封面图
        │ - 关联项目
        ▼
┌─────────────────────────────────────────────────────────────┐
│                      发布/更新文章                          │
│    PUT /api/posts/:id   {title, content, category_id...}  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  更新成功       │
                     │  跳转详情页     │
                     └─────────────────┘
```

#### 文章元数据

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| title | ✅ | string | 文章标题，2-100 字符 |
| slug | ✅ | string | URL 标识，自动生成或自定义 |
| summary | ❌ | string | 文章摘要，0-500 字符 |
| content | ✅ | string | Markdown 正文 |
| cover_image | ❌ | string | 封面图 URL |
| category_id | ✅ | number | 所属分类 ID |
| tags | ❌ | number[] | 标签 ID 数组 |
| project_id | ❌ | number | 关联项目 ID |
| status | ✅ | enum | draft / published |
| published_at | ❌ | date | 定时发布时间 |

#### 自动保存机制

| 触发条件 | 行为 | 提示 |
|----------|------|------|
| 内容变化后 30 秒 | 自动保存草稿 | 底部显示"已自动保存" |
| 手动点击保存 | 立即保存 | 显示"保存成功" |
| 离开页面 | 未保存时提示 | "您有未保存的更改" |

#### 异常处理

| 场景 | 系统响应 |
|------|----------|
| 标题为空 | 前端表单验证提示 |
| 分类未选择 | 前端表单验证提示 |
| 保存失败 | 显示错误提示，保留内容 |
| 网络断开 | 检测到离线时提示用户 |

---

### 3.4 博客分享模块

| 属性 | 说明 |
|------|------|
| 功能描述 | 一键分享文章 |
| 分享方式 | 复制链接 |
| 扩展支持 | 可扩展更多平台 |

#### 分享流程

```
┌─────────────┐                    ┌─────────────┐
│  文章详情页 │                    │  剪贴板     │
│             │                    │             │
│  点击分享   │ ── 复制 URL ────► │  写入链接  │
│  按钮       │                    │             │
└─────────────┘                    └─────────────┘
        │
        │ 复制成功
        ▼
   "链接已复制到剪贴板"
```

#### 分享链接格式

```
https://fengjiji.com/posts/{slug}
```

---

### 3.5 博客点赞模块

| 属性 | 说明 |
|------|------|
| 功能描述 | 对文章进行点赞 |
| 限制 | 同一篇文章只能点赞一次（按 visitor_id） |
| 显示 | 显示点赞总数 |

#### 点赞流程

```
┌─────────────┐                    ┌─────────────┐
│  文章详情页 │                    │   后端      │
│             │                    │             │
│  点击点赞   │  POST /api/posts/:id/like  ───► │  记录点赞  │
│  按钮       │                    │             │
│             │◄─────────────────── │  返回新     │
│  更新 UI   │         {likeCount}  │  点赞数    │
│  likeCount++│                    │             │
└─────────────┘                    └─────────────┘
```

#### 点赞状态维护

| 状态 | 前端展示 | API 行为 |
|------|----------|----------|
| 未点赞 | 空心/灰色图标 | POST 点赞 |
| 已点赞 | 实心/红色图标 | DELETE 取消点赞 |

#### 异常处理

| 场景 | 系统响应 |
|------|----------|
| 重复点赞 | 后端幂等处理，返回当前点赞数 |
| 取消自己没点过赞的文章 | 后端幂等处理，返回当前点赞数 |

---

### 3.6 目录索引模块

| 属性 | 说明 |
|------|------|
| 功能描述 | 按分类/标签索引博客内容 |
| 索引维度 | 分类、标签、时间归档 |

#### 索引页面结构

```
┌─────────────────────────────────────────────────┐
│                    博客索引                      │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │  分类索引    │  │  标签云      │  │ 时间归档 │ │
│  │  - 技术 (12) │  │  [React]    │  │ 2026(5)  │ │
│  │  - 生活 (8)  │  │  [Node.js]  │  │ 2025(15) │ │
│  │  - 随笔 (3)  │  │  [工具]     │  │          │ │
│  └─────────────┘  └─────────────┘  └──────────┘ │
└─────────────────────────────────────────────────┘
```

#### 分类管理（博主功能）

| 操作 | API | 说明 |
|------|-----|------|
| 查看分类 | GET /api/categories | 返回所有分类及文章数 |
| 添加分类 | POST /api/categories | {name, slug, description} |
| 编辑分类 | PUT /api/categories/:id | {name, description} |
| 删除分类 | DELETE /api/categories/:id | 关联文章设为"未分类" |

#### 标签管理（博主功能）

| 操作 | API | 说明 |
|------|-----|------|
| 查看标签 | GET /api/tags | 返回所有标签 |
| 添加标签 | POST /api/tags | {name, slug} |
| 删除标签 | DELETE /api/tags/:id | 自动解除关联 |

#### 时间归档

| 年份 | 文章数 | 展开显示月份 |
|------|--------|--------------|
| 2026 | 5 | 1月(2), 2月(1), 3月(2) |
| 2025 | 15 | 全部月份列表 |

---

### 3.7 账户管理模块

| 属性 | 说明 |
|------|------|
| 功能描述 | 管理个人信息 |
| 可管理内容 | 修改密码、昵称、头像、个人简介 |

#### 账户信息更新流程

```
┌─────────────┐                    ┌─────────────┐
│  账户设置页 │                    │   后端      │
│             │                    │             │
│  修改表单   │  PUT /api/users/me ────────────► │  验证数据  │
│  - 昵称     │                    │  更新用户   │
│  - 头像     │◄────────────────── │  返回用户   │
│  - 简介     │         {user}     │  信息      │
└─────────────┘                    └─────────────┘
```

#### 密码修改流程

```
┌─────────────┐                    ┌─────────────┐
│  密码修改页 │                    │   后端      │
│             │                    │             │
│  填写表单   │ PUT /api/users/me/password     │
│  - 旧密码   │ ────────────────────────────►  │
│  - 新密码   │                    │  验证旧密码 │
│             │                    │  加密新密码 │
│  确认修改   │◄────────────────── │  更新成功   │
│             │         {success}  │            │
└─────────────┘                    └─────────────┘
```

#### 修改密码规则

| 字段 | 规则 |
|------|------|
| 旧密码 | 必填，验证原密码是否正确 |
| 新密码 | 必填，最少 6 位 |
| 确认密码 | 必填，必须与新密码一致 |

---

### 3.8 项目计划模块

| 属性 | 说明 |
|------|------|
| 功能描述 | 管理个人项目进度 |
| 展示形式 | **看板（Kanban）** |
| 状态数量 | **3 个**（规划中 / 开发中 / 已完成） |
| 完成度计算 | 根据子任务完成数量自动计算 |

#### 项目看板结构

```
┌─────────────────────────────────────────────────────────────────────┐
│                        风迹集项目管理                                │
├─────────────────────────────────────────────────────────────────────┤
│  项目: 风迹集  │  完成度: 65%  │  状态: 开发中  │  [编辑] [删除]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐             │
│  │  📋 规划中   │   │  🔨 开发中   │   │  ✅ 已完成   │             │
│  │             │   │             │   │             │             │
│  │ ┌─────────┐ │   │ ┌─────────┐ │   │ ┌─────────┐ │             │
│  │ │ 任务 1  │ │   │ │ 任务 3  │ │   │ │ 任务 5  │ │             │
│  │ │ □ 待办  │ │   │ │ ■ 进行中│ │   │ │ ■ 完成  │ │             │
│  │ └─────────┘ │   │ └─────────┘ │   │ └─────────┘ │             │
│  │             │   │             │   │             │             │
│  │ ┌─────────┐ │   │ ┌─────────┐ │   │ ┌─────────┐ │             │
│  │ │ 任务 2  │ │   │ │ 任务 4  │ │   │ │ 任务 6  │ │             │
│  │ │ □ 待办  │ │   │ │ □ 待办  │ │   │ │ ■ 完成  │ │             │
│  │ └─────────┘ │   │ └─────────┘ │   │ └─────────┘ │             │
│  │             │   │             │   │             │             │
│  │ [+ 添加任务]│   │             │   │             │             │
│  └─────────────┘   └─────────────┘   └─────────────┘             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 创建项目流程

```
┌─────────────┐                    ┌─────────────┐
│  项目列表页  │                    │   后端      │
│             │                    │             │
│  点击新建   │  POST /api/projects ────────────►│  创建项目   │
│  项目按钮   │        {name, description...}     │  创建默认   │
│             │                    │  三个阶段   │
│  填写信息   │◄────────────────── │  返回项目   │
│  - 项目名称 │         {project}   │  信息      │
│  - 描述     │                    │             │
│  - 技术栈   │                    │             │
│  - 代码链接 │                    │             │
└─────────────┘                    └─────────────┘
```

#### 添加阶段流程

| 步骤 | 操作 | API |
|------|------|-----|
| 1 | 输入阶段名称 | POST /api/projects/:id/stages |
| 2 | 系统创建阶段 | 返回阶段信息 |
| 3 | 阶段自动分配到对应状态列 | 根据 sort_order 排序 |

#### 拖拽任务流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                        拖拽更新任务状态                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│    规划中列               开发中列               已完成列            │
│   ┌─────────┐                                                   │
│   │ 任务 A  │ ═══════════════════════════════►                  │
│   │ □ 待办  │     PUT /api/tasks/:id/move                        │
│   └─────────┘     {targetStageId, sortOrder}                   │
│                                    │                              │
│                                    ▼                              │
│                           ┌─────────────────┐                     │
│                           │  更新任务阶段   │                     │
│                           │  更新完成度     │                     │
│                           │  返回新完成度   │                     │
│                           │  65% → 70%     │                     │
│                           └─────────────────┘                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 完成度计算规则

```javascript
// 计算公式
completion_rate = (已完成任务数 / 总任务数) × 100

// 示例
项目共有 10 个任务，已完成 7 个任务
完成度 = 7 / 10 × 100 = 70%
```

#### 完成度触发更新时机

| 操作 | 是否触发重新计算 |
|------|------------------|
| 添加新任务 | ✅ |
| 删除任务 | ✅ |
| 标记任务完成 | ✅ |
| 取消任务完成 | ✅ |
| 移动任务到其他阶段 | ✅ |

#### 异常处理

| 场景 | 系统响应 |
|------|----------|
| 删除有任务的阶段 | 提示确认，级联删除任务 |
| 删除已完成的项目 | 提示确认 |
| 拖拽到自己所在列 | 无操作，保持位置 |

---

### 3.9 项目完成度提示模块

| 属性 | 说明 |
|------|------|
| 功能描述 | 提醒博主项目进展 |
| 提示类型 | 完成度变化通知 |
| 展示位置 | 项目卡片、项目详情页 |

#### 提示触发条件

| 触发条件 | 提示内容 | 展示方式 |
|----------|----------|----------|
| 任务完成 | "🎉 任务 [名称] 已完成" | Toast 提示 |
| 完成度提升 | "📈 项目完成度: 60% → 70%" | Toast 提示 |
| 完成度达到 100% | "🎊 项目已全部完成！" | 模态框 + Toast |
| 项目长期无进展 (>30天) | "⏰ 项目 [名称] 已停滞 30 天" | 项目卡片 Badge |

#### Toast 提示示例

```
┌────────────────────────────────────────┐
│  📈 项目「风迹集」完成度: 60% → 70%     │
│                            [确定]      │
└────────────────────────────────────────┘
```

---

## 四、非功能需求

### 4.1 性能需求

| 指标 | 要求 | 说明 |
|------|------|------|
| 首屏加载时间 | < 2s | 首次访问 |
| 再次加载时间 | < 500ms | 缓存后 |
| 文章列表翻页 | < 500ms | API 响应 |
| 文章详情加载 | < 300ms | 含 Markdown 渲染 |
| Markdown 渲染 | < 200ms | 10KB 以内文章 |
| 看板拖拽响应 | < 100ms | 前端操作反馈 |

### 4.2 兼容性需求

| 环境 | 要求 |
|------|------|
| 浏览器 | Chrome / Firefox / Safari / Edge 最新两个版本 |
| 屏幕分辨率 | 1280px+ 最佳，支持响应式缩放至 375px |
| 移动端 | iOS Safari 14+ / Android Chrome 90+ |

### 4.3 安全需求

| 需求 | 说明 | 实现方式 |
|------|------|----------|
| XSS 防护 | 防止脚本注入 | 输入输出转义，DOMPurify 清理 HTML |
| CSRF 防护 | 防止跨站请求伪造 | JWT Token 验证 |
| SQL 注入防护 | 防止数据库攻击 | 参数化查询（Prisma ORM） |
| 密码加密 | 不可逆加密存储 | bcrypt (saltRounds: 12) |
| Token 安全 | 防止 Token 被盗用 | 短期 Access Token (15min) + 长期 Refresh Token (7d) |

### 4.4 可用性需求

| 指标 | 要求 |
|------|------|
| 系统可用性 | 99.9% |
| 故障恢复时间 | < 1 小时 |
| 数据备份 | 每日自动备份 |

---

## 五、技术栈详细说明

### 5.1 前端技术栈

| 类别 | 技术选型 | 版本 | 说明 | 备选方案 |
|------|----------|------|------|----------|
| **框架** | React | 18.x | 生态完善，组件丰富 | Vue 3 |
| **路由** | React Router | v6 | 官方推荐路由方案 | |
| **状态管理** | Zustand | 4.x | 轻量级，使用简单，TypeScript 支持好 | Pinia（Vue）/ Redux Toolkit |
| **UI 组件库** | Ant Design | 5.x | 企业级设计规范，组件完善 | Element Plus / Chakra UI |
| **Markdown 编辑器** | Vditor | 3.x | 支持实时预览，对中文友好 | Markdown-it + CodeMirror |
| **Markdown 渲染** | react-markdown | 8.x | React 专用渲染库 | |
| **代码高亮** | Prism.js | - | 代码语法高亮，60+ 语言 | highlight.js |
| **HTTP 客户端** | Axios | 1.x | 支持拦截器，统一错误处理 | Fetch API |
| **构建工具** | Vite | 5.x | 快速启动，热更新快 | Webpack / CRA |
| **CSS 方案** | CSS Modules + Ant Design Tokens | - | 组件级样式隔离 + 主题定制 | Tailwind CSS |
| **看板拖拽** | @dnd-kit | 6.x | 现代化拖拽库，支持多平台 | react-beautiful-dnd |
| **表单验证** | React Hook Form | 7.x | 性能好，与 Ant Design 配合 | Formik |
| **日期处理** | Day.js | 1.x | 轻量级，体积小 (2KB) | Moment.js |
| **图片上传** | 直接使用 URL | - | 简化架构，图片存图床 | 七牛云 / OSS |
| **动画** | Framer Motion | 11.x | 声明式动画，React 专用 | |
| **PWA** | Vite PWA Plugin | - | 支持离线访问 | |

### 5.2 后端技术栈

| 类别 | 技术选型 | 版本 | 说明 | 备选方案 |
|------|----------|------|------|----------|
| **运行时** | Node.js | 18.x LTS | 生态丰富，与前端统一语言 | |
| **框架** | Express.js | 4.x | 简洁灵活，中间件丰富 | Koa2 / NestJS |
| **数据库** | PostgreSQL | 15.x | 关系型，功能强大，JSON 支持 | MySQL / SQLite |
| **ORM** | Prisma | 5.x | 类型安全，迁移方便，GUI 客户端 | TypeORM / Sequelize |
| **认证** | JWT (jsonwebtoken) | 9.x | 无状态认证 | Session |
| **密码加密** | bcrypt | 5.x | 业界标准，不可逆加密 | |
| **参数验证** | Joi / Zod | - | 请求参数校验 | express-validator |
| **日志** | Morgan + Winston | - | HTTP 日志 + 应用日志 | |
| **CORS** | cors | - | 跨域资源共享 | |
| **环境变量** | dotenv | - | 配置管理 | |
| **部署** | PM2 | - | Node.js 进程管理 | Forever / Docker |

### 5.3 开发工具

| 类别 | 工具 | 说明 |
|------|------|------|
| 包管理器 | pnpm | 快速、节省空间 |
| Git Hooks | Husky + lint-staged | 提交前检查 |
| 代码规范 | ESLint + Prettier | 统一代码风格 |
| 提交规范 | Conventional Commits | 统一提交信息格式 |

### 5.4 部署方案

| 类别 | 推荐方案 | 说明 |
|------|----------|------|
| 前端托管 | Vercel / Netlify | 免费额度，CDN 加速，自动部署 |
| 后端托管 | 自己的服务器 / 阿里云 ECS | 需要配置 |
| 数据库 | 云数据库 RDS PostgreSQL | 托管数据库，自动备份 |
| 域名 | 阿里云 / 腾讯云 | DNS 解析 |
| SSL | Let's Encrypt / 云平台自动 | HTTPS 支持 |

---

## 六、数据库详细设计

### 6.1 ER 关系图

```
┌──────────┐       ┌──────────┐       ┌──────────┐
│  users   │       │  posts   │       │categories│
├──────────┤       ├──────────┤       ├──────────┤
│ id       │──┐    │ id       │──┐    │ id       │
│ username │  │    │ title    │  │    │ name     │
│ email    │  └───►│ author_id│  └───►│ id       │
│ password │       │ category │       └──────────┘
│ nickname │       │_id      │
│ avatar   │       └────┬────┘
│ bio      │            │
└──────────┘            │
                       │
       ┌────────────────┼────────────────┐
       │                │                │
       ▼                ▼                ▼
┌──────────┐     ┌──────────┐     ┌──────────┐
│   tags   │     │post_tags │     │projects  │
├──────────┤     ├──────────┤     ├──────────┤
│ id       │◄───┤ post_id  │     │ id       │
│ name     │     │ tag_id   │     │ name     │
│ slug     │     └──────────┘     │ status   │
└──────────┘                     │...       │
                                 └─────┬─────┘
                                       │
                                 ┌─────┴─────┐
                                 │  stages   │
                                 ├──────────┤
                                 │ id       │◄───┐
                                 │ project_id│────┘
                                 │ name     │
                                 │ sort_order│
                                 └─────┬─────┘
                                       │
                                 ┌─────┴─────┐
                                 │   tasks   │
                                 ├──────────┤
                                 │ id       │
                                 │ stage_id │
                                 │ title    │
                                 │ is_completed│
                                 └──────────┘

┌──────────┐
│post_likes│
├──────────┤
│ post_id  │
│ visitor_id│
│ created_at│
└──────────┘
```

### 6.2 表结构详细定义

#### users - 用户表

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | SERIAL | PRIMARY KEY | - | 自增主键 |
| username | VARCHAR(50) | UNIQUE, NOT NULL | - | 用户名 |
| email | VARCHAR(100) | UNIQUE, NOT NULL | - | 邮箱 |
| password_hash | VARCHAR(255) | NOT NULL | - | 加密后密码 |
| nickname | VARCHAR(100) | - | username | 显示昵称 |
| avatar | VARCHAR(500) | - | 默认头像 | 头像 URL |
| bio | TEXT | - | - | 个人简介 |
| role | VARCHAR(20) | DEFAULT 'admin' | admin | 角色：admin/visitor |
| created_at | TIMESTAMP | DEFAULT NOW() | - | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | - | 更新时间 |

**索引：**
```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_username ON users(username);
```

#### posts - 文章表

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | SERIAL | PRIMARY KEY | - | 自增主键 |
| title | VARCHAR(200) | NOT NULL | - | 文章标题 |
| slug | VARCHAR(200) | UNIQUE, NOT NULL | - | URL 友好标识 |
| summary | TEXT | - | - | 文章摘要 |
| content | TEXT | NOT NULL | - | Markdown 正文 |
| cover_image | VARCHAR(500) | - | - | 封面图 URL |
| view_count | INTEGER | DEFAULT 0 | - | 阅读数 |
| like_count | INTEGER | DEFAULT 0 | - | 点赞数 |
| status | VARCHAR(20) | DEFAULT 'draft' | draft | 状态：draft/published |
| author_id | INTEGER | REFERENCES users(id) | - | 作者 ID |
| category_id | INTEGER | REFERENCES categories(id) | - | 分类 ID |
| is_deleted | BOOLEAN | DEFAULT FALSE | - | 软删除标记 |
| created_at | TIMESTAMP | DEFAULT NOW() | - | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | - | 更新时间 |
| published_at | TIMESTAMP | - | - | 发布时间 |

**索引：**
```sql
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE UNIQUE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_published_at ON posts(published_at);
CREATE INDEX idx_posts_is_deleted ON posts(is_deleted);
```

#### categories - 分类表

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | SERIAL | PRIMARY KEY | - | 自增主键 |
| name | VARCHAR(50) | NOT NULL | - | 分类名称 |
| slug | VARCHAR(50) | UNIQUE, NOT NULL | - | URL 友好标识 |
| description | TEXT | - | - | 分类描述 |
| sort_order | INTEGER | DEFAULT 0 | - | 排序顺序 |
| created_at | TIMESTAMP | DEFAULT NOW() | - | 创建时间 |

**索引：**
```sql
CREATE UNIQUE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_sort ON categories(sort_order);
```

#### tags - 标签表

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | SERIAL | PRIMARY KEY | - | 自增主键 |
| name | VARCHAR(50) | UNIQUE, NOT NULL | - | 标签名称 |
| slug | VARCHAR(50) | UNIQUE, NOT NULL | - | URL 友好标识 |
| created_at | TIMESTAMP | DEFAULT NOW() | - | 创建时间 |

**索引：**
```sql
CREATE UNIQUE INDEX idx_tags_slug ON tags(slug);
```

#### post_tags - 文章标签关联表

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| post_id | INTEGER | REFERENCES posts(id) ON DELETE CASCADE | 文章 ID |
| tag_id | INTEGER | REFERENCES tags(id) ON DELETE CASCADE | 标签 ID |

**索引：**
```sql
CREATE PRIMARY KEY ON post_tags(post_id, tag_id);
CREATE INDEX idx_post_tags_tag ON post_tags(tag_id);
```

#### projects - 项目表

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | SERIAL | PRIMARY KEY | - | 自增主键 |
| name | VARCHAR(100) | NOT NULL | - | 项目名称 |
| description | TEXT | - | - | 项目描述 |
| tech_stack | TEXT | - | - | 技术栈（JSON 数组） |
| code_url | VARCHAR(500) | - | - | 代码链接 |
| demo_url | VARCHAR(500) | - | - | 演示链接 |
| status | VARCHAR(20) | DEFAULT 'planning' | planning | 状态：planning/in_progress/completed |
| completion_rate | INTEGER | DEFAULT 0 | - | 完成度 0-100 |
| sort_order | INTEGER | DEFAULT 0 | - | 排序顺序 |
| is_public | BOOLEAN | DEFAULT TRUE | - | 是否公开 |
| created_at | TIMESTAMP | DEFAULT NOW() | - | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | - | 更新时间 |
| completed_at | TIMESTAMP | - | - | 完成时间 |

**索引：**
```sql
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_is_public ON projects(is_public);
```

#### stages - 项目阶段表

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | SERIAL | PRIMARY KEY | - | 自增主键 |
| project_id | INTEGER | REFERENCES projects(id) ON DELETE CASCADE | - | 所属项目 ID |
| name | VARCHAR(100) | NOT NULL | - | 阶段名称 |
| description | TEXT | - | - | 阶段描述 |
| sort_order | INTEGER | DEFAULT 0 | - | 排序顺序，控制看板列顺序 |
| created_at | TIMESTAMP | DEFAULT NOW() | - | 创建时间 |

**索引：**
```sql
CREATE INDEX idx_stages_project ON stages(project_id);
```

#### tasks - 任务表

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | SERIAL | PRIMARY KEY | - | 自增主键 |
| stage_id | INTEGER | REFERENCES stages(id) ON DELETE CASCADE | - | 所属阶段 ID |
| title | VARCHAR(200) | NOT NULL | - | 任务标题 |
| description | TEXT | - | - | 任务描述 |
| is_completed | BOOLEAN | DEFAULT FALSE | - | 是否完成 |
| sort_order | INTEGER | DEFAULT 0 | - | 列内排序顺序 |
| created_at | TIMESTAMP | DEFAULT NOW() | - | 创建时间 |
| completed_at | TIMESTAMP | - | - | 完成时间 |

**索引：**
```sql
CREATE INDEX idx_tasks_stage ON tasks(stage_id);
CREATE INDEX idx_tasks_completed ON tasks(is_completed);
```

#### post_likes - 点赞记录表

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| post_id | INTEGER | REFERENCES posts(id) ON DELETE CASCADE | 文章 ID |
| visitor_id | VARCHAR(100) | NOT NULL | 访客 ID（匿名或用户 ID） |
| created_at | TIMESTAMP | DEFAULT NOW() | 点赞时间 |

**索引：**
```sql
CREATE PRIMARY KEY ON post_likes(post_id, visitor_id);
CREATE INDEX idx_post_likes_visitor ON post_likes(visitor_id);
```

### 6.3 默认数据

#### 默认分类

| name | slug | description |
|------|------|-------------|
| 技术 | tech | 技术相关文章 |
| 生活 | life | 生活随笔 |
| 项目 | projects | 项目相关记录 |

#### 默认项目阶段（创建项目时自动创建）

| sort_order | name | 说明 |
|-------------|------|------|
| 0 | 规划中 | 尚未开始的任务 |
| 1 | 开发中 | 正在进行 |
| 2 | 已完成 | 已完成的任务 |

---

## 七、API 接口详细设计

### 7.1 API 规范

#### 基础规范

| 项目 | 规范 |
|------|------|
| 基础 URL | /api |
| 认证方式 | Bearer Token (JWT) |
| 请求格式 | JSON (Content-Type: application/json) |
| 编码 | UTF-8 |

#### 通用响应格式

```json
// 成功
{
  "success": true,
  "data": { ... }
}

// 错误
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

#### 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 / Token 无效 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如用户名已存在） |
| 500 | 服务器错误 |

---

### 7.2 认证模块 API

#### POST /api/auth/register - 用户注册

**请求：**
```json
{
  "username": "fengjiji",
  "email": "user@example.com",
  "password": "123456"
}
```

**响应 (201)：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "fengjiji",
      "email": "user@example.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**错误码：**
| code | 状态码 | 说明 |
|------|--------|------|
| USERNAME_EXISTS | 409 | 用户名已存在 |
| EMAIL_EXISTS | 409 | 邮箱已存在 |
| VALIDATION_ERROR | 400 | 参数校验失败 |

---

#### POST /api/auth/login - 用户登录

**请求：**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**响应 (200)：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "fengjiji",
      "email": "user@example.com",
      "nickname": "风迹集主",
      "avatar": "https://...",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**错误码：**
| code | 状态码 | 说明 |
|------|--------|------|
| INVALID_CREDENTIALS | 401 | 邮箱或密码错误 |

---

#### POST /api/auth/logout - 用户登出

**请求头：**
```
Authorization: Bearer <token>
```

**响应 (200)：**
```json
{
  "success": true,
  "message": "登出成功"
}
```

---

#### POST /api/auth/refresh - 刷新 Token

**请求：**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**响应 (200)：**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 7.3 用户模块 API

#### GET /api/users/me - 获取当前用户

**请求头：**
```
Authorization: Bearer <token>
```

**响应 (200)：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "fengjiji",
    "email": "user@example.com",
    "nickname": "风迹集主",
    "avatar": "https://...",
    "bio": "记录技术与生活",
    "role": "admin",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

---

#### PUT /api/users/me - 更新个人信息

**请求头：**
```
Authorization: Bearer <token>
```

**请求：**
```json
{
  "nickname": "新昵称",
  "avatar": "https://new-avatar.com/avatar.png",
  "bio": "更新后的简介"
}
```

**响应 (200)：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "fengjiji",
    "nickname": "新昵称",
    "avatar": "https://new-avatar.com/avatar.png",
    "bio": "更新后的简介"
  }
}
```

---

#### PUT /api/users/me/password - 修改密码

**请求头：**
```
Authorization: Bearer <token>
```

**请求：**
```json
{
  "oldPassword": "123456",
  "newPassword": "654321"
}
```

**响应 (200)：**
```json
{
  "success": true,
  "message": "密码修改成功"
}
```

**错误码：**
| code | 状态码 | 说明 |
|------|--------|------|
| WRONG_PASSWORD | 400 | 旧密码错误 |

---

### 7.4 文章模块 API

#### GET /api/posts - 获取文章列表

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| limit | number | 10 | 每页数量，最大 50 |
| category | string | - | 分类 slug 过滤 |
| tag | string | - | 标签 slug 过滤 |
| status | string | published | 状态：draft/published/all |
| sort | string | publishedAt | 排序字段 |
| order | string | desc | 排序方向：asc/desc |

**响应 (200)：**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "title": "使用 React + Node.js 构建博客",
        "slug": "react-nodejs-blog",
        "summary": "这是一篇关于...",
        "coverImage": "https://...",
        "viewCount": 100,
        "likeCount": 5,
        "status": "published",
        "author": {
          "id": 1,
          "username": "fengjiji",
          "nickname": "风迹集主",
          "avatar": "https://..."
        },
        "category": {
          "id": 1,
          "name": "技术",
          "slug": "tech"
        },
        "tags": [
          {"id": 1, "name": "React", "slug": "react"},
          {"id": 2, "name": "Node.js", "slug": "nodejs"}
        ],
        "publishedAt": "2026-04-01T00:00:00Z",
        "createdAt": "2026-03-15T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

---

#### GET /api/posts/:slug - 获取文章详情

**路径参数：**
| 参数 | 说明 |
|------|------|
| slug | 文章 slug |

**响应 (200)：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "使用 React + Node.js 构建博客",
    "slug": "react-nodejs-blog",
    "summary": "这是一篇关于...",
    "content": "# Markdown 内容...",
    "coverImage": "https://...",
    "viewCount": 101,
    "likeCount": 5,
    "isLiked": false,
    "status": "published",
    "author": {
      "id": 1,
      "username": "fengjiji",
      "nickname": "风迹集主",
      "avatar": "https://...",
      "bio": "记录技术与生活"
    },
    "category": {
      "id": 1,
      "name": "技术",
      "slug": "tech"
    },
    "tags": [
      {"id": 1, "name": "React", "slug": "react"},
      {"id": 2, "name": "Node.js", "slug": "nodejs"}
    ],
    "project": {
      "id": 1,
      "name": "风迹集",
      "codeUrl": "https://github.com/..."
    },
    "publishedAt": "2026-04-01T00:00:00Z",
    "createdAt": "2026-03-15T00:00:00Z",
    "updatedAt": "2026-04-01T00:00:00Z",
    "prevPost": {
      "id": 2,
      "title": "上一篇",
      "slug": "prev-post"
    },
    "nextPost": {
      "id": 3,
      "title": "下一篇",
      "slug": "next-post"
    }
  }
}
```

**错误码：**
| code | 状态码 | 说明 |
|------|--------|------|
| POST_NOT_FOUND | 404 | 文章不存在 |

---

#### POST /api/posts - 创建文章

**请求头：**
```
Authorization: Bearer <token>
```

**请求：**
```json
{
  "title": "新文章标题",
  "slug": "new-post-slug",
  "summary": "文章摘要",
  "content": "# Markdown 正文",
  "coverImage": "https://...",
  "categoryId": 1,
  "tags": [1, 2],
  "projectId": 1,
  "status": "draft"
}
```

**响应 (201)：**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "title": "新文章标题",
    "slug": "new-post-slug",
    "status": "draft",
    "createdAt": "2026-04-14T00:00:00Z"
  }
}
```

---

#### PUT /api/posts/:id - 更新文章

**请求头：**
```
Authorization: Bearer <token>
```

**请求：**
```json
{
  "title": "更新后的标题",
  "content": "# 更新后的内容",
  "status": "published",
  "publishedAt": "2026-04-14T12:00:00Z"
}
```

**响应 (200)：**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "title": "更新后的标题",
    "status": "published",
    "updatedAt": "2026-04-14T12:00:00Z"
  }
}
```

---

#### DELETE /api/posts/:id - 删除文章

**请求头：**
```
Authorization: Bearer <token>
```

**响应 (200)：**
```json
{
  "success": true,
  "message": "文章已删除"
}
```

---

#### POST /api/posts/:id/like - 点赞文章

**请求头：**
```
Authorization: Bearer <token>
```

**响应 (200)：**
```json
{
  "success": true,
  "data": {
    "likeCount": 6
  }
}
```

---

#### DELETE /api/posts/:id/like - 取消点赞

**请求头：**
```
Authorization: Bearer <token>
```

**响应 (200)：**
```json
{
  "success": true,
  "data": {
    "likeCount": 5
  }
}
```

---

### 7.5 分类/标签模块 API

#### GET /api/categories - 获取所有分类

**响应 (200)：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "技术",
      "slug": "tech",
      "description": "技术相关文章",
      "postCount": 12,
      "sortOrder": 0
    },
    {
      "id": 2,
      "name": "生活",
      "slug": "life",
      "description": "生活随笔",
      "postCount": 8,
      "sortOrder": 1
    }
  ]
}
```

---

#### POST /api/categories - 创建分类

**请求头：**
```
Authorization: Bearer <token>
```

**请求：**
```json
{
  "name": "新分类",
  "slug": "new-category",
  "description": "分类描述",
  "sortOrder": 2
}
```

**响应 (201)：**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "新分类",
    "slug": "new-category"
  }
}
```

---

#### PUT /api/categories/:id - 更新分类

**请求头：**
```
Authorization: Bearer <token>
```

**请求：**
```json
{
  "name": "更新后的分类名",
  "description": "更新后的描述"
}
```

**响应 (200)：**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "更新后的分类名",
    "slug": "new-category"
  }
}
```

---

#### DELETE /api/categories/:id - 删除分类

**请求头：**
```
Authorization: Bearer <token>
```

**响应 (200)：**
```json
{
  "success": true,
  "message": "分类已删除"
}
```

**说明：** 删除分类后，该分类下的文章会变为"未分类"状态。

---

#### GET /api/tags - 获取所有标签

**响应 (200)：**
```json
{
  "success": true,
  "data": [
    {"id": 1, "name": "React", "slug": "react", "postCount": 5},
    {"id": 2, "name": "Node.js", "slug": "nodejs", "postCount": 3},
    {"id": 3, "name": "工具", "slug": "tools", "postCount": 2}
  ]
}
```

---

#### POST /api/tags - 创建标签

**请求头：**
```
Authorization: Bearer <token>
```

**请求：**
```json
{
  "name": "新标签",
  "slug": "new-tag"
}
```

**响应 (201)：**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "name": "新标签",
    "slug": "new-tag"
  }
}
```

---

#### DELETE /api/tags/:id - 删除标签

**请求头：**
```
Authorization: Bearer <token>
```

**响应 (200)：**
```json
{
  "success": true,
  "message": "标签已删除"
}
```

---

### 7.6 项目管理模块 API

#### GET /api/projects - 获取所有项目

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| status | string | - | 按状态过滤：planning/in_progress/completed |
| isPublic | boolean | true | 是否公开 |

**响应 (200)：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "风迹集",
      "description": "个人博客与项目管理系统",
      "techStack": ["React", "Node.js", "PostgreSQL"],
      "codeUrl": "https://github.com/...",
      "demoUrl": "https://fengjiji.com",
      "status": "in_progress",
      "completionRate": 65,
      "isPublic": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-04-14T00:00:00Z"
    }
  ]
}
```

---

#### GET /api/projects/:id - 获取项目详情

**响应 (200)：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "风迹集",
    "description": "个人博客与项目管理系统",
    "techStack": ["React", "Node.js", "PostgreSQL"],
    "codeUrl": "https://github.com/...",
    "demoUrl": "https://fengjiji.com",
    "status": "in_progress",
    "completionRate": 65,
    "isPublic": true,
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-04-14T00:00:00Z",
    "completedAt": null,
    "stages": [
      {
        "id": 1,
        "name": "规划中",
        "sortOrder": 0,
        "tasks": [
          {
            "id": 1,
            "title": "需求分析",
            "isCompleted": true,
            "completedAt": "2026-01-05T00:00:00Z"
          },
          {
            "id": 2,
            "title": "技术选型",
            "isCompleted": false
          }
        ]
      },
      {
        "id": 2,
        "name": "开发中",
        "sortOrder": 1,
        "tasks": [...]
      },
      {
        "id": 3,
        "name": "已完成",
        "sortOrder": 2,
        "tasks": [...]
      }
    ]
  }
}
```

---

#### POST /api/projects - 创建项目

**请求头：**
```
Authorization: Bearer <token>
```

**请求：**
```json
{
  "name": "新项目",
  "description": "项目描述",
  "techStack": ["React", "TypeScript"],
  "codeUrl": "https://github.com/...",
  "demoUrl": "https://demo.com",
  "isPublic": true
}
```

**响应 (201)：**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "新项目",
    "status": "planning",
    "completionRate": 0,
    "stages": [
      {"id": 10, "name": "规划中", "sortOrder": 0},
      {"id": 11, "name": "开发中", "sortOrder": 1},
      {"id": 12, "name": "已完成", "sortOrder": 2}
    ]
  }
}
```

**说明：** 创建项目时会自动创建三个默认阶段。

---

#### PUT /api/projects/:id - 更新项目

**请求头：**
```
Authorization: Bearer <token>
```

**请求：**
```json
{
  "name": "更新后的项目名",
  "description": "更新后的描述",
  "status": "completed"
}
```

**响应 (200)：**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "更新后的项目名",
    "status": "completed",
    "completionRate": 100,
    "completedAt": "2026-04-14T12:00:00Z"
  }
}
```

---

#### DELETE /api/projects/:id - 删除项目

**请求头：**
```
Authorization: Bearer <token>
```

**响应 (200)：**
```json
{
  "success": true,
  "message": "项目已删除"
}
```

---

#### POST /api/projects/:id/stages - 创建阶段

**请求头：**
```
Authorization: Bearer <token>
```

**请求：**
```json
{
  "name": "新阶段",
  "sortOrder": 3
}
```

**响应 (201)：**
```json
{
  "success": true,
  "data": {
    "id": 20,
    "name": "新阶段",
    "sortOrder": 3
  }
}
```

---

#### PUT /api/stages/:id - 更新阶段

**请求头：**
```
Authorization: Bearer <token>
```

**请求：**
```json
{
  "name": "更新后的阶段名",
  "sortOrder": 1
}
```

**响应 (200)：**
```json
{
  "success": true,
  "data": {
    "id": 20,
    "name": "更新后的阶段名",
    "sortOrder": 1
  }
}
```

---

#### DELETE /api/stages/:id - 删除阶段

**请求头：**
```
Authorization: Bearer <token>
```

**响应 (200)：**
```json
{
  "success": true,
  "message": "阶段已删除"
}
```

**说明：** 删除阶段会级联删除所有任务。

---

#### POST /api/stages/:id/tasks - 创建任务

**请求头：**
```
Authorization: Bearer <token>
```

**请求：**
```json
{
  "title": "新任务",
  "description": "任务描述",
  "sortOrder": 0
}
```

**响应 (201)：**
```json
{
  "success": true,
  "data": {
    "id": 100,
    "title": "新任务",
    "isCompleted": false,
    "sortOrder": 0
  }
}
```

**附带效果：** 创建任务后，项目完成度会重新计算。

---

#### PUT /api/tasks/:id - 更新任务

**请求头：**
```
Authorization: Bearer <token>
```

**请求：**
```json
{
  "title": "更新后的任务名",
  "description": "更新后的描述",
  "isCompleted": true
}
```

**响应 (200)：**
```json
{
  "success": true,
  "data": {
    "id": 100,
    "title": "更新后的任务名",
    "isCompleted": true,
    "completedAt": "2026-04-14T12:00:00Z"
  }
}
```

**附带效果：** 更新任务完成状态后，所属项目的完成度会重新计算。

---

#### PUT /api/tasks/:id/move - 移动任务

**请求头：**
```
Authorization: Bearer <token>
```

**请求：**
```json
{
  "targetStageId": 2,
  "sortOrder": 0
}
```

**响应 (200)：**
```json
{
  "success": true,
  "data": {
    "id": 100,
    "stageId": 2,
    "sortOrder": 0
  }
}
```

**附带效果：** 移动任务后，源项目和目标项目的完成度都会重新计算。

---

#### DELETE /api/tasks/:id - 删除任务

**请求头：**
```
Authorization: Bearer <token>
```

**响应 (200)：**
```json
{
  "success": true,
  "message": "任务已删除"
}
```

**附带效果：** 删除任务后，所属项目的完成度会重新计算。

---

## 八、开发阶段规划

### Stage 1 - 基础搭建（预计周期 1-2 周）

**目标：** 完成项目架子搭建、数据库设计、登录功能

| 任务 | 描述 | 交付物 |
|------|------|--------|
| 项目初始化 | 前端 + 后端项目创建，Git 初始化 | 初始代码仓库 |
| 数据库设计 | Prisma Schema 设计，数据库迁移 | 数据库表结构 |
| 登录模块 | 注册、登录、JWT 认证 | 登录 API |
| 账户管理 | 修改密码、个人信息管理 | 用户 API |
| 基础架子 | 前后端联调，基础组件封装 | 可运行项目 |

**交付物：** 可注册登录的基本系统

---

### Stage 2 - 博客核心（预计周期 2-3 周）

**目标：** 完成博客的 CRUD、Markdown 编辑、分类管理

| 任务 | 描述 | 交付物 |
|------|------|--------|
| 博客列表 | 展示、翻页、排序 | 博客列表页 |
| 博客详情 | Markdown 渲染、代码高亮 | 文章详情页 |
| 博客撰写 | Markdown 编辑器、自动保存草稿 | 撰写页面 |
| 分类管理 | 添加/编辑/删除分类 | 分类管理 |
| 标签管理 | 添加/删除标签 | 标签管理 |
| 博客互动 | 点赞、分享、阅读量统计 | 互动功能 |
| 目录索引 | 分类页、标签页、时间归档 | 索引页面 |

**交付物：** 完整的博客系统，可对外展示

---

### Stage 3 - 项目管理（预计周期 2-3 周）

**目标：** 完成项目看板、任务管理、完成度计算

| 任务 | 描述 | 交付物 |
|------|------|--------|
| 项目列表 | 展示所有项目，显示完成度 | 项目列表页 |
| 项目看板 | 三状态看板，拖拽更新状态 | 看板页面 |
| 阶段管理 | 添加/编辑/删除阶段 | 阶段管理 |
| 任务管理 | 添加/编辑/删除/移动任务 | 任务管理 |
| 完成度计算 | 自动统计并展示 | 完成度逻辑 |
| 进度提示 | 完成度变化提醒 | 提示功能 |

**交付物：** 项目管理系统，可追踪项目进度

---

### Stage 4 - 优化与上线（预计周期 1 周）

**目标：** 完善细节、测试、部署上线

| 任务 | 描述 | 交付物 |
|------|------|--------|
| UI 优化 | 响应式适配、交互细节优化 | 优化后 UI |
| 性能优化 | 首屏加载、缓存策略 | 性能报告 |
| 测试 | 功能测试、回归测试 | 测试报告 |
| 部署上线 | 生产环境部署、域名配置 | 正式站点 |
| 文档完善 | README、部署文档 | 完整文档 |

**交付物：** 可访问的正式站点

---

## 九、里程碑

| 阶段 | 预计完成时间 | 交付成果 |
|------|-------------|----------|
| Stage 1 | 第 1-2 周 | 登录系统 + 基础架子 |
| Stage 2 | 第 3-5 周 | 完整博客系统 |
| Stage 3 | 第 6-8 周 | 项目管理系统 |
| Stage 4 | 第 9 周 | 正式上线 |
| **正式版本** | **第 9 周** | **风迹集 v1.0** |

---

## 十、风险评估

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 时间不足 | 中 | 优先完成核心功能，迭代优化 |
| Markdown 编辑器选型 | 低 | 先用成熟方案，后续可替换 |
| 数据库性能 | 低 | 按需加索引，后续可优化 |
| 看板拖拽性能 | 中 | 使用成熟的 @dnd-kit 库 |

---

## 十一、附录

### 11.1 名词解释

| 术语 | 说明 |
|------|------|
| 完成度 | 项目已完成任务占总任务的百分比 |
| Stage | 阶段，一个项目可包含多个阶段 |
| Task | 任务，具体到可执行的工作项 |
| Slug | URL 友好标识，如 "my-post" |
| Visitor ID | 访客唯一标识，用于匿名点赞 |

### 11.2 环境变量配置

**前端 (.env)**
```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=风迹集
```

**后端 (.env)**
```
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/fengjiji
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=development
```

---

*本文档将随项目进展持续更新*
