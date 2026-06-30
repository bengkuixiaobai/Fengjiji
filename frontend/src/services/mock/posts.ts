// 文章 mock 数据 — 12 篇示例
import type { Post } from '../post'

// 共享作者信息
const author = {
  id: 1,
  username: 'fengjiji',
  nickname: '风迹集主',
  avatar: undefined as string | undefined,
}

const tag = (id: number, name: string, slug: string) => ({ id, name, slug })

export const mockPosts: Post[] = [
  {
    id: 1,
    title: '使用 React 18 + Vite 5 搭建现代化前端项目',
    slug: 'react-18-vite-5-setup',
    summary: '从零开始搭建一个生产级 React 项目,涵盖 TypeScript、路由、状态管理、UI 库选型与构建优化。',
    content: `# 前言

React 18 带来了并发渲染、自动批处理等全新能力,Vite 5 则提供了极致的开发体验。本文记录我从零搭建 \`fengjiji\` 前端项目的全过程。

## 技术选型

| 层级 | 选型 | 版本 |
|------|------|------|
| 框架 | React | 18.2 |
| 构建 | Vite | 5.1 |
| 语言 | TypeScript | 5.3 |
| 路由 | React Router | 6.22 |
| 状态 | Zustand | 4.5 |
| UI | Ant Design | 5.15 |

## 初始化项目

\`\`\`bash
npm create vite@latest fengjiji -- --template react-ts
cd fengjiji
npm install
\`\`\`

## 配置路径别名

\`\`\`ts
// vite.config.ts
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
\`\`\`

## 主题定制

Antd 5 的 \`ConfigProvider\` 让我们可以在入口处统一覆盖 token:

\`\`\`tsx
<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#667eea',
      borderRadius: 8,
    },
  }}
>
  <App />
</ConfigProvider>
\`\`\`

## 一些踩坑

1. **StrictMode 下副作用执行两次** — 仅在开发模式,生产只执行一次
2. **CSS Modules 与 Antd 的优先级** — 用 \`!important\` 解决
3. **Vite 代理** — 解决开发期跨域问题

> 工具是为业务服务的,不要为了用工具而用工具。

## 后续计划

- [ ] 接入 PWA
- [ ] 引入 React Query 做数据缓存
- [ ] 接入 Sentry 做错误监控
`,
    coverImage: undefined,
    viewCount: 1280,
    likeCount: 86,
    status: 'published',
    createdAt: '2026-05-20T09:30:00Z',
    publishedAt: '2026-05-20T09:30:00Z',
    author,
    category: { id: 1, name: '技术', slug: 'tech' },
    tags: [tag(1, 'React', 'react'), tag(2, 'TypeScript', 'typescript'), tag(3, 'Vite', 'vite'), tag(8, 'Ant Design', 'antd')],
  },
  {
    id: 2,
    title: 'Prisma + PostgreSQL: 类型安全的 ORM 实践',
    slug: 'prisma-postgresql-orm',
    summary: '用 Prisma 重构数据访问层,享受从数据库到前端的完整类型推导。',
    content: `# Prisma 入门

Prisma 是新一代 Node.js ORM,核心亮点是 **schema-first + 自动生成类型**。

## 定义 Schema

\`\`\`prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  author   User   @relation(fields: [authorId], references: [id])
  authorId Int
}
\`\`\`

## 迁移与生成

\`\`\`bash
npx prisma migrate dev --name init
npx prisma generate
\`\`\`

## 查询示例

\`\`\`ts
// 关联查询 — 一行搞定 author
const posts = await prisma.post.findMany({
  include: { author: true },
})
\`\`\`

## 性能建议

- 用 \`select\` 代替 \`include\`,只取需要的字段
- 大列表用 \`cursor\` 分页,避免 \`offset\` 性能衰减
- 复杂统计用 \`$queryRaw\`,必要时配合索引
`,
    coverImage: undefined,
    viewCount: 842,
    likeCount: 52,
    status: 'published',
    createdAt: '2026-05-15T14:20:00Z',
    publishedAt: '2026-05-15T14:20:00Z',
    author,
    category: { id: 1, name: '技术', slug: 'tech' },
    tags: [tag(4, 'Node.js', 'nodejs'), tag(6, 'Prisma', 'prisma'), tag(7, 'PostgreSQL', 'postgresql'), tag(2, 'TypeScript', 'typescript')],
  },
  {
    id: 3,
    title: 'Zustand vs Redux:轻量级状态管理的胜利',
    slug: 'zustand-vs-redux',
    summary: '为什么我最终选择 Zustand 而不是 Redux Toolkit,以及如何渐进式迁移。',
    content: `# 状态管理的取舍

Redux 一直是 React 生态的事实标准,但它的样板代码(boilerplate)也让很多项目望而却步。Zustand 提供了一个更轻量的替代方案。

## Zustand 的核心 API

\`\`\`ts
import { create } from 'zustand'

interface BearState {
  bears: number
  increase: (by: number) => void
}

const useBearStore = create<BearState>((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}))
\`\`\`

## 对比

| 维度 | Redux Toolkit | Zustand |
|------|---------------|---------|
| 体积 | ~13KB | ~1KB |
| 样板代码 | 中等 | 极少 |
| DevTools | 内置 | 通过中间件 |
| 学习曲线 | 较陡 | 平缓 |
| TS 支持 | 良好 | 优秀 |

## 适用场景

> 选择工具的核心是 **匹配团队规模与项目复杂度**。

- 小型项目 / 工具型应用 → Zustand
- 大型企业应用 / 多人协作 → Redux Toolkit
- 跨组件状态共享 → 都可以,但 Zustand 更轻
`,
    coverImage: undefined,
    viewCount: 634,
    likeCount: 41,
    status: 'published',
    createdAt: '2026-05-10T10:00:00Z',
    publishedAt: '2026-05-10T10:00:00Z',
    author,
    category: { id: 1, name: '技术', slug: 'tech' },
    tags: [tag(1, 'React', 'react'), tag(9, 'Zustand', 'zustand'), tag(11, '思考', 'thoughts')],
  },
  {
    id: 4,
    title: 'Express 4 中间件机制深度解析',
    slug: 'express-middleware-deep-dive',
    summary: '理解 Express 的洋葱模型,写出更稳健的服务端代码。',
    content: `# 中间件是什么

Express 的中间件是一个函数,可以访问请求对象 \`req\`、响应对象 \`res\` 和下一个中间件函数 \`next\`。

## 洋葱模型

\`\`\`
   ┌──────────────────────────────────┐
   │                                  │
   ▼                                  │
req ─► middleware 1 ─► middleware 2 ─►│ ─► handler ─► res
                                       │
                                       ◄── middleware 2 后置 ◄── middleware 1 后置
   └──────────────────────────────────┘
\`\`\`

## 常见中间件

\`\`\`ts
app.use(express.json())
app.use(cors())
app.use(morgan('dev'))
app.use(authMiddleware)
\`\`\`

## 错误处理中间件

注意 **4 个参数** 的签名,这是 Express 识别错误中间件的关键:

\`\`\`ts
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ success: false, error: err.message })
})
\`\`\`

## 实战建议

1. 业务中间件按职责拆分,不要全堆在一个文件
2. 异步中间件要包一层 try/catch 或用 \`express-async-errors\`
3. 关键路径打印日志,便于排障
`,
    coverImage: undefined,
    viewCount: 521,
    likeCount: 33,
    status: 'published',
    createdAt: '2026-05-05T16:45:00Z',
    publishedAt: '2026-05-05T16:45:00Z',
    author,
    category: { id: 1, name: '技术', slug: 'tech' },
    tags: [tag(4, 'Node.js', 'nodejs'), tag(5, 'Express', 'express'), tag(2, 'TypeScript', 'typescript')],
  },
  {
    id: 5,
    title: 'JWT 双 Token 机制的实践与思考',
    slug: 'jwt-double-token-pattern',
    summary: '为什么采用 accessToken + refreshToken 双 Token 设计,以及如何安全地落地。',
    content: `# 为什么需要双 Token

单一 Token 方案有一个根本矛盾:

- Token 有效期短 → 用户频繁被迫登录
- Token 有效期长 → 泄露后风险窗口大

**双 Token 机制** 是这个矛盾的标准解法:

| Token | 有效期 | 用途 |
|-------|--------|------|
| accessToken | 15 分钟 | 接口鉴权 |
| refreshToken | 7 天 | 刷新 accessToken |

## 关键实现

\`\`\`ts
// 服务端
const accessToken = jwt.sign({ userId }, SECRET, { expiresIn: '15m' })
const refreshToken = jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '7d' })
\`\`\`

## 刷新流程

\`\`\`
[前端]                                            [后端]
  │  GET /api/posts (accessToken)                  │
  ├──────────────────────────────────────────────►│
  │                                               │  verify
  │  401 (Token 过期)                             │
  │◄──────────────────────────────────────────────┤
  │                                               │
  │  POST /api/auth/refresh (refreshToken)        │
  ├──────────────────────────────────────────────►│
  │                                               │  verify + rotate
  │  { accessToken, refreshToken }                │
  │◄──────────────────────────────────────────────┤
\`\`\`

## 安全要点

1. refreshToken 必须 **rotate**(每次刷新都签发新的)
2. refreshToken 可以做 **服务端撤销表**
3. accessToken 不要放 localStorage(防 XSS),推荐 httpOnly cookie
`,
    coverImage: undefined,
    viewCount: 712,
    likeCount: 58,
    status: 'published',
    createdAt: '2026-04-28T11:15:00Z',
    publishedAt: '2026-04-28T11:15:00Z',
    author,
    category: { id: 1, name: '技术', slug: 'tech' },
    tags: [tag(4, 'Node.js', 'nodejs'), tag(11, '思考', 'thoughts'), tag(2, 'TypeScript', 'typescript')],
  },
  {
    id: 6,
    title: '《代码整洁之道》读书笔记',
    slug: 'clean-code-notes',
    summary: 'Robert C. Martin 的经典之作,关于命名、函数、注释、格式的工程实践。',
    content: `# 为什么要读这本书

工作三年后回看,最大的感受是:**写代码很容易,写好代码很难**。这本书不是教新语法,而是教 **职业素养**。

## 有意义的命名

> 如果名字需要注释来补充,那就不是好名字。

- 变量名要能 **回答 "为什么"** 而不是只描述 "是什么"
- 类名是名词,方法名是动词
- 避免 \`data\`、\`info\`、\`flag\` 这种泛词

## 函数的艺术

\`\`\`ts
// 不好 — 做了太多事
function process(data) { ... }

// 好 — 单一职责
function validate(data) { ... }
function save(data) { ... }
\`\`\`

原则:
1. 短小(20 行封顶)
2. 只做一件事
3. 参数越少越好(0 最佳,3 个需特别说明)
4. 无副作用

## 注释的克制

> 当你觉得自己需要写注释时,先想想能不能用代码表达。

好注释:
- 法律信息
- 解释 **为什么** 而不是 **做什么**
- TODO / FIXME

坏注释:
- 复述代码
- 日志式注释(\`// 2026-01-01 修改\`)
- 位置标记(\`/////////\`)

## 总结

这是一本需要反复读的书,每次重读都会有新的体感。
`,
    coverImage: undefined,
    viewCount: 458,
    likeCount: 39,
    status: 'published',
    createdAt: '2026-04-20T20:30:00Z',
    publishedAt: '2026-04-20T20:30:00Z',
    author,
    category: { id: 2, name: '生活', slug: 'life' },
    tags: [tag(10, '读书', 'reading'), tag(11, '思考', 'thoughts')],
  },
  {
    id: 7,
    title: '个人博客系统选型:从 WordPress 到自研',
    slug: 'blog-platform-selection',
    summary: '为什么我最终选择自研博客系统,以及风迹集的架构演进。',
    content: `# 选型背景

最早用过 WordPress、Hexo、Notion 公开页,各有各的痛点:

| 方案 | 优点 | 痛点 |
|------|------|------|
| WordPress | 生态成熟 | 部署重,定制难 |
| Hexo | 静态化快 | 写新文章要重新构建 |
| Notion | 上手快 | 私有化困难,搜索弱 |

最终我决定 **自研**,目标是:
- Markdown 实时预览
- 前后端分离
- 项目管理 + 博客一体化

## 技术决策

- **前端**:React + Vite,首屏 < 2s
- **后端**:Express + Prisma,易部署
- **数据库**:PostgreSQL,关系型 + JSON 字段
- **认证**:JWT 双 Token

## 架构演进

\`\`\`
v1.0  基础博客 CRUD(当前)
  ↓
v2.0  全文检索 + 推荐
  ↓
v3.0  PWA + 离线访问
\`\`\`

> 自研不是目的,**掌控感和定制自由度** 才是。
`,
    coverImage: undefined,
    viewCount: 376,
    likeCount: 27,
    status: 'published',
    createdAt: '2026-04-15T08:00:00Z',
    publishedAt: '2026-04-15T08:00:00Z',
    author,
    category: { id: 3, name: '项目', slug: 'projects' },
    tags: [tag(11, '思考', 'thoughts'), tag(12, '工具', 'tools')],
  },
  {
    id: 8,
    title: '看板方法论:从 GTD 到 Kanban',
    slug: 'kanban-methodology',
    summary: '为什么我用看板管理个人项目,以及怎么用三列把任务流可视化。',
    content: `# 为什么需要看板

GTD 强调"把所有任务装进清单",但清单一长就容易 **焦虑**。看板的核心是 **限制在制品(WIP)**,强制聚焦。

## 三列结构

- **规划中** — 已识别但未开始
- **进行中** — 当前专注
- **已完成** — 历史沉淀

## 使用规范

1. 同一时间最多 3 个 "进行中" 任务
2. 卡住的任务主动升级,**不要原地等待**
3. 每周末做一次回顾

## 在风迹集的落地

\`\`\`tsx
<DragDropContext onDragEnd={handleDragEnd}>
  {stages.map(stage => (
    <Droppable key={stage.id} droppableId={String(stage.id)}>
      {stage.tasks.map(task => (
        <Draggable key={task.id} draggableId={String(task.id)}>
          {(provided) => <TaskCard {...provided.draggableProps} {...provided.dragHandleProps} />}
        </Draggable>
      ))}
    </Droppable>
  ))}
</DragDropContext>
\`\`\`

## 完成度计算

\`\`\`ts
const completionRate = (completedTasks / totalTasks) * 100
\`\`\`

可视化的进度数字,本身就是动力来源。
`,
    coverImage: undefined,
    viewCount: 298,
    likeCount: 24,
    status: 'published',
    createdAt: '2026-04-08T15:30:00Z',
    publishedAt: '2026-04-08T15:30:00Z',
    author,
    category: { id: 3, name: '项目', slug: 'projects' },
    tags: [tag(11, '思考', 'thoughts'), tag(12, '工具', 'tools')],
  },
  {
    id: 9,
    title: 'TypeScript 5 新特性速览',
    slug: 'typescript-5-features',
    summary: 'const 类型参数、装饰器标准化、枚举改进 — 5 分钟了解 TS 5 的关键升级。',
    content: `# TS 5 值得升级吗

**值得**。本文列出几个最实用的新特性。

## const 类型参数

\`\`\`ts
// 旧写法
function uniq<T>(arr: T[]): T[] { ... }

// 新写法 — 推断更精确
function uniq<const T>(arr: T[]): T[] { ... }

const arr = uniq([1, 2, 3])
//   ^? readonly [1, 2, 3]
\`\`\`

## 装饰器(Stage 3)

\`\`\`ts
function logged(target: any, name: string) {
  console.log(\`调用: \${name}\`)
}

class Foo {
  @logged
  bar() { ... }
}
\`\`\`

## enum 改进

联合类型 + 字面量类型通常优于 enum,但当必须用 enum 时,TS 5 提供了更友好的报错。

## satisfies 运算符

\`\`\`ts
type Config = { port: number; host: string }
const config = { port: 3000, host: 'localhost' } satisfies Config
// config.port 仍然是字面量 3000
\`\`\`

> 类型系统是为开发效率服务的,不要成为负担。
`,
    coverImage: undefined,
    viewCount: 412,
    likeCount: 31,
    status: 'published',
    createdAt: '2026-04-01T13:00:00Z',
    publishedAt: '2026-04-01T13:00:00Z',
    author,
    category: { id: 1, name: '技术', slug: 'tech' },
    tags: [tag(2, 'TypeScript', 'typescript'), tag(1, 'React', 'react')],
  },
  {
    id: 10,
    title: '春日随笔:关于"持续做一件事"',
    slug: 'spring-essay-persistence',
    summary: '坚持写作三年,关于"持续做一件事"的几个观察。',
    content: `# 写在前面的碎碎念

今天突然意识到,这个博客已经是 **第三年** 了。中间停更过几次,但每次都回来了。

## 关于"持续"

- **不需要每天做** — 重要的是 **不断**
- **不要追求完美** — 完成比完美重要
- **建立仪式感** — 我习惯早上 9 点开一杯咖啡,坐到桌前就进入状态

## 关于"输出"

输出是 **最好的学习**。你以为懂了,但写不出来,说明还没懂。

## 关于"读者"

博客读者很少,但每个读者都很珍贵。有一两个认真评论的人,胜过一万个 PV。

> 慢一点没关系,只要不停下来。

## 一些数据

- 累计发文:42 篇
- 最受欢迎:React 18 + Vite 5 搭建指南(单篇 1280 阅读)
- 最冷门:某篇关于个人理财的随笔(34 阅读)

## 下一年目标

1. 把项目管理系统做到 v1.0
2. 写 20 篇技术文章 + 5 篇生活随笔
3. 开一个 newsletter
`,
    coverImage: undefined,
    viewCount: 187,
    likeCount: 22,
    status: 'published',
    createdAt: '2026-03-25T07:30:00Z',
    publishedAt: '2026-03-25T07:30:00Z',
    author,
    category: { id: 2, name: '生活', slug: 'life' },
    tags: [tag(11, '思考', 'thoughts'), tag(10, '读书', 'reading')],
  },
  {
    id: 11,
    title: '用 Vite 构建库而不是应用',
    slug: 'vite-library-mode',
    summary: 'Vite 不仅能做应用,也能打包可发布的 npm 库。配置 Library Mode 全流程。',
    content: `# Vite Library Mode

当我们想把组件库 / 工具函数发布到 npm 时,Vite 提供了开箱即用的 **Library Mode**。

## 配置

\`\`\`ts
// vite.config.ts
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'MyLib',
      formats: ['es', 'cjs'],
      fileName: (format) => \`my-lib.\${format}.js\`,
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
    },
  },
  plugins: [dts()],
})
\`\`\`

## 构建产物

\`\`\`
dist/
├── my-lib.es.js
├── my-lib.cjs.js
├── my-lib.d.ts
└── style.css
\`\`\`

## 发布

\`\`\`bash
npm login
npm publish --access public
\`\`\`

## 常见坑

1. **样式** 记得单独导出 CSS
2. **peerDependencies** 标记 React 等宿主包
3. **source maps** 发布 \`.map\` 便于调试

> 工具的复用,是最朴素的杠杆。
`,
    coverImage: undefined,
    viewCount: 165,
    likeCount: 14,
    status: 'published',
    createdAt: '2026-03-18T19:00:00Z',
    publishedAt: '2026-03-18T19:00:00Z',
    author,
    category: { id: 1, name: '技术', slug: 'tech' },
    tags: [tag(3, 'Vite', 'vite'), tag(2, 'TypeScript', 'typescript')],
  },
  {
    id: 12,
    title: '一封写给三年后的信',
    slug: 'letter-to-future-self',
    summary: '如果可以穿越时空,我想对三年后的自己说什么。',
    content: `# 亲爱的三年后的我

写下这封信的时候,是 2026 年初春。

如果你看到这封信,说明你还记得打开这个博客。**谢了**。

我希望三年后的你:

## 还保持好奇

技术更迭很快,但 **好奇心** 才是驱动学习的最底层燃料。希望你还在读源码、写 side project、追新东西。

## 还保持真诚

写博客不是为了流量,是为了 **整理思绪**。希望你没有被数据绑架。

## 还保持健康

工作很重要,但身体是 1,其他都是后面的 0。

## 还保持联系

朋友、家人、初恋…希望他们都还在你的生命中。

---

三年后再读这封信,无论你身处什么境地:

> **你已经做得很好了。继续。**

—— 2026 年春的你
`,
    coverImage: undefined,
    viewCount: 142,
    likeCount: 18,
    status: 'published',
    createdAt: '2026-03-10T22:00:00Z',
    publishedAt: '2026-03-10T22:00:00Z',
    author,
    category: { id: 4, name: '随笔', slug: 'essays' },
    tags: [tag(11, '思考', 'thoughts')],
  },
]