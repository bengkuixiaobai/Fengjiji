# 02 — Web 基础概念

> 学完你就能:看懂浏览器怎么和服务器对话

---

## 1. 三剑客:HTML / CSS / JavaScript

```
HTML — 网页的骨头(结构)
CSS  — 网页的衣服(样式、颜色)
JS   — 网页的肌肉(交互、行为)
```

### 1.1 HTML — 超文本标记语言

HTML 用**标签**描述页面结构:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>我的博客</title>
  </head>
  <body>
    <h1>标题</h1>
    <p>这是一个段落。</p>
    <a href="https://google.com">跳转到 Google</a>
    <button>点击我</button>
  </body>
</html>
```

常见标签:
- `<h1>` `<h2>`...`<h6>` — 标题
- `<p>` — 段落
- `<a>` — 链接
- `<div>` — 通用容器
- `<img>` — 图片
- `<button>` — 按钮

### 1.2 CSS — 样式表

CSS 控制 HTML 长什么样:

```css
h1 {
  color: #667eea;       /* 紫蓝色 */
  font-size: 28px;
  text-align: center;
}

body {
  background: black;
  color: white;
}
```

风迹集项目的 `frontend/src/index.css` 就是这样组织样式。

**两种写法**:
- **外部 CSS**:写在 `.css` 文件里
- **样式组件**:写在 JS 中(风迹集用这种)

### 1.3 JavaScript — 编程语言

JS 让网页"动起来":

```js
// 点击按钮弹窗
button.onclick = () => {
  alert('你好!')
}

// 修改页面文字
document.querySelector('h1').innerText = '新标题'
```

---

## 2. URL 长什么样?

```
https://fengjiji.com:443/blogs/my-first-post?category=tech#comments
│      │               │  │                       │              │
│      │               │  │                       │              └─ 锚点(跳到某个位置)
│      │               │  │                       └─ 查询参数(筛选/过滤)
│      │               │  └─ 路径(具体哪个页面/API)
│      │               └─ 端口
│      └─ 域名
└─ 协议
```

**本项目后端 URL**:
- `GET http://localhost:3000/api/posts?categoryId=1&page=1`
- `POST http://localhost:3000/api/auth/login` (登录)

---

## 3. HTTP 请求到底是什么?

当你点一个链接时,实际发生的:

```
浏览器 → 发送一个 HTTP 请求包
       ↓
服务器处理 → 返回一个 HTTP 响应包
       ↓
浏览器 → 解析 → 显示页面
```

### 3.1 请求包长这样

```http
POST /api/auth/login HTTP/1.1         ← 方法 + 路径 + 版本
Host: localhost:3000                  ← 主机
Content-Type: application/json        ← 数据格式
Authorization: Bearer eyJhbGc...      ← 登录令牌

{                                    ← 请求体(POST 才会有)
  "username": "admin",
  "password": "<your-password>"
}
```

### 3.2 响应包长这样

```http
HTTP/1.1 200 OK                       ← 状态码 + 状态文本
Content-Type: application/json

{                                    ← 响应体
  "success": true,
  "data": {
    "user": { "id": 1, "username": "admin" },
    "token": "eyJhbGc..."
  }
}
```

---

## 4. HTTP 状态码

| 码 | 含义 |
|----|------|
| `200 OK` | 成功 |
| `201 Created` | 创建成功 |
| `400 Bad Request` | 你发的东西不对(参数错误) |
| `401 Unauthorized` | 你没登录或登录过期 |
| `403 Forbidden` | 你登录了,但没权限 |
| `404 Not Found` | 找不到这个资源 |
| `409 Conflict` | 冲突(如用户名已存在) |
| `429 Too Many Requests` | 请求太频繁(限流) |
| `500 Server Error` | 服务器炸了 |

---

## 5. 浏览器开发者工具(DevTools)

**最重要的工具!怎么打开**:
- Windows: `F12` 或 `Ctrl+Shift+I`
- Mac: `Cmd+Option+I`

### 5.1 五个标签页

| 标签 | 干什么 |
|------|--------|
| **Elements** | 看 HTML 结构、CSS 样式 |
| **Console** | 看 JS 输出、报错信息、调试代码 |
| **Network** | 看所有 HTTP 请求的请求/响应 |
| **Application** | 看 LocalStorage / Cookie / 缓存 |
| **Sources** | 看源代码,可以打断点调试 |

### 5.2 调试后端 API 的标准做法

1. 打开 DevTools,切到 **Network** 标签
2. 触发一个操作(比如登录)
3. 点击出现的请求
4. 在 **Headers** 看请求头(包含 Token)
5. 在 **Payload** 看请求体
6. 在 **Response** 看响应数据

**本项目调试举例**:
- 登录失败:看 Network → `POST /api/auth/login` 的 Response
- 查看 Token:Application → Local Storage → `auth-token`

---

## 6. RESTful API 是什么?

是一种 API 设计风格,**用 URL 表示资源,用 HTTP 方法表示操作**。

```
GET    /posts          → 获取所有文章(列表)
GET    /posts/1        → 获取 id=1 的文章
POST   /posts          → 创建一篇文章
PUT    /posts/1        → 更新 id=1 的文章
DELETE /posts/1        → 删除 id=1 的文章
```

> 📌 本项目所有 API 都是 RESTful 风格。详见 [API 接口规范](../docs/design/04-API接口规范.md)

---

## 7. JSON 数据格式

几乎所有 Web API 都用 JSON 传输数据。它看起来像 JS 对象:

```json
{
  "id": 1,
  "title": "我的第一篇文章",
  "tags": ["React", "TypeScript"],
  "author": {
    "id": 1,
    "name": "管理员"
  }
}
```

**值的类型**:
- 数字:`123`
- 字符串:`"hello"`
- 布尔:`true` / `false`
- 空:`null`
- 数组:`[1, 2, 3]`
- 对象:`{"key": "value"}`

**⚠️ 注意**:
- JSON 字符串必须用**双引号**,不能单引号
- JSON **没有注释**(可以用 `_comment` 字段充当)
- JSON **不能是函数**、undefined

---

## 8. 跨域问题(CORS)

**场景**:你打开 `localhost:5173`,它请求 `localhost:3000`,浏览器可能会拦截。

**原因**:浏览器**同源策略**(端口不同也算跨域)。

**解决方案**:后端允许跨域。

```js
// backend/src/app.js
app.use(cors({ origin: 'http://localhost:5173' }))
```

风迹集在开发模式默认 `*` 允许所有来源,生产环境可设置白名单。

---

## 9. 必记的几个概念

| 概念 | 一句话 |
|------|--------|
| **SPA** 单页应用 | 一个 HTML 文件 + JS 切换内容的应用(React/Vue 都是) |
| **SSR** 服务端渲染 | 服务端生成 HTML,SEO 更友好 |
| **CORS** | 浏览器的跨域安全机制 |
| **CDN** | 内容分发网络,加速静态资源 |
| **Cookie** | 浏览器自动带给服务器的小数据 |
| **Token** | 不存在 Cookie 里、自己塞 Header 的身份标识 |

---

## ✅ 学完这一节你应该能

- [ ] 写一个最简单的 HTML 页面
- [ ] 写出 HTTP 请求方法(GET/POST)的区别
- [ ] 解释 401 和 500 状态码分别是什么意思
- [ ] 打开浏览器 DevTools,在 Network 里看到 API 请求
- [ ] 解释 JSON 是什么、和 JS 对象有什么区别

---

下一节:[03 — JavaScript 核心](./03-JavaScript核心.md) →

> 💡 **动手时间**:打开 [https://github.com](https://github.com),F12 → Network → 刷新页面 → 看请求
