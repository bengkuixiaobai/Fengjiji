# 05 — TypeScript 入门

> 学完你就能:看懂本项目所有 `.ts` `.tsx` 后缀文件

---

## 1. 什么是 TypeScript?

**TypeScript = JavaScript 的超集**(增加了类型系统)

```
.js  →  Node.js / 浏览器直接运行
.ts  →  需要先编译成 .js
.tsx →  TypeScript + JSX(React 用的语法)
```

**类比**:
- JavaScript = 一张白纸,你可以写任何东西
- TypeScript = 你写得再加一层"格子纸",每个数据有自己的格子(类型),写错编译器立刻提醒

---

## 2. 为什么要用 TS?

```js
// JS — 运行时才发现错误
const x = '5'
const y = x * 2  // '5' * 2 = 10(运行时数字)
x.push(1)        // ❌ 报错!TypeError:x.push is not a function
                  // 这种错误只在运行后才知道
```

```ts
// TS — 写代码时就报错(红色波浪线)
const x: string = '5'
const y: number = x * 2  // ✅ 自动推断类型
x.push(1)                // ❌ IDE 红线:Property 'push' does not exist on type 'string'
                          // 写代码时就看到了,不用等到运行时!
```

---

## 3. 基础类型

### 3.1 简单类型

```ts
// 基础类型
const name: string = '风迹集'
const age: number = 18
const isOk: boolean = true
const nothing: null = null
const notDefined: undefined = undefined

// any — 任意类型(不要滥用!)
const value: any = 'hello'

// unknown — 不确定类型(更安全)
const data: unknown = fetchSomeData()

// void — 函数没有返回值
function log(msg: string): void {
  console.log(msg)
}

// never — 永远不会发生
function throwError(): never {
  throw new Error('oops')
}
```

### 3.2 数组

```ts
const nums: number[] = [1, 2, 3]
const names: Array<string> = ['a', 'b']  // 另一种写法
const mixed: (string | number)[] = ['a', 1]
```

### 3.3 对象

```ts
// 写法 1:直接定义
const user: { name: string; age: number } = { name: '小明', age: 18 }

// 写法 2:用 type 关键字
type User = {
  name: string
  age: number
  email?: string          // ? 表示可选
  readonly id: number     // readonly 只读
}
```

### 3.4 函数

```ts
// 完整签名
function add(a: number, b: number): number {
  return a + b
}

// 可选参数
function greet(name: string, greeting?: string): string {
  return greeting ? `${greeting},${name}` : `你好,${name}`
}

// 默认参数
function greet2(name: string, greeting: string = '你好'): string { ... }

// 箭头函数
const add2 = (a: number, b: number): number => a + b
```

---

## 4. interface 与 type

### 4.1 interface(首选,描述对象形状)

```ts
interface Post {
  id: number
  title: string
  content: string
  authorId: number
  tags?: string[]          // 可选
  readonly createdAt: Date // 只读
}

// 使用
function getPost(post: Post): void { ... }

// 扩展
interface Article extends Post {
  category: string
}
```

### 4.2 type(更灵活)

```ts
type Status = 'draft' | 'published'        // 字面量联合
type T = string | number                   // 联合类型
type PostCreate = Omit<Post, 'id'>         // 从 Post 拿掉 id

// 复杂对象
type ApiResponse<T> = {
  success: boolean
  data: T
  message?: string
}
```

### 4.3 项目里的实际例子

```ts
// frontend/src/services/post.ts
export interface Post {
  id: number
  title: string
  slug: string
  content: string
  coverImage?: string         // 可选
  viewCount: number
  likeCount: number
  status: string
  createdAt: string
  author: {
    id: number
    username: string
    nickname?: string
    avatar?: string
  }
  category?: {
    id: number
    name: string
    slug: string
  }
  tags: {
    id: number
    name: string
    slug: string
  }[]
}

export interface PostsResponse {
  success: boolean
  data?: {
    posts: Post[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export async function getPosts(params?: {
  page?: number
  limit?: number
  search?: string
}): Promise<PostsResponse> { ... }
```

---

## 5. 泛型(Generics)

让组件/函数支持多种类型。

```ts
// T 是类型变量,用时再传入
function getFirst<T>(arr: T[]): T | undefined {
  return arr[0]
}

getFirst([1, 2, 3])           // T 自动推断为 number
getFirst(['a', 'b'])          // T 自动推断为 string
getFirst<User>([user1, user2]) // 显式指定
```

**🌟 真实例子**:

```ts
// React 组件
function List<T>({ items, render }: { items: T[]; render: (item: T) => ReactNode }) { ... }

// API 响应
type ApiResponse<T> = {
  success: boolean
  data: T
}

// Promise<PostsResponse>
```

---

## 6. 类型断言

告诉 TS:"我知道这个值是什么类型,相信我!"

```ts
// 写法 1:as
const value = document.querySelector('#app') as HTMLDivElement
value.innerText = 'hello'

// 写法 2:尖括号(不推荐与 JSX 冲突)
const value2 = <HTMLDivElement>document.querySelector('#app')
```

⚠️ **类型断言是逃生舱**,用错会让运行时炸。和 `any` 一样谨慎使用。

---

## 7. 实用模式

### 7.1 联合类型 + 判别

```ts
type Response =
  | { success: true; data: any }
  | { success: false; error: { code: string; message: string } }

const res: Response = { success: true, data: { id: 1 } }

if (res.success) {
  console.log(res.data)        // TS 知道这里是 success=true
} else {
  console.log(res.error.code)  // TS 知道这里是 success=false
}
```

### 7.2 Partial / Required / Pick / Omit

```ts
interface User { id: number; name: string; email: string; avatar?: string }

Partial<User>           // 所有字段都可选
Required<User>          // 所有字段都必填
Pick<User, 'name'>      // 只保留 name
Omit<User, 'id'>        // 去掉 id
```

### 7.3 ?? 和 ?.

```ts
const u: User | null = fetchUser()

// 可选链 — 安全访问
console.log(u?.name)

// 空值合并 — 提供默认值
const name = u?.name ?? '匿名'
```

---

## 8. tsconfig.json

TypeScript 的配置文件,本项目里它长这样:

```json
{
  "compilerOptions": {
    "target": "ES2020",                  // 编译成 ES2020 语法
    "lib": ["ES2020", "DOM"],            // 可用的全局 API
    "module": "ESNext",                  // 用 ES Modules
    "moduleResolution": "Bundler",       // 用 Vite 解析
    "jsx": "react-jsx",                  // 支持 React JSX
    "strict": true,                      // 开启严格模式(强烈推荐)
    "esModuleInterop": true,             // 兼容 CommonJS
    "skipLibCheck": true                 // 跳过第三方类型检查
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

---

## 9. React + TS 中的模式

### 9.1 组件 Props

```tsx
// 写法 1:interface
interface ButtonProps {
  text: string
  onClick?: () => void
  disabled?: boolean
}

function Button(props: ButtonProps) {
  return <button onClick={props.onClick}>{props.text}</button>
}

// 写法 2:解构
function Button({ text, onClick, disabled = false }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>{text}</button>
}

// 写法 3:对象式(项目中最常见)
interface UserCardProps {
  user: User
  onEdit?: (id: number) => void
}
```

### 9.2 事件类型

```tsx
// 输入框
const [value, setValue] = = useState('')
<input onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)} />

// 鼠标
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { ... }

// 表单提交
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
}
```

### 9.3 useState 类型

```tsx
// 自动推断
const [count, setCount] = useState(0)        // number
const [name, setName] = useState('')         // string

// 显式指定
const [user, setUser] = useState<User | null>(null)
```

### 9.4 useRef 类型

```tsx
const ref = useRef<HTMLInputElement>(null)
ref.current?.focus()
```

---

## 10. 本项目 TS 实战速读

### 10.1 状态管理(Store)

```ts
// frontend/src/stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  username: string
  email: string
  nickname?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        set({ user, token, isAuthenticated: true })
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',  // localStorage key
    }
  )
)
```

**类型解释**:
- `create<AuthState>()(persist(...))` — 用泛型告诉 zustand 状态类型
- `set({ user, token, isAuthenticated: true })` — 函数参数的类型都自动推断

### 10.2 服务层(API)

```ts
// frontend/src/services/auth.ts
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', data)
  return response.data  // AuthResponse 类型自动推断
}
```

---

## 11. 编译报错速查

| 报错 | 原因 |
|------|------|
| `Type 'string' is not assignable to type 'number'` | 字符串赋给数字变量 |
| `Property 'xxx' does not exist on type 'yyy'` | 类型上没有这个属性 |
| `Object is possibly 'undefined'` | 解构/访问可能为空的对象 |
| `Cannot find name 'xxx'` | 没有 import 或拼错 |
| `Expected N arguments, but got M` | 函数参数数量不对 |

**遇到问题**:
1. 把鼠标悬停在红色波浪线上,VSCode 会给提示
2. 命令行运行 `npx tsc --noEmit` 看所有错误
3. TypeScript Playground 在线实验:`https://www.typescriptlang.org/play`

---

## ✅ 学完这一节你应该能

- [ ] 解释为什么用 TypeScript 而不是 JS
- [ ] 给变量、函数、组件加类型
- [ ] 读懂 interface 和 type 区别
- [ ] 处理常见编译错误
- [ ] 在本项目里读懂 `interface X { ... }` 这样的类型定义

---

下一节:[06 — React 入门](./06-React入门.md) →

> 💡 **动手时间**:把本项目 `frontend/src/services/post.ts` 里 `interface Post` 看完,你会发现它就是这个项目"文章"形状的完整描述。
