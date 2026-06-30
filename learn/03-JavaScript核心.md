# 03 — JavaScript 核心

> 学完你就能:读懂本项目 80% 的代码

---

## 1. 运行你的第一段 JS

### 1.1 浏览器控制台

按 F12 → Console 标签,输入:

```js
console.log('hello world')
```

### 1.2 命令行

新建 `hello.js`,内容:

```js
console.log('hello')
```

命令行运行:

```bash
node hello.js
```

---

## 2. 基础语法

### 2.1 变量

```js
// const:常量,不能重新赋值
const name = '风迹集'

// let:变量,可以重新赋值
let age = 18
age = 19     // OK

// var:旧语法,不推荐
var x = 10

// 不用 var,因为它有不合理的作用域规则
```

**命名规则**:
- 字母、数字、下划线、美元符号
- 不能以数字开头
- 推荐驼峰:`myVariableName`

### 2.2 数据类型

```js
// 数字
const num = 42
const pi = 3.14

// 字符串(三种写法,推荐反引号)
const s1 = '单引号'
const s2 = "双引号"
const s3 = `反引号 — 支持 ${变量}`  // 模板字符串

// 布尔
const isOk = true
const no = false

// 空
const a = null
const b = undefined
```

**查看类型**:

```js
typeof 'hello'  // 'string'
typeof 123      // 'number'
```

### 2.3 控制流

```js
// 条件
if (age >= 18) {
  console.log('成年人')
} else if (age >= 12) {
  console.log('青少年')
} else {
  console.log('小孩')
}

// 三目运算符
const status = age >= 18 ? 'adult' : 'minor'

// switch
switch (day) {
  case 1: console.log('周一'); break
  case 2: console.log('周二'); break
  default: console.log('其他')
}
```

### 2.4 循环

```js
// 普通 for
for (let i = 0; i < 10; i++) {
  console.log(i)
}

// for...of (遍历数组)
const arr = [1, 2, 3]
for (const x of arr) {
  console.log(x)  // 1, 2, 3
}

// for...in (遍历对象的 key)
const obj = { a: 1, b: 2 }
for (const k in obj) {
  console.log(k, obj[k])  // 'a' 1, 'b' 2
}

// while
let i = 0
while (i < 10) {
  i++
}
```

---

## 3. 函数

### 3.1 声明函数

```js
// 函数声明(会提升,可在定义前调用)
function add(a, b) {
  return a + b
}

// 函数表达式(更常用)
const add = function(a, b) {
  return a + b
}

// 箭头函数(ES6+ 最流行)
const add = (a, b) => a + b

// 异步箭头函数
const fetchData = async () => {
  return await fetch('/api/posts')
}
```

### 3.2 默认参数

```js
function greet(name = '匿名') {
  return '你好,' + name
}

greet()         // '你好,匿名'
greet('小明')   // '你好,小明'
```

### 3.3 数组方法(本项目最常用!)

```js
const nums = [1, 2, 3, 4, 5]

// map — 转成另一个数组
const doubled = nums.map(n => n * 2)  // [2, 4, 6, 8, 10]

// filter — 过滤
const evens = nums.filter(n => n % 2 === 0)  // [2, 4]

// reduce — 累计
const sum = nums.reduce((acc, n) => acc + n, 0)  // 15

// find — 找一个
const found = nums.find(n => n > 3)  // 4

// some / every — 判断
nums.some(n => n > 4)   // true(有至少一个)
nums.every(n => n > 0)  // true(所有都)

// includes — 包含
;[1, 2, 3].includes(2)  // true
```

**🌟 真实例子** — 风迹集里到处都是这些方法:

```js
// frontend/src/pages/Home.tsx
const filteredPosts = posts.filter(p => p.title.includes(searchValue))
const sortedProjects = projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
const stats = await Promise.all([getPosts(), getProjects()])
```

---

## 4. 对象

### 4.1 创建对象

```js
const user = {
  name: '小明',
  age: 18,
  greet() { return `你好,我是${this.name}` }
}

// 访问属性
user.name         // 点语法(常用)
user['name']      // 方括号语法(key 是变量时用)

// 调用方法
user.greet()  // '你好,我是小明'
```

### 4.2 解构(高频!)

```js
const user = { name: '小明', age: 18, city: '北京' }

// 普通写法
const name = user.name
const age = user.age

// 解构(等同于上面两行)
const { name, age } = user

// 重命名
const { name: userName, age } = user

// 数组解构
const [first, second] = [1, 2, 3]  // first=1, second=2

// 函数参数解构
function greet({ name, age }) {
  console.log(`${name} 今年 ${age} 岁`)
}
greet(user)
```

**🌟 真实例子**:

```js
// frontend/src/services/post.ts
const { data } = await apiClient.get('/posts')
// 等价于 const data = (await apiClient.get('/posts')).data

// backend/src/controllers/auth.controller.js
const { username, email, password, inviteCode } = req.body
```

### 4.3 展开运算符

```js
const a = { x: 1, y: 2 }
const b = { y: 3, z: 4 }

const merged = { ...a, ...b }   // { x: 1, y: 3, z: 4 }

// 数组同理
const arr1 = [1, 2]
const arr2 = [...arr1, 3, 4]  // [1, 2, 3, 4]
```

**🌟 真实例子**:

```js
// frontend/src/stores/authStore.ts
set({ user: { ...prev.user, ...newInfo } })
```

---

## 5. 数组 vs 对象(关键!)

| | 数组 | 对象 |
|--|------|------|
| 写法 | `[1, 2, 3]` | `{a: 1, b: 2}` |
| 键 | 数字(自动) | 字符串/符号(必须) |
| 顺序 | 有序 | 无序 |
| 用途 | 列表 | 字典、配置 |
| 取值 | `arr[0]` | `obj.key` |

**风迹集里**:
- API 返回数据往往是: `{ data: [...], pagination: {...} }`
- 数组里装着资源(文章、项目列表)
- 对象里装着单项数据(用户、配置)

---

## 6. 异步编程

### 6.1 为什么要异步?

```js
// ❌ 同步 — 卡死等待
const data = fetch('/api/posts')  // 假设 1 秒才返回
console.log('end')                  // 要等 1 秒才执行

// ✅ 异步 — 不阻塞
const data = await fetch('/api/posts')  // 同时其他代码可以跑
console.log('end')
```

### 6.2 Promise

```js
// 一个"未来会出现"的值 — 它可能成功、也可能失败

const promise = fetch('/api/posts')

promise
  .then(res => res.json())  // 成功时执行
  .catch(err => console.error(err))  // 失败时执行
  .finally(() => console.log('结束'))
```

### 6.3 async/await(现代写法)

```js
async function getPosts() {
  try {
    const res = await fetch('/api/posts')
    const data = await res.json()
    return data.data  // 直接拿到数据
  } catch (err) {
    console.error(err)
    return null
  }
}
```

### 6.4 并行请求

```js
// 顺序执行(慢)— 总耗时 = A + B + C
const a = await getA()
const b = await getB()
const c = await getC()

// 并行执行(快)— 总耗时 ≈ max(A, B, C)
const [a, b, c] = await Promise.all([getA(), getB(), getC()])
```

**🌟 真实例子**:

```js
// frontend/src/pages/Home.tsx — 并行拉所有数据
const [postsRes, projectsRes, categoriesRes, checkinsRes, statsRes] = await Promise.all([
  getPosts({ limit: 10 }),
  getProjects({ limit: 20 }),
  getCategories(),
  getCheckIns(),
  getDashboardStats(),
])
```

---

## 7. ES6+ 必备语法

### 7.1 模块导入导出

```js
// math.js — 导出
export const PI = 3.14
export function add(a, b) { return a + b }
export default class Calculator {}

// other.js — 导入
import { PI, add } from './math.js'  // 命名导入
import Calculator from './math.js'   // 默认导入
```

### 7.2 异步箭头函数

```js
// 本项目到处都是:
const getPosts = async (params) => {
  const res = await apiClient.get('/posts', { params })
  return res.data
}
```

### 7.3 可选链 `?.` 和空值合并 `??`

```js
const user = null
user?.name           // undefined (不会报错)
user?.address?.city  // undefined(多重保护)

const count = 0
const result = count ?? 10  // 0(因为 0 不是 null/undefined)
const result2 = null ?? 10  // 10
```

**🌟 真实例子**:

```js
// frontend/src/pages/Home.tsx
{user?.nickname || user?.username}  // 用户名兜底
const { avatar, clear } = useUserAvatar()
```

---

## 8. 类(Classes)

ES6 引入,语法糖,本质还是原型继承。

```js
class User {
  constructor(name) {
    this.name = name
  }

  greet() {
    return `你好,我是${this.name}`
  }
}

const u = new User('小明')
u.greet()  // '你好,我是小明'
```

**🌟 真实例子**:

```js
// backend/src/services/post.service.js
class PostService {
  async getPosts(options = {}) {
    // ...
  }
}

module.exports = new PostService()
```

---

## 9. 错误处理

```js
try {
  // 尝试执行的代码
  const data = await fetch('/api/posts')
} catch (error) {
  // 出错时执行(404、网络断、JSON 不合法)
  console.error('获取失败:', error.message)
} finally {
  // 无论成功失败都执行
  console.log('请求结束')
}
```

**🌟 真实例子**:

```js
// backend/src/controllers/auth.controller.js
async function login(req, res, next) {
  try {
    const result = await authService.login(...)
    return ApiResponse.success(res, result)
  } catch (error) {
    if (error.code === 'INVALID_CREDENTIALS') {
      return ApiResponse.unauthorized(res, error.message)
    }
    next(error)  // 交给错误中间件
  }
}
```

---

## 10. const/let 怎么选?

**黄金原则**:**默认用 const,需要重新赋值时才用 let**。

```js
// ✅ 好的写法 — 99% 的情况用 const
const posts = await fetchPosts()
const name = '风迹集'
const handleClick = () => { ... }

// ✅ 有需要时用 let
let total = 0
for (const p of posts) total += p.viewCount

// ❌ 不必要的 let
let name = '风迹集'   // 改成 const
```

---

## ✅ 学完这一节你应该能

- [ ] 写一个带数组、对象、解构的 JS 函数
- [ ] 用 async/await 调用 API
- [ ] 用 `.map() .filter() .reduce()` 处理数组
- [ ] 用 try/catch 处理错误

---

## 🎓 进阶学习(可选)

- JS 模块系统深入:CommonJS vs ES Modules(本项目混用)
- Proxy / Reflect(高级特性)
- 设计模式:单例、工厂、观察者

---

下一节:[04 — Node.js 与后端开发](./04-Node.js与后端.md) →

> 💡 **动手时间**:打开 Node.js REPL(`node`),试试上面的例子。
> 提示:在风迹集项目里打开 `frontend/src/services/post.ts`,看看里面有多少 async/await!
