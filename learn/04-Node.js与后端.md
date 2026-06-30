# 04 — Node.js 与后端开发

> 学完你就能:看懂 `backend/` 整个目录

---

## 1. 什么是 Node.js?

**Node.js = 让 JavaScript 能在服务器上跑**

传统上 JavaScript 只能跑在浏览器里(前端)。Node.js 在 2009 年出现了,从此 JS 也能写后端。

```
浏览器里的 JS:
  - 处理页面交互
  - 调用浏览器 API
  - 不能读写文件

Node.js 里的 JS:
  - 一切!包括读写文件、连接数据库、收发 HTTP 请求
```

---

## 2. Node.js 必知概念

### 2.1 模块系统

Node.js 用**模块**组织代码。一个文件 = 一个模块。

**CommonJS**(本项目后端用这个):

```js
// math.js — 导出
function add(a, b) { return a + b }
function sub(a, b) { return a - b }
module.exports = { add, sub }

// app.js — 导入
const { add, sub } = require('./math.js')
```

**ES Modules**(前端代码用这个):

```js
// math.js
export function add(a, b) { return a + b }

// app.js
import { add } from './math.js'
```

⚠️ **本项目是两套混用**:
- `backend/` 用 CommonJS(`require`)
- `frontend/src/` 用 ES Modules(`import`)

### 2.2 npm 包管理

```bash
# 初始化项目
npm init -y   # 生成 package.json

# 安装依赖
npm install express         # 运行时依赖
npm install nodemon -D      # 开发依赖

# 包的来源
# node_modules/        ← 本地
# 平时用 npm install 时,会自动从 npmjs.com 下载到这里
```

`package.json`:

```json
{
  "name": "fengjiji-backend",
  "dependencies": {
    "express": "^4.18.2",     // ^ 表示兼容同大版本
    "prisma": "5.22.0"
  },
  "scripts": {
    "dev": "nodemon index.js",
    "start": "node index.js"
  }
}
```

### 2.3 文件系统

```js
const fs = require('fs')

// 同步读
const data = fs.readFileSync('./package.json', 'utf-8')

// 同步写
fs.writeFileSync('./file.txt', 'hello')

// 异步读(推荐)
fs.promises.readFile('./package.json', 'utf-8')
  .then(data => console.log(data))
```

**🌟 真实例子** — 风迹集上传路径处理:

```js
// backend/src/routes/upload.routes.js
const path = require('path')
const uploadDir = path.join(__dirname, '../../uploads')
fs.unlinkSync(req.file.path)  // 删除文件
```

---

## 3. Express — Node.js 主流 Web 框架

Express 是最流行的 Node.js Web 框架,本项目后端核心。

### 3.1 最简 Express 应用

```js
// server.js
const express = require('express')
const app = express()

// GET 请求 — 当有人访问 / 时
app.get('/', (req, res) => {
  res.send('Hello!')
})

// POST 请求
app.post('/api/login', (req, res) => {
  res.json({ success: true })
})

// 启动监听
app.listen(3000, () => console.log('运行在 http://localhost:3000'))
```

### 3.2 路由(Routing)

```js
// 单个路由
app.get('/posts', (req, res) => res.send('文章列表'))

// 多路径参数
app.get('/posts/:id', (req, res) => {
  res.send(`文章 id = ${req.params.id}`)
})

// 查询参数
app.get('/search', (req, res) => {
  const { q, page } = req.query
  // 访问 /search?q=hello&page=2
  // q='hello', page='2'
})
```

### 3.3 中间件(Middleware)

中间件 = 在请求到达路由前/后执行的函数。

```js
// 解析 JSON 请求体
app.use(express.json())

// 自定义中间件 — 记录每个请求
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()  // 交给下一个中间件/路由
})

// 错误处理中间件 — 4 个参数
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: '服务器错误' })
})
```

**执行顺序**:
```
请求 → 中间件1 → 中间件2 → ... → 路由 → 响应
                                          ↓
                                       错误中间件(如果有错时)
```

**🌟 真实例子** — 风迹集的中间件使用:

```js
// backend/src/app.js
app.use(helmet())           // 1. 安全头
app.use(cors(...))           // 2. 跨域
app.use(morgan('combined'))  // 3. 日志
app.use(express.json())      // 4. 解析 JSON
app.use('/api', routes)      // 5. 业务路由
app.use(errorHandler)        // 6. 错误处理
```

### 3.4 req 和 res 对象

```js
app.post('/api/posts', (req, res) => {
  // req:请求对象
  // - req.body    — POST 请求体(需要 express.json 中间件)
  // - req.params  — URL 路径参数,如 /posts/:id → req.params.id
  // - req.query   — ?key=value 查询参数
  // - req.headers — 请求头
  // - req.user   — 自定义属性(中间件挂载)

  // res:响应对象
  res.status(201).json({ success: true })  // 返回 JSON + 状态码
  res.send('text')            // 返回文本
  res.redirect('/login')      // 重定向
  res.cookie('name', 'value') // 设置 cookie
})
```

---

## 4. 项目结构模式

本项目采用**经典三层架构**:

```
backend/src/
├── routes/      ← 路由层:定义 URL 和 HTTP 方法
├── controllers/ ← 控制层:接收请求、调用服务层
├── services/    ← 业务层:核心业务逻辑
└── middleware/  ← 中间件:认证、错误处理
```

**一个请求的完整生命周期**:

```
GET /api/posts

  → app.js 装载的全局中间件
  → /api 前缀匹配,进入 routes/index.js
  → post.routes.js 注册到 /posts
  → postController.getPosts(req, res)
  → postService.getPosts(options)
  → prisma.post.findMany(...)  ← 实际查询数据库
  ← 数据回传
  ← ApiResponse.success(res, data)  ← 统一格式
  → 返回 JSON 给客户端
```

**🌟 完整代码例子**(风迹集真实代码):

`backend/src/routes/post.routes.js`:
```js
const express = require('express')
const router = express.Router()
const Joi = require('joi')
const postController = require('../controllers/post.controller')
const { authenticate } = require('../middleware/auth.middleware')
const ApiResponse = require('../utils/response')

// 验证 schema(Joi)
const createPostSchema = Joi.object({
  title: Joi.string().required(),
  slug: Joi.string().required(),
  content: Joi.string().required(),
})

function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body)
    if (error) return ApiResponse.validationError(res, error.details[0].message)
    next()
  }
}

// 业务路由
router.get('/', postController.getPosts)
router.post('/', authenticate, validate(createPostSchema), postController.createPost)
router.get('/:id', postController.getPostById)
router.put('/:id', authenticate, postController.updatePost)
router.delete('/:id', authenticate, postController.deletePost)

module.exports = router
```

`backend/src/controllers/post.controller.js`:
```js
const postService = require('../services/post.service')
const ApiResponse = require('../utils/response')

async function getPosts(req, res, next) {
  try {
    const { page, limit, categoryId, search } = req.query
    const result = await postService.getPosts({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      // ...
    })
    return ApiResponse.success(res, result)
  } catch (error) {
    next(error)  // 交给错误中间件
  }
}

module.exports = { getPosts, /* ... */ }
```

`backend/src/services/post.service.js`:
```js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

class PostService {
  async getPosts(options = {}) {
    // ...组装查询条件...
    const posts = await prisma.post.findMany({ where, skip, take: 10 })
    const total = await prisma.post.count({ where })
    return { posts, pagination: { total, totalPages: Math.ceil(total / 10) } }
  }
}

module.exports = new PostService()
```

---

## 5. JWT 认证机制

### 5.1 流程

```
1. 登录:客户端 POST /auth/login → 服务端返回 token
2. 后续请求:客户端把 token 放在 Authorization 头里
3. 服务端中间件:验证 token,通过则把 userId 挂到 req.user
```

### 5.2 生成和验证

```js
const jwt = require('jsonwebtoken')

// 生成
const token = jwt.sign(
  { userId: 123 },  // payload(可塞任何信息)
  'secret-key',     // 签名密钥(生产环境要长随机字符串)
  { expiresIn: '15m' }
)

// 验证
const decoded = jwt.verify(token, 'secret-key')
console.log(decoded.userId)  // 123
```

### 5.3 中间件拦截

```js
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权' })
  }

  const token = authHeader.slice(7)

  try {
    const decoded = jwt.verify(token, SECRET)
    req.userId = decoded.userId
    next()
  } catch {
    return res.status(401).json({ error: 'Token 无效' })
  }
}

// 使用
router.post('/posts', authenticate, createPostController)
```

**🌟 真实例子**:见 `backend/src/middleware/auth.middleware.js`

---

## 6. Prisma ORM

对象关系映射(ORM)工具,本项目数据库交互层。

### 6.1 定义模型(Schema)

`prisma/schema.prisma`:
```prisma
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  slug      String   @unique
  content   String
  viewCount Int      @default(0)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])

  @@map("posts")
}
```

### 6.2 CRUD 操作

```js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// CREATE
const post = await prisma.post.create({
  data: { title: 'hi', slug: 'hello', content: '...', authorId: 1 }
})

// READ
const posts = await prisma.post.findMany()
const post = await prisma.post.findUnique({ where: { id: 1 } })

// UPDATE
await prisma.post.update({
  where: { id: 1 },
  data: { viewCount: 100 }
})

// DELETE
await prisma.post.delete({ where: { id: 1 } })

// 复杂查询
const posts = await prisma.post.findMany({
  where: {
    status: 'published',
    OR: [
      { title: { contains: search, mode: 'insensitive' } },
    ],
  },
  skip: 0,
  take: 10,
  orderBy: { createdAt: 'desc' },
  include: {                // JOIN
    author: { select: { username: true } },
    tags: { include: { tag: true } },
  },
})

// 计数 / 求和
const count = await prisma.post.count({ where: { isDeleted: false } })
const views = await prisma.post.aggregate({
  _sum: { viewCount: true },
  where: { authorId: 1 }
})
```

### 6.3 迁移(Migration)

```bash
# 改完 schema.prisma 后,生成迁移文件
npx prisma migrate dev --name add_field_xxx

# 应用迁移到数据库
npx prisma migrate deploy

# 重置数据库(慎用!)
npx prisma migrate reset
```

---

## 7. 文件上传(Multer)

```js
const multer = require('multer')
const path = require('path')

// 配置存储
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),  // 存放目录
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.random().toString().slice(2, 11)
    cb(null, unique + path.extname(file.originalname))  // 随机文件名
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5 MB
  fileFilter: (req, file, cb) => {
    if (/\.(jpg|png)$/i.test(file.originalname)) cb(null, true)
    else cb(new Error('类型不允许'))
  }
})

// 使用
router.post('/upload', upload.single('image'), (req, res) => {
  console.log(req.file)  // 上传的文件信息
  res.json({ url: '/uploads/' + req.file.filename })
})
```

---

## 8. 实战练习

### 任务:加一个"获取我的文章列表"接口

```js
// backend/src/routes/post.routes.js
router.get('/my/list', authenticate, async (req, res, next) => {
  try {
    const posts = await prisma.post.findMany({
      where: { authorId: req.userId, isDeleted: false }
    })
    res.json({ success: true, data: posts })
  } catch (error) {
    next(error)
  }
})
```

### 任务:加密密码

```js
const bcrypt = require('bcrypt')

// 注册时
const passwordHash = await bcrypt.hash(password, 10)  // 10 rounds

// 登录时验证
const isValid = await bcrypt.compare(password, user.password)
```

---

## ✅ 学完这一节你应该能

- [ ] 解释 Express 中间件的执行顺序
- [ ] 用 `prisma.xxx.findMany()` 写一个带筛选的查询
- [ ] 用 `req.body / req.params / req.query` 接收不同参数
- [ ] 写一个需要 JWT 验证的接口
- [ ] 解释三层架构(路由、控制器、服务)的分工

---

下一节:[05 — TypeScript 入门](./05-TypeScript入门.md) →
