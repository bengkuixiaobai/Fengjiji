# 风迹集

个人博客与作品集管理平台。记录技术思考，分享项目经验，追踪项目进度。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite 5 + Ant Design 5 + Zustand |
| 后端 | Node.js + Express 4 + Prisma ORM |
| 数据库 | PostgreSQL |
| 认证 | JWT (accessToken + refreshToken) |

## 环境要求

- Node.js >= 18
- PostgreSQL >= 14

## 快速启动

### 1. 安装依赖

```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd ../frontend
npm install
```

### 2. 配置环境变量

后端配置文件 `backend/.env`：

```env
# 数据库（按实际配置修改）
DATABASE_URL="postgresql://postgres:密码@localhost:5432/fengjiji?schema=public"

# JWT 密钥（修改为随机字符串）
JWT_SECRET="your-super-secret-key-change-this-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# 服务器
PORT=3000
NODE_ENV="development"
```

### 3. 创建数据库

```bash
createdb -U postgres fengjiji
```

### 4. 初始化数据库表结构

```bash
cd backend
npx prisma migrate dev
```

### 5. 启动服务

**终端 1 — 启动后端（端口 3000）：**

```bash
cd backend
npm run dev
```

**终端 2 — 启动前端（端口 5173）：**

```bash
cd frontend
npm run dev
```

### 6. 访问

| 地址 | 说明 |
|------|------|
| http://localhost:5173 | 前端页面 |
| http://localhost:3000/api/health | 后端健康检查 |

> 前端开发服务器已配置代理，`/api` 请求自动转发到后端 3000 端口。

## 常用命令

```bash
# 后端
npm run dev              # 开发模式（热重载）
npm start                # 生产模式
npx prisma studio        # 数据库管理 UI
npx prisma migrate dev   # 运行数据库迁移
npx prisma generate      # 生成 Prisma Client

# 前端
npm run dev              # 开发模式
npm run build            # 构建生产版本
npm run preview          # 预览构建产物
```

## 项目结构

```
my_website/
├── backend/
│   ├── prisma/              # 数据库 schema 和迁移
│   ├── src/
│   │   ├── config/          # 配置
│   │   ├── controllers/     # 控制器
│   │   ├── middleware/       # 中间件（认证、错误处理）
│   │   ├── routes/          # 路由
│   │   ├── services/        # 业务逻辑
│   │   ├── utils/           # 工具类
│   │   ├── app.js           # Express 应用配置
│   │   └── server.js        # 服务入口
│   └── index.js
├── frontend/
│   ├── src/
│   │   ├── pages/           # 页面组件
│   │   ├── services/        # API 调用
│   │   ├── stores/          # Zustand 状态管理
│   │   ├── App.tsx          # 根组件（路由）
│   │   └── main.tsx         # 入口
│   └── vite.config.ts
├── PRD-风迹集.md             # 产品需求文档
└── README.md
```

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| POST | /api/auth/refresh | 刷新 Token |
| GET | /api/users/me | 获取当前用户 |
| PUT | /api/users/me | 更新个人信息 |
| GET/POST | /api/posts | 文章列表/创建 |
| PUT/DELETE | /api/posts/:id | 更新/删除文章 |
| GET/POST | /api/projects | 项目列表/创建 |
| PUT/DELETE | /api/projects/:id | 更新/删除项目 |
| GET | /api/categories | 分类列表 |
| GET | /api/tags | 标签列表 |
| GET/POST | /api/checkins | 签到记录/签到 |
| GET | /api/stats/dashboard | 仪表盘统计 |
