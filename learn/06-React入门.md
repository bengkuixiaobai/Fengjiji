# 06 — React 入门

> 学完你就能:看懂和写本项目所有页面、组件、状态管理

---

## 1. React 是什么?

**React = Facebook 开发的 UI 库**,用 JS 描述界面长什么样。

传统开发:手动操作 DOM:

```js
const title = document.querySelector('#title')
title.innerText = '新标题'
title.style.color = 'red'   // 痛苦地操作 DOM
```

React:

```jsx
const [title, setTitle] = useState('新标题')
return <h1 style={{ color: 'red' }}>{title}</h1>   // 描述想要什么,React 自动更新
```

**核心思想**:声明式、组件化、一次学习多端(React/React Native)

---

## 2. 第一个组件

```tsx
// src/Welcome.tsx
import { useState } from 'react'

interface WelcomeProps {
  name: string
}

export default function Welcome({ name }: WelcomeProps) {
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1>欢迎,{name}!</h1>
      <p>你点了 {count} 次</p>
      <button onClick={() => setCount(count + 1)}>点我</button>
    </div>
  )
}
```

使用:

```tsx
<Welcome name="风迹集" />
```

---

## 3. JSX 语法

JSX = JavaScript + XML,允许在 JS 中写 HTML。

```tsx
const name = '小明'

// JS 表达式用 {} 包起来
const jsx = (
  <div className="container">
    <h1>{name}</h1>
    <p>2 + 2 = {2 + 2}</p>
    {loggedIn ? <p>已登录</p> : <p>请登录</p>}
    {items.map(item => <Card key={item.id} item={item} />)}
  </div>
)
```

**JSX 规则**:
- 标签必须闭合:`<img />` `<br />`
- 属性用 camelCase:`className`(不是 `class`)、`onClick`(不是 `onclick`)
- 单根元素(或用 `<>...</>` Fragment 包起来)

```tsx
// 一个返回多个元素
return (
  <>
    <Header />
    <Main />
    <Footer />
  </>
)
```

---

## 4. 三大核心概念

### 4.1 state(状态)

**状态 = 组件内随时变动的数据**。

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(prev => prev - 1)}>-1</button>
    </div>
  )
}
```

**常见错误**(详细解释见"踩坑"章节):

```tsx
// ❌ 直接修改 state
count = count + 1

// ❌ 修改对象(没创建新对象)
user.name = 'new'

// ✅ 正确的做法
setCount(count + 1)
setUser({ ...user, name: 'new' })
```

### 4.2 props(组件间传值)

**props = 父组件传给子组件的参数**。

```tsx
interface CardProps {
  title: string
  content: string
  onDelete: (id: number) => void
}

function Card({ title, content, onDelete }: CardProps) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <p>{content}</p>
      <button onClick={() => onDelete(123)}>删除</button>
    </div>
  )
}

// 父组件用
<Card
  title="标题"
  content="内容"
  onDelete={(id) => console.log('删除', id)}
/>
```

**单向数据流**:数据只能父 → 子,不能反过来。

### 4.3 组件怎么放数据?

```
┌────────────────────────────────────────────────┐
│  1. 只在这一个组件用 → 用 useState             │
├────────────────────────────────────────────────┤
│  2. 父子之间共享 → 用 props                    │
├────────────────────────────────────────────────┤
│  3. 多层组件共享 / 全局 → 用 Context 或 Store   │
└────────────────────────────────────────────────┘
```

---

## 5. Hooks(函数组件的能力)

### 5.1 useEffect(副作用)

**副作用** = 不只是返回数据的操作(API 请求、订阅、手动改 DOM...)

```tsx
import { useState, useEffect } from 'react'

function UserInfo({ userId }: { userId: number }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // 组件渲染后执行
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data))
  }, [userId])  // 依赖数组:userId 变了才重跑

  return <div>{user?.name}</div>
}
```

**三种依赖**:
```tsx
useEffect(() => { /* 每次都跑 */ })                       // 不传依赖数组
useEffect(() => { /* 只跑一次 */ }, [])                   // 空数组
useEffect(() => { /* userId 变了才跑 */ }, [userId])      // 指定依赖
```

**清理函数**:
```tsx
useEffect(() => {
  const id = setInterval(() => console.log('tick'), 1000)

  return () => {
    // 组件卸载或下一次 effect 前清理
    clearInterval(id)
  }
}, [])
```

### 5.2 useRef(拿到 DOM 元素)

```tsx
import { useRef } from 'react'

function TextInput() {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input ref={inputRef} />
      <button onClick={() => inputRef.current?.focus()}>聚焦</button>
    </>
  )
}
```

### 5.3 useMemo / useCallback(性能优化)

```tsx
const [count, setCount] = useState(0)
const [name, setName] = useState('')

// useMemo — 缓存计算结果,只在依赖变化时重算
const expensive = useMemo(() => {
  return posts.filter(p => p.title.includes(name))
}, [posts, name])

// useCallback — 缓存函数引用,避免子组件不必要重渲染
const handleClick = useCallback((id: number) => {
  console.log(id)
}, [])
```

**🌟 真实例子**:

```tsx
// frontend/src/main.tsx — 用 useMemo 缓存主题配置
const antdTheme = useMemo(
  () => (isDarkMode ? darkTheme : lightTheme),
  [isDarkMode]
)
```

---

## 6. 路由(React Router)

本项目用 [React Router 6](https://reactrouter.com/)。

### 6.1 基本路由

```tsx
import { Routes, Route, Link } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      {/* 导航链接 */}
      <Link to="/">首页</Link>
      <Link to="/about">关于</Link>

      {/* 路由匹配 */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/user/:id" element={<User />} />  {/* 动态 */}
        <Route path="*" element={<NotFound />} />     {/* 兜底 */}
      </Routes>
    </BrowserRouter>
  )
}
```

### 6.2 编程式跳转(代码触发)

```tsx
import { useNavigate } from 'react-router-dom'

function MyButton() {
  const navigate = useNavigate()

  return (
    <>
      <button onClick={() => navigate('/login')}>去登录</button>
      <button onClick={() => navigate(-1)}>返回上一页</button>
      <button onClick={() => navigate('/user/' + userId, { replace: true })}>
        替换当前历史记录
      </button>
    </>
  )
}
```

### 6.3 受保护的路由

```tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

<Route path="/" element={
  <ProtectedRoute>
    <Home />
  </ProtectedRoute>
} />
```

### 6.4 Lazy loading(代码分割)

```tsx
import { lazy, Suspense } from 'react'

// 路由级懒加载 — 减少首屏下载量
const Home = lazy(() => import('./pages/Home'))
const Profile = lazy(() => import('./pages/Profile'))

function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  )
}
```

**🌟 真实例子**:

```tsx
// frontend/src/App.tsx
const Home = lazy(() => import('./pages/Home'))
const BlogEditor = lazy(() => import('./pages/BlogEditor'))
// ... 等等 17 个页面都这么加载
```

### 6.5 URL Search Params

```tsx
import { useSearchParams } from 'react-router-dom'

function BlogList() {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1')
  const search = searchParams.get('q') ?? ''

  return (
    <div>
      当前页:{page},搜索:{search}
      <button onClick={() => setSearchParams({ page: '2' })}>下一页</button>
    </div>
  )
}
```

---

## 7. 状态管理:Zustand

本项目用 Zustand,比 Redux 简单 90%。

### 7.1 为什么需要状态管理?

```tsx
// 简单的不需要 — useState 就够
function Counter() {
  const [count, setCount] = useState(0)
}

// 复杂场景 — 多组件共享同一份状态
// ❌ 用 props 一层层传,代码会变成「props 钻洞」
// ✅ 用 zustand 的 store
```

### 7.2 创建 Store

```tsx
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

export const useCounterStore = create<CounterState>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))
```

### 7.3 在组件里用

```tsx
function CounterDisplay() {
  const count = useCounterStore((state) => state.count)
  return <p>当前:{count}</p>
}

function CounterButton() {
  const increment = useCounterStore((state) => state.increment)
  return <button onClick={increment}>+1</button>
}
```

### 7.4 persist 中间件(自动存 localStorage)

```tsx
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // ...state 和方法
    }),
    {
      name: 'auth-storage',  // localStorage key
      partialize: (state) => ({ user: state.user, token: state.token })  // 只存这些
    }
  )
)
```

**🌟 真实例子**:见 `frontend/src/stores/authStore.ts` 和 `themeStore.ts`

---

## 8. UI 组件库:Ant Design

本项目用 Ant Design 5(以下简称 antd)。

### 8.1 引入

```tsx
import { Button, Input, Card, message } from 'antd'
import 'antd/dist/reset.css'  // 样式文件
```

### 8.2 主要组件速览

```tsx
// 按钮
<Button type="primary">主按钮</Button>
<Button danger>危险</Button>
<Button onClick={handleClick}>点击</Button>

// 表单
const [form] = Form.useForm()
<Form form={form} onFinish={(values) => console.log(values)}>
  <Form.Item name="username" rules={[{ required: true }]}>
    <Input placeholder="用户名" />
  </Form.Item>
  <button type="submit">提交</button>
</Form>

// 弹窗
Modal.confirm({
  title: '确认?',
  onOk: () => console.log('ok'),
})

// 表格
<Table dataSource={posts} columns={columns} rowKey="id" />

// 消息提示
message.success('保存成功')
message.error('保存失败')

// 布局
<Row gutter={16}>
  <Col span={12}>左</Col>
  <Col span={12}>右</Col>
</Row>
```

### 8.3 Modal 弹窗更完整的例子

```tsx
<Modal
  title="标题"
  open={visible}
  onCancel={() => setVisible(false)}
  onOk={handleSave}
>
  <p>弹窗内容</p>
</Modal>
```

### 8.4 主题

```tsx
import { ConfigProvider, theme } from 'antd'

<ConfigProvider
  locale={zhCN}  // 中文
  theme={{
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: { colorPrimary: '#667eea' }
  }}
>
  {/* ... */}
</ConfigProvider>
```

**🌟 真实例子**:见 `frontend/src/main.tsx`

---

## 9. 项目结构与组件组合

```
src/
├── pages/        ← 路由级页面
├── components/   ← 跨页面共享的组件
├── services/     ← API 调用
├── stores/       ← 全局状态
└── hooks/        ← 自定义 hooks
```

### 9.1 组件组合 vs props

```tsx
// ✅ 用 children(更灵活)
function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="content">{children}</div>
    </div>
  )
}

<Card title="用户">
  <p>内容 1</p>
  <p>内容 2</p>
</Card>
```

### 9.2 自定义 Hooks

```tsx
// hooks/useUserAvatar.ts
export function useUserAvatar() {
  const [avatar, setAvatar] = useState(getStoredAvatar())

  useEffect(() => {
    localStorage.setItem('user-avatar', avatar)
  }, [avatar])

  return { avatar, setAvatar }
}

// 用
function Profile() {
  const { avatar, setAvatar } = useUserAvatar()
  return <img src={avatar} />
}
```

**🌟 真实例子**:

```tsx
// frontend/src/hooks/useUserAvatar.ts
// frontend/src/hooks/useGreetingBg.ts
// frontend/src/hooks/useThemeBg.ts
```

---

## 10. 列表与 key

```tsx
const posts = [ {id: 1, title: 'A'}, {id: 2, title: 'B'} ]

return (
  <div>
    {posts.map(post => (
      <article key={post.id}>
        <h3>{post.title}</h3>
      </article>
    ))}
  </div>
)
```

**`key` 是干嘛的?**
- 让 React 知道哪些变了、哪些没变
- 必须是稳定的唯一值(`id`、uuid,不用 index)

---

## 11. 常见踩坑

| 错误 | 解决 |
|------|------|
| `Cannot read property 'X' of undefined` | 用可选链:`obj?.X` |
| `Each child in a list should have a unique "key" prop` | 给 map 加 `key={item.id}` |
| 修改 state 没生效 | 你可能修改了对象/数组本身,要用新对象 |
| 组件无限重渲染 | useEffect 没传依赖数组,或依赖错了 |
| 找不到变量 | 检查 `import`、作用域 |

### 11.1 setState 异步性

```tsx
const [count, setCount] = useState(0)

const handleClick = () => {
  setCount(count + 1)
  console.log(count)  // 0!(setCount 是异步的)
  // 解决:用 setTimeout 或 useEffect 观察
}
```

### 11.2 闭包陷阱

```tsx
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1)  // count 是初始值!不是最新的
  }, 1000)
  return () => clearInterval(id)
}, [])  // 空数组,只第一次执行

// ✅ 用函数式更新
useEffect(() => {
  const id = setInterval(() => {
    setCount(c => c + 1)  // c 是最新值
  }, 1000)
  return () => clearInterval(id)
}, [])
```

---

## 12. API 调用(Axios)

本项目用 axios 封装了 `apiClient`:

```tsx
// frontend/src/services/apiClient.ts
const apiClient = axios.create({ baseURL: '/api' })

apiClient.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${localStorage.getItem('auth-token')}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

在页面里用:

```tsx
function Posts() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    apiClient.get('/posts').then(res => setPosts(res.data.data.posts))
  }, [])

  return <div>{posts.length} 篇文章</div>
}
```

---

## 13. 性能优化清单

| 技巧 | 在本项目的体现 |
|------|---------------|
| lazy + Suspense | App.tsx 路由级懒加载 |
| Code Splitting | `vite.config.ts` 的 manualChunks |
| useMemo | `main.tsx` 的 antdTheme |
| 防止不必要重新渲染 | 子组件用 React.memo 包 |
| 防抖 | search 输入框 |
| 请求合并 | `Promise.all` 并行请求 |

---

## ✅ 学完这一节你应该能

- [ ] 写一个完整的 React 组件(JSX + state + props + effect)
- [ ] 用 react-router 配置多页应用
- [ ] 用 Zustand 创建和消费 store
- [ ] 用 antd 的 Form/Modal/Table/Message 组件
- [ ] 找出一个 UI 组件的"位置"(页面 vs 通用组件)

---

下一节:[07 — 数据库与 SQL](./07-数据库与SQL.md) →

> 💡 **动手时间**:打开本项目 `frontend/src/pages/Blog/BlogList.tsx`,看一遍 — 现在你应该能 80% 看懂了!
