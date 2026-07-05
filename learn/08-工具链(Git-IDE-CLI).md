# 08 — 开发工具链(Git / IDE / CLI)

> 学完你就能:熟练使用 Git、VSCode 和命令行

---

## 1. 命令行(CLI)基础

**为什么还要学命令行?很多项目初始化、部署都要用命令行**

### 1.1 打开终端的方式

| 系统 | 方式 |
|------|------|
| **Windows** | Win+R → 输入 `cmd`(或安装 Windows Terminal 更好) |
| **Mac** | `Cmd + 空格` → 搜索 `Terminal` |
| **Linux** | `Ctrl+Alt+T` |

### 1.2 必学命令

```bash
# 切换目录
cd path/to/folder          # 进入
cd ..                      # 上级
cd /                       # 根目录
pwd                        # 当前路径(Mac/Linux,Windows 用 cd 显示)

# 列出文件
ls                         # 列文件
ls -la                     # 详细列表(包括隐藏)
dir                        # Windows 等价

# 创建 / 删除
mkdir new-folder           # 创建文件夹
mkdir -p a/b/c             # 创建多层
rm file.txt                # 删除文件(Git Bash)
rm -rf folder              # 强制删除文件夹
del file.txt               # Windows 删除文件
rmdir folder               # 删除空文件夹

# 查看文件
cat file.txt               # 全部打印
less file.txt              # 分页查看(按 q 退出)
head -5 file.txt           # 前 5 行
tail -5 file.txt           # 后 5 行

# 搜索
grep "关键词" file.txt     # 文件内搜索
grep -r "关键词" folder/  # 递归搜索

# 管道和重定向
ls | grep "docs"           # ls 的输出作为 grep 的输入
cat file.txt > out.txt     # 覆盖保存到 out.txt
cat file.txt >> out.txt    # 追加保存

# 清屏
clear                      # 清屏 (Mac/Linux)
cls                        # 清屏(Windows)
```

### 1.3 文件路径

```
绝对路径:从根目录开始
  /c/Users/xiaoming/Projects/fengjiji   (Windows Git Bash)
  /home/xiaoming/projects/fengjiji      (Linux)
  C:\Users\xiaoming\Projects\...         (Windows cmd/PowerShell,反斜杠)

相对路径:从当前开始
  ./         当前目录
  ../        上级目录
  ../../     上两级
  ../../docs 上两级的 docs 文件夹
```

### 1.4 风迹集常用命令集

```bash
# 安装
cd backend && npm install
cd frontend && npm install

# 启动开发
npm run dev              # 同时启前后端
npm run dev:backend      # 仅后端
npm run dev:frontend     # 仅前端

# 初始化数据库
cd backend
npx prisma migrate dev
node prisma/seed.js

# 构建
cd ../frontend
npm run build

# 生产启动
cd ../backend
NODE_ENV=production npm start

# 查看日志
pm2 logs fengjiji-api
```

### 1.5 进程管理

```bash
# 查看运行中的 Node 进程
ps aux | grep node             # Mac/Linux
tasklist | findstr node        # Windows

# 杀进程(强杀)
kill -9 1234                   # PID 1234
taskkill /PID 1234 /F          # Windows

# PM2(后端部署用)
npm install -g pm2
pm2 start npm --name "api"
pm2 list
pm2 logs
pm2 restart api
pm2 stop api
```

---

## 2. Git 版本控制

**Git = 代码的"时光机"**,记录你每次的修改。

### 2.1 核心概念

```
工作区  →  git add  →  暂存区  →  git commit  →  仓库(本地)
  ↓                                         ↓
你的文件                               本地历史
                                         ↓
                                  git push  →  远程仓库(GitHub/GitLab)
```

### 2.2 常用命令速查

```bash
# 初始化
git init                                   # 当前目录初始化
git clone <url>                            # 克隆远程仓库

# 配置(首次必做)
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"

# 查看状态
git status                                 # 修改了哪些
git log                                    # 历史记录
git log --oneline                          # 简洁历史

# 增删改
git add file.ts                            # 暂存单个文件
git add .                                  # 暂存所有
git restore file.ts                        # 撤销修改(危险)
git restore --staged file.ts               # 取消暂存
git rm file.ts                             # 删除文件

# 提交
git commit -m "feat: 新增登录功能"
git commit --amend                         # 改刚提交的信息

# 远程操作
git remote add origin <url>                # 加远程地址
git push                                   # 推到远程
git pull                                   # 拉取最新
git fetch                                  # 只拉取不合并

# 分支(版本隔离)
git branch                                 # 查看分支
git branch dev                             # 创建分支
git checkout dev                           # 切换分支
git checkout -b dev                        # 创建并切换
git merge dev                              # 合并 dev 到当前分支

# 比较
git diff                                   # 工作区 vs 暂存区
git diff --staged                          # 暂存区 vs 仓库
```

### 2.3 提交信息规范(Conventional Commits)

```
<type>(<scope>): <subject>

type 类别:
- feat:     新功能
- fix:      修 bug
- docs:     文档变更
- style:    代码格式(无逻辑变化)
- refactor: 重构
- test:     测试
- chore:    杂项(依赖、配置等)

示例:
git commit -m "feat(post): 加点赞功能"
git commit -m "fix(login): 修复 token 刷新后跳转 bug"
git commit -m "docs: 更新 README"
```

### 2.4 推荐工作流

```bash
# 1. 切到自己的分支
git checkout -b feature/comment-system

# 2. 写代码... → 频繁 commit

# 3. 推送到远程
git push origin feature/comment-system

# 4. 在 GitHub/GitLab 上发 Pull Request
#    (团队协作时,这一步会有 Code Review)

# 5. 合并后删除远程分支
```

### 2.5 .gitignore — 告诉 Git 哪些文件不要管

本项目根目录的 `.gitignore`:

```gitignore
node_modules/        ← 不提交依赖
dist/                ← 不提交构建产物
.env                 ← 不提交环境配置
*.log                ← 不提交日志
.DS_Store            ← 不提交 macOS 垃圾
```

⚠️ **常见错误**:`.env` 提交了!这是严重事故(密钥泄露),第一时间改密钥。

---

## 3. VSCode 编辑器

### 3.1 必装扩展

| 扩展 | 用途 |
|------|------|
| **ESLint** | 代码规范检查 |
| **Prettier** | 自动格式化 |
| **GitLens** | Git 历史查看 |
| **Chinese Language Pack** | 中文界面 |
| **Project Manager** | 多项目切换 |
| **REST Client** | 测试 API(类似 PostMan) |
| **Prisma** | Prisma 文件高亮 |

### 3.2 必会快捷键

| 快捷键 | 作用 |
|--------|------|
| `Ctrl/Cmd + P` | 快速打开文件 |
| `Ctrl/Cmd + Shift + P` | 命令面板 |
| `Ctrl/Cmd + /` | 注释 |
| `Alt + Up/Down` | 上下移动行 |
| `Shift + Alt + F` | 格式化代码 |
| `F12` | 跳转到定义 |
| `Alt + F12` | 看定义(不跳转) |
| `Ctrl/Cmd + D` | 选中下一个相同词 |
| `Ctrl/Cmd + B` | 切换侧边栏 |

### 3.3 调试 React 代码

1. 在代码左侧点一下,出现红点 = 设置断点
2. F5 启动调试
3. 程序会停在断点处,可以看变量

或者最简单:用 `console.log()` 在关键位置打印:

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  const handleClick = () => {
    console.log('点击之前 count =', count)
    setCount(count + 1)
    console.log('点击之后 count =', count)  // 还是旧值!
  }
  // ...
}
```

⚠️ **注意:setCount 后立刻 print 还是旧值,要用 useEffect 监听**。

### 3.4 调试 Node.js 后端

```bash
# 方式 1: VSCode 调试器 — 点按钮左侧的虫图标
# 方式 2: 加断点启动
node --inspect index.js
# 然后 Chrome 浏览器 chrome://inspect

# 方式 3: console.log(最简单)
console.log('请求:', req.body)
console.log('查询参数:', req.query)
```

---

## 4. 包管理(NPM/Yarn/PNPM)

本项目用 **npm**(Node.js 自带)。

### 4.1 常用命令

```bash
# 安装
npm install                       # 安装 package.json 里的所有依赖
npm install <package>             # 安装并加入 dependencies
npm install -D <package>          # 安装并加入 devDependencies
npm install -g <package>          # 全局安装(如 pm2)

# 运行脚本
npm run dev                       # = npm run-script dev
npm start

# 卸载 / 更新
npm uninstall <package>
npm update                        # 更新所有依赖
npm outdated                      # 查看过期依赖

# 临时使用
npx prisma migrate dev            # 不安装直接运行 prisma
```

### 4.2 package.json 关键字段

```json
{
  "name": "fengjiji-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon index.js",
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

⚠️ **`^4.18.2`** 表示安装 4.x.x 最新版,但不会升到 5。
⚠️ **`dependencies`** vs **`devDependencies`**:
- dependencies: 生产环境也要
- devDependencies: 开发用的(打包工具、测试)

### 4.3 锁定文件

```
package-lock.json  ← npm 用的锁定文件(本项目用 npm)
yarn.lock          ← yarn 用的
pnpm-lock.yaml     ← pnpm 用的
```

**重要**:这个文件提交到 Git,确保所有人/服务器安装的依赖版本一致。

---

## 5. 环境变量

### 5.1 为什么需要?

```
# 开发环境
DATABASE_URL="postgresql://postgres:123456@localhost:5432/fengjiji"

# 生产环境
DATABASE_URL="postgresql://fengjiji:strong-pwd@prod-server:5432/fengjiji"
```

不同环境配置不同 → 抽成环境变量。

### 5.2 读取方式

**Node.js**:

```bash
# 终端设置(临时)
DATABASE_URL="..." node index.js
```

```js
// 代码里读
require('dotenv').config()   // 加载 .env 文件
console.log(process.env.DATABASE_URL)
```

**Vite (前端)**:

```bash
# 文件命名:.env .env.local .env.development .env.production
# 只读以 VITE_ 开头的变量
VITE_API_BASE_URL=/api
```

```js
console.log(import.meta.env.VITE_API_BASE_URL)
```

⚠️ **前端环境变量会被打进 bundle**,不要放密钥!

---

## 6. 部署工具

### 6.1 PM2 — 进程管理

```bash
# 安装
npm install -g pm2

# 启动
pm2 start npm --name "fengjiji-api" -- run start
pm2 start ecosystem.config.js

# 常用命令
pm2 list                  # 进程列表
pm2 logs fengjiji-api    # 实时日志
pm2 restart fengjiji-api  # 重启
pm2 reload fengjiji-api   # 0 宕机重启
pm2 stop fengjiji-api     # 停止
pm2 delete fengjiji-api   # 删除
pm2 monit                 # 监控面板

# 持久化(重启机器后自启动)
pm2 startup      # 按提示执行
pm2 save
```

**ecosystem.config.js 示例**:

```js
module.exports = {
  apps: [{
    name: 'fengjiji-api',
    script: 'backend/index.js',
    env: { NODE_ENV: 'production', PORT: 3000 },
    max_memory_restart: '500M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    max_size: '10M',     // 日志轮转
    retain: 10,
  }]
}
```

### 6.2 Nginx — 反向代理

```nginx
server {
  listen 80;
  server_name your-domain.com;
  return 301 https://$server_name$request_uri;  # HTTP 跳 HTTPS
}

server {
  listen 443 ssl http2;
  server_name your-domain.com;

  # SSL 证书(Let's Encrypt)
  ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

  # API 反向代理
  location /api/ {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  # 前端静态文件
  location / {
    root /var/www/fengjiji/frontend/dist;
    try_files $uri $uri/ /index.html;
  }
}
```

### 6.3 SSL 证书(Let's Encrypt)

```bash
# 安装
sudo apt install certbot python3-certbot-nginx

# 申请 + 自动配置
sudo certbot --nginx -d your-domain.com

# 续期测试
sudo certbot renew --dry-run

# 自动续期(crontab 已默认添加)
```

---

## 7. 调试技巧

### 7.1 调试 RESTful API

**用 curl**(命令行):

```bash
# GET 请求
curl http://localhost:3000/api/posts

# POST 请求 + JSON + Header
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"admin","password":"<your-password>"}'

# 携带 token
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer eyJhbGc..."
```

**用浏览器 DevTools**(更直观,前面讲过)

### 7.2 调试 React 页面

1. **断点 + 单步**:在 VSCode 写 `debugger` 或设置断点
2. **React DevTools**:Chrome 扩展,看组件树和 props/state
3. **网络面板**:看 API 调用
4. **控制台**:`console.log` 输出

### 7.3 调试 Node.js 后端

1. `console.log` 打印
2. VSCode 断点调试
3. 看 `pm2 logs` 或终端输出
4. 用 `node --inspect` 在 Chrome 调试器里看

---

## 8. 部署流程

```bash
# 1. 在服务器上拉代码
cd /var/www
sudo git clone https://github.com/xxx/fengjiji.git
cd fengjiji

# 2. 安装依赖
npm run install:all

# 3. 配置环境变量
cp backend/.env.example backend/.env
vim backend/.env   # 修改配置
vim frontend/.env  # 修改 VITE_*

# 4. 数据库初始化
cd backend
npx prisma migrate deploy
node prisma/seed.js

# 5. 构建前端
cd ../frontend
npm run build

# 6. 启动后端(PM2)
cd ..
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# 7. 配置 Nginx
sudo vim /etc/nginx/sites-available/fengjiji
sudo ln -s ../sites-available/fengjiji /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 8. HTTPS
sudo certbot --nginx -d your-domain.com
```

---

## 9. 常见操作速查卡

### 9.1 创建新功能模块(项目约定)

```
1. 新建分支
   git checkout -b feature/xxx

2. 写代码
   backend:  routes/ + controllers/ + services/
   frontend: pages/ 或 components/

3. 测试
   npm run dev
   npm run build

4. 提交
   git add .
   git commit -m "feat(xxx): xxx"

5. 推送 + PR
   git push origin feature/xxx
```

### 9.2 修复 Bug

```
1. 切到 main 分支并拉最新
   git checkout main && git pull

2. 新建 fix 分支
   git checkout -b fix/xxx

3. 写修复代码...

4. 提交 + 推送 + PR
```

### 9.3 更新依赖

```bash
# 查看过期
npm outdated

# 更新某个包到最新
npm install react@latest

# 全更新
npm update
```

---

## ✅ 学完这一节你应该能

- [ ] 用命令行 cd、ls、cat 翻看文件
- [ ] 完整使用 Git 工作流(init → add → commit → push → pull)
- [ ] 用 VSCode 调试 + console.log 排查问题
- [ ] 写出 .env 文件
- [ ] 用 PM2 启动 Node.js 服务
- [ ] 用 curl 测试后端 API
- [ ] 描述完整部署流程

---

## 📚 推荐资源

- [Learn Git Branching](https://learngitbranching.js.org/?locale=zh_CN) — 可视化 Git 学习
- [Oh My Zsh](https://ohmyz.sh/) — 更聪明的终端(需先装 zsh)
- [VSCode Cheat Sheet](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf) — 快捷键表
- [Pro Git 中文版](https://git-scm.com/book/zh/v2) — Git 圣经

---

下一节:**最后一节** [09 — 读懂风迹集代码](./09-读懂风迹集代码.md) →

> 💡 **不需要背**所有内容,先看一遍,用到时回来查!
