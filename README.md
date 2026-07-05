# 风迹集

> 个人博客与作品集管理平台：记录技术思考 · 分享项目经验 · 追踪项目进度

🌌 **风过留痕，迹存于心**

---

## ✨ 特性

- 📝 **博客系统** — Markdown 编写、分类/标签、点赞/阅读量统计、上下篇导航
- 🚀 **项目管理** — 看板视图、计划任务、进度追踪、GitHub 仓库关联
- 📅 **每日签到** — 日历视图、个人坚持天数统计
- 🔐 **JWT 认证** — access + refresh token 机制
- 🌓 **深色 / 浅色主题** — CSS 变量驱动，无闪烁切换

---

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 · TypeScript · Vite 5 · Ant Design 5 · Zustand |
| 后端 | Node.js · Express 4 · Prisma 5 |
| 数据库 | PostgreSQL 14+ |
| 认证 | JWT (access + refresh token) |
| 部署 | PM2 · Nginx · Let's Encrypt |

---

## 📋 环境要求

- **Node.js** >= 18
- **PostgreSQL** >= 14
- **Linux** (Ubuntu 22.04 / Debian 12 推荐)

---

## 🚀 快速开始

```bash
# 1. 克隆仓库
git clone <仓库地址> fengjiji
cd fengjiji

# 2. 安装依赖
npm run install:all

# 3. 初始化数据库
#    - 创建数据库 fengjiji
#    - 修改 backend/.env 中的 DATABASE_URL
#    - 执行迁移：
cd backend
npx prisma migrate dev
node prisma/seed.js    # 创建初始管理员 + 邀请码
cd ..

# 4. 启动开发服务
npm run dev
```

| 地址 | 说明 |
|------|------|
| http://localhost:5173 | 前端开发服务器 |
| http://localhost:3000/api/health | 后端健康检查 |

**初始账号**（密码由环境变量控制，必须设置）：

```bash
# 必填：管理员密码
export ADMIN_PASSWORD="your-strong-password-here"

# 可选：访客体验账号(默认不创建,适合首次部署只创建管理员)
export GUEST_PASSWORD="your-guest-password"

# 然后再跑 seed
node prisma/seed.js
```

**账号启用规则**：

| 角色 | 启用条件 | 默认行为 |
|------|----------|----------|
| 管理员（admin） | **必须** 设置 `ADMIN_PASSWORD` | 不设会报错退出 |
| 体验访客（visitor） | 可选,设置 `GUEST_PASSWORD` 才创建 | 默认不创建 |

**邀请码机制**：每个用户（管理员、访客、通过邀请注册的用户）自动拥有一个邀请码，最多邀请 5 人。可在「个人中心 → 我的邀请码」查看并复制。

---

## 📦 常用命令

```bash
# 安装
npm run install:all       # 一次性安装前后端依赖
npm run install:backend
npm run install:frontend

# 开发
npm run dev               # 并行启动前后端（dev 热重载）
npm run dev:backend       # 仅后端
npm run dev:frontend      # 仅前端

# 构建
npm run build             # 构建前端生产版本

# 启动生产
npm start                 # 启动后端

# 数据库
npm run seed              # 运行种子脚本

# 部署（构建 + 迁移 + 启动）
npm run deploy
```

---

## 📂 项目结构

```
fengjiji/
├── backend/                 # 后端 Express API
│   ├── prisma/              # 数据库 schema / migrations / seed
│   ├── src/
│   │   ├── config/          # 环境配置
│   │   ├── controllers/     # 控制器
│   │   ├── services/        # 业务逻辑层
│   │   ├── middleware/       # 中间件
│   │   ├── routes/          # 路由
│   │   ├── utils/           # 工具函数
│   │   ├── app.js           # Express 应用
│   │   └── server.js        # 服务入口
│   └── uploads/             # 上传文件
│
├── frontend/                # 前端 Vite SPA
│   ├── src/
│   │   ├── pages/           # 页面（路由级 lazy）
│   │   ├── components/      # 共享组件
│   │   ├── services/        # API 调用层
│   │   ├── stores/          # Zustand 状态
│   │   └── hooks/           # 自定义 Hooks
│   └── vite.config.ts
│
├── docs/                    # 项目文档
│   ├── PRD.md               # 产品需求文档
│   ├── 01-项目概览.md        # 技术栈一览
│   ├── 02-环境搭建与部署指南.md
│   ├── 03-运维与备份手册.md
│   ├── 04-环境变量参考.md
│   ├── 05-安全加固指南.md
│   ├── 06-常见问题排查.md
│   ├── design/              # 设计阶段文档
│   └── archive/             # 历史归档（审查报告等）
│
├── ecosystem.config.js      # PM2 进程管理配置
├── package.json             # 根级 npm scripts
└── README.md
```

---

## 📖 文档索引

### 🚀 落地文档（按阅读顺序）

1. [项目概览](docs/01-项目概览.md) — 技术栈与项目结构速览
2. [环境搭建与部署指南](docs/02-环境搭建与部署指南.md) — 从零到上线的完整步骤
3. [运维与备份手册](docs/03-运维与备份手册.md) — 日常运维、备份策略、故障恢复
4. [环境变量参考](docs/04-环境变量参考.md) — 所有 env 变量与生成方法
5. [安全加固指南](docs/05-安全加固指南.md) — 服务器/应用/数据库三层加固
6. [常见问题排查](docs/06-常见问题排查.md) — 启动/数据库/前端/性能 FAQ
7. **[部署清单与首次配置](docs/部署清单与首次配置.md)** — 云服务器购买清单 + 首次登录 10 件事

### 📐 设计阶段文档

- [项目计划与里程碑](docs/design/01-项目计划与里程碑.md)
- [技术方案设计文档](docs/design/02-技术方案设计文档.md)
- [数据库设计文档](docs/design/03-数据库设计文档.md)
- [API 接口规范](docs/design/04-API接口规范.md)
- [前端设计文档](docs/design/05-前端设计文档.md)

### 📄 产品文档

- [PRD.md](docs/PRD.md) — 完整产品需求文档

### 🗄 历史归档

- [archive/](docs/archive/) — 已完成的审查报告、阶段性文档

---

## 🔌 API 概览

主要接口（详见 [API 接口规范](docs/design/04-API接口规范.md)）：

| 模块 | 接口 |
|------|------|
| 认证 | `POST /auth/register` `POST /auth/login` `POST /auth/refresh` `POST /auth/logout` |
| 用户 | `GET /users/me` `PUT /users/me` `PUT /users/me/password` |
| 文章 | `GET/POST /posts` `PUT/DELETE /posts/:id` `POST /posts/:id/view` `POST /posts/:id/like/toggle` |
| 项目 | `GET/POST /projects` `PUT/DELETE /projects/:id` |
| 分类 | `GET/POST /categories` `DELETE /categories/:id` |
| 签到 | `GET/POST /checkins` `GET /checkins/stats` |
| 仪表盘 | `GET /stats/dashboard` |
| 上传 | `POST /upload` |

---

## 📝 版本与许可证

- 当前版本：v1.0
- 许可证：MIT

---

🌌 2026 风迹集
