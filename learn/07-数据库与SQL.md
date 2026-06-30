# 07 — 数据库与 SQL

> 学完你就能:看懂 PostgreSQL 数据库和 Prisma 操作

---

## 1. 数据库是什么?

**数据库 = 存放数据的文件夹**(结构化)

```
文件系统(Excel 表格)              数据库
─────────────────────            ──────────────
文件:data.xlsx                    一个 PostgreSQL "库"
工作表:用户表                      一个 table
字段:username / age               一列字段
行:数据记录                        一行数据
```

**为什么不用 Excel?**
- 多人同时读写会冲突
- 数据多了(几十万行)Excel 会卡
- 没办法让程序自动读写

---

## 2. 本项目用的 PostgreSQL

PostgreSQL(简称 Postgres)是最先进的开源关系型数据库。

### 2.1 重要命令(基本不用手敲,Prisma 帮你搞定)

```bash
# 连接数据库
psql -U postgres -d fengjiji

# 列出所有数据库
\l

# 列出所有表
\dt

# 退出
\q
```

### 2.2 安装后一般需要做的事

```bash
# 创建数据库
CREATE DATABASE fengjiji;

# 创建用户并授权
CREATE USER fengjiji WITH PASSWORD 'strong-password';
GRANT ALL PRIVILEGES ON DATABASE fengjiji TO fengjiji;
```

---

## 3. SQL 基础(看得懂 Prisma 自动生成的 SQL 就够了)

### 3.1 CRUD

```sql
-- CREATE — 插入
INSERT INTO users (username, email, password)
VALUES ('admin', 'admin@example.com', 'hashed-pwd');

-- READ — 查询
SELECT id, username, email FROM users WHERE username = 'admin';
SELECT COUNT(*) FROM posts;
SELECT * FROM posts ORDER BY created_at DESC LIMIT 10;

-- UPDATE — 更新
UPDATE posts SET view_count = view_count + 1 WHERE id = 1;

-- DELETE — 删除
DELETE FROM posts WHERE id = 1;
```

### 3.2 常用关键字速查

| 关键字 | 作用 | 示例 |
|--------|------|------|
| `WHERE` | 筛选 | `WHERE id > 10` |
| `AND` / `OR` | 多个条件 | `WHERE status = 'published' AND view > 100` |
| `LIKE` | 模糊匹配 | `WHERE title LIKE '%风迹集%'` |
| `ORDER BY` | 排序 | `ORDER BY created_at DESC` |
| `LIMIT` / `OFFSET` | 分页 | `LIMIT 10 OFFSET 0` |
| `COUNT/SUM/AVG` | 聚合 | `SELECT COUNT(*)` |
| `GROUP BY` | 分组 | `GROUP BY category_id` |
| `JOIN` | 关联表 | `JOIN users ON posts.author_id = users.id` |
| `DISTINCT` | 去重 | `SELECT DISTINCT category` |

---

## 4. 表的关系

### 4.1 三种关系

```
1. 一对多(最常见):
   一个用户有多篇文章
   users       posts
   ┌────┐      ┌──────┐
   │ id │──1:N──│ user_id │
   └────┘      └──────┘

2. 多对多:
   文章 ↔ 标签(通过中间表 post_tags)
   posts       post_tags      tags
   ┌────┐     ┌────────────┐  ┌────┐
   │ id │──N:M──│ post_id   │──│ id │
   └────┘     └─ tag_id ──┘  └────┘

3. 一对一:
   用户的微信/微博账号(可选,这里没用到)
```

### 4.2 外键(Foreign Key)

确保数据完整性 — 不能引用不存在的记录。

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES users(id)
);
```

本项目所有关系都用 Prisma 的 `relation` 声明:
```prisma
model Post {
  authorId Int
  author   User @relation(fields: [authorId], references: [id])
}
```

---

## 5. Prisma 全套教程

本项目用 Prisma ORM,不直接写 SQL。

### 5.1 schema.prisma 结构

```prisma
// Prisma 配置
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 一个表 = 一个 model
model User {
  id       Int    @id @default(autoincrement())
  username String @unique
  email    String @unique
  password String
  posts    Post[]   // 一对多:一用户多文章

  @@map("users")  // 实际表名
}
```

### 5.2 字段类型(Prisma → PostgreSQL)

| Prisma | PostgreSQL |
|--------|-----------|
| `String` | `text` |
| `Int` | `integer` |
| `Boolean` | `boolean` |
| `DateTime` | `timestamp(3)` |
| `Float` | `double precision` |
| `Json` | `jsonb` |
| `?`(可选) | `NULL` |

### 5.3 属性和约束

```prisma
model Post {
  id    Int     @id @default(autoincrement())  // 主键
  slug  String  @unique                          // 唯一
  draft Boolean @default(false)                  // 默认值
  views Int     @default(0)                      // 默认值

  authorId Int
  author   User  @relation(fields: [authorId], references: [id])

  @@map("posts")           // 自定义表名
  @@index([authorId])      // 创建索引
}
```

### 5.4 关系建模

**一对多**:

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]   // 一个用户多个文章
}

model Post {
  authorId Int
  author   User @relation(fields: [authorId], references: [id])
}
```

**多对多**(显示中间表):

```prisma
model Post {
  tags PostTag[]
}

model Tag {
  posts PostTag[]
}

model PostTag {
  postId Int
  tagId  Int
  post   Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])  // 复合主键
  @@map("post_tags")
}
```

**多对多**(隐式,Prisma 自动建中间表):

```prisma
model Post {
  tags Tag[]   // 不写中间表
}

model Tag {
  posts Post[]
}
```

注意:**显式更灵活**(推荐),可以加额外字段如 `createdAt`。

### 5.5 常用 CRUD 操作

```js
// === CREATE ===
const user = await prisma.user.create({
  data: {
    username: 'admin',
    email: 'admin@example.com',
    // 注意嵌套的 create
    posts: {
      create: [
        { title: '第一篇', slug: 'first', content: '...' },
      ],
    },
  },
})

// === READ ===
const users = await prisma.user.findMany()             // 全部
const user = await prisma.user.findUnique({             // 按 id 查唯一
  where: { id: 1 }
})
const userByEmail = await prisma.user.findUnique({
  where: { email: 'admin@example.com' }
})

// 复杂查询
const posts = await prisma.post.findMany({
  where: {
    isDeleted: false,
    status: 'published',
    OR: [
      { title: { contains: search, mode: 'insensitive' } },
    ],
  },
  orderBy: { createdAt: 'desc' },
  skip: 0,
  take: 10,
  select: {  // 只返回这些字段
    id: true,
    title: true,
    createdAt: true,
  },
  include: {  // 关联数据
    author: { select: { username: true, avatar: true } },
    tags: { include: { tag: true } },
  },
})

// === UPDATE ===
await prisma.post.update({
  where: { id: 1 },
  data: { viewCount: 100 },
})

// 自增 / 自减
await prisma.post.update({
  where: { id: 1 },
  data: { viewCount: { increment: 1 } },   // viewCount + 1
})

// === DELETE ===
await prisma.post.delete({ where: { id: 1 } })

// 软删除
await prisma.post.update({
  where: { id: 1 },
  data: { isDeleted: true },
})

// === COUNT / AGGREGATE ===
const count = await prisma.post.count({
  where: { authorId: 1, isDeleted: false }
})

const views = await prisma.post.aggregate({
  where: { authorId: 1 },
  _sum: { viewCount: true },
  _avg: { viewCount: true },
})
```

### 5.6 实战例子:读取文章 + 关联数据

```js
// frontend/src/services/post.ts 的接口背后的实际查询
const post = await prisma.post.findUnique({
  where: { id },
  include: {
    author: { select: { id: true, username: true, nickname: true } },
    category: true,
    tags: { include: { tag: true } },
    project: true,
  },
})

// 格式化(tags 是 PostTag[], 我们要的是 Tag[])
const result = {
  ...post,
  tags: post.tags.map(pt => pt.tag),
}
```

### 5.7 实战例子:点赞 toggle

```js
async function toggleLike(id, visitorId) {
  const existing = await prisma.postLike.findFirst({
    where: { postId: id, visitorId }
  })

  if (existing) {
    // 已点赞 → 取消
    await prisma.postLike.delete({
      where: { postId_visitorId: { postId: id, visitorId } }
    })
    const post = await prisma.post.update({
      where: { id },
      data: { likeCount: { decrement: 1 } },
      select: { likeCount: true }
    })
    return { liked: false, likeCount: post.likeCount }
  } else {
    // 未点赞 → 点赞
    await prisma.postLike.create({
      data: { postId: id, visitorId }
    })
    const post = await prisma.post.update({
      where: { id },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true }
    })
    return { liked: true, likeCount: post.likeCount }
  }
}
```

---

## 6. 索引(Index)是什么?

**索引 = 书后面的目录**,帮助数据库快速找到数据。

```prisma
model Post {
  id Int @id @default(autoincrement())
  slug String @unique  // @unique 自动创建索引

  @@index([authorId])   // 用于"某用户的所有文章"查询
  @@index([status])     // 用于"已发布文章"查询
}
```

**索引是有代价的**:
- ✅ 加速读(`SELECT WHERE`)
- ❌ 减慢写(`INSERT/UPDATE` 需要更新索引)
- 📌 不要全字段都加索引

**什么时候需要加索引?**
- 经常用 `WHERE` 的字段
- 经常用 `ORDER BY` 的字段
- 外键(自动添加但要确认)

---

## 7. 迁移(Migration)

**迁移 = 数据库的版本控制**

```bash
# 改了 schema.prisma 后:
npx prisma migrate dev --name add_avatar_to_user
# 1. 自动检测 schema 变化
# 2. 生成 SQL 迁移文件:prisma/migrations/20260630_add_avatar_to_user/migration.sql
# 3. 应用到开发数据库
# 4. 重新生成 Prisma Client(类型!)

# 生产环境
npx prisma migrate deploy    # 只应用,不创建

# 偶尔排查
npx prisma studio            # 数据库可视化
```

⚠️ **关键点**:**改了 schema.prisma 后一定要 migrate,否则代码编译会过但运行报错**。

---

## 8. 事务(Transactions)

**事务 = 一起成功或一起失败的操作组**

```js
// "取消点赞" 需要两步:删除点赞 + 自减 likeCount
// 如果第一步成功、第二步失败,数据就乱了

await prisma.$transaction(async (tx) => {
  await tx.postLike.delete({ where: { postId_visitorId: { ... } } })
  await tx.post.update({
    where: { id },
    data: { likeCount: { decrement: 1 } }
  })
})
// 要么都成功,要么都撤销
```

---

## 9. Prisma 命令速查

```bash
npx prisma init                       # 初始化项目
npx prisma generate                   # 生成 Prisma Client(改 schema 后必跑)
npx prisma migrate dev --name xxx     # 开发环境:创建迁移
npx prisma migrate deploy             # 生产环境:应用迁移
npx prisma migrate reset              # 重置数据库(慎用!会丢数据)
npx prisma studio                     # GUI 工具,http://localhost:5555
npx prisma db seed                    # 运行 seed.js
npx prisma db push                    # 跳过迁移直接同步(开发用,生产慎用)
```

---

## 10. 调试 SQL — 看看 Prisma 实际跑了什么

有时想知道 Prisma 真正发给数据库的是什么 SQL,可以在 `client` 加日志:

```js
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
  ],
})

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query)
  console.log('Params: ' + e.params)
  console.log('Duration: ' + e.duration + 'ms')
})
```

---

## ✅ 学完这一节你应该能

- [ ] 解释表、行、字段、外键
- [ ] 读懂 schema.prisma 的 model 定义
- [ ] 写出常见 Prisma 操作(findMany、findUnique、create、update、delete)
- [ ] 用 `migrate dev` + `migrate deploy` 管理数据库变更
- [ ] 解释索引和它为什么重要
- [ ] 给风迹集加一张新表(留言板、收藏夹)

---

## 🎓 实战练习(建议动手做)

**任务:加一个「收藏文章」功能**

1. 在 `schema.prisma` 加 `Favorite` 模型
2. 跑 `npx prisma migrate dev --name add_favorites`
3. 在 `backend` 加 `favorite.routes.js`
4. 在前端 Services 加 `favoriteService.ts`
5. 在详情页加一个"收藏"按钮

每一步都会用到本节学过的知识!

---

下一节:[08 — 开发工具链](./08-工具链(Git-IDE-CLI).md) →
