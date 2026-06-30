const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

class PostService {
  /**
   * 获取文章列表
   */
  async getPosts(options = {}) {
    const {
      page = 1,
      limit = 10,
      categoryId,
      tagId,
      status = 'published',
      authorId,
      search,
      orderBy = 'createdAt',
      order = 'desc',
    } = options

    const skip = (page - 1) * limit

    const where = {
      isDeleted: false,
    }

    if (status) {
      where.status = status
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (authorId) {
      where.authorId = authorId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (tagId) {
      where.tags = {
        some: {
          tagId: tagId,
        },
      }
    }

    const orderByObj = {}
    if (orderBy === 'views') {
      orderByObj.viewCount = order
    } else if (orderBy === 'likes') {
      orderByObj.likeCount = order
    } else {
      orderByObj.createdAt = order
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderByObj,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatar: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ])

    // 格式化返回数据
    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      summary: post.summary,
      coverImage: post.coverImage,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      status: post.status,
      createdAt: post.createdAt,
      publishedAt: post.publishedAt,
      author: post.author,
      category: post.category,
      tags: post.tags.map(pt => pt.tag),
    }))

    return {
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * 获取文章详情
   */
  async getPostById(id) {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!post || post.isDeleted) {
      throw { code: 'POST_NOT_FOUND', message: '文章不存在' }
    }

    // 增加浏览量
    await prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    return {
      ...post,
      tags: post.tags.map(pt => pt.tag),
    }
  }

  /**
   * 创建文章
   */
  async createPost(authorId, data) {
    const { title, slug, summary, content, coverImage, categoryId, tagIds, status, projectId } = data

    // 检查 slug 是否唯一
    const existing = await prisma.post.findUnique({
      where: { slug },
    })

    if (existing) {
      throw { code: 'SLUG_EXISTS', message: '文章 slug 已存在' }
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        summary,
        content,
        coverImage,
        status: status || 'draft',
        authorId,
        categoryId,
        projectId,
        publishedAt: status === 'published' ? new Date() : null,
        tags: tagIds && tagIds.length > 0 ? {
          create: tagIds.map(tagId => ({ tagId })),
        } : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return {
      ...post,
      tags: post.tags.map(pt => pt.tag),
    }
  }

  /**
   * 更新文章
   */
  async updatePost(id, authorId, data) {
    const { title, slug, summary, content, coverImage, categoryId, tagIds, status, projectId } = data

    const existing = await prisma.post.findUnique({
      where: { id },
    })

    if (!existing || existing.isDeleted) {
      throw { code: 'POST_NOT_FOUND', message: '文章不存在' }
    }

    // 检查权限
    if (existing.authorId !== authorId) {
      throw { code: 'FORBIDDEN', message: '没有权限修改此文章' }
    }

    // 检查 slug 是否与其他文章冲突
    if (slug && slug !== existing.slug) {
      const slugConflict = await prisma.post.findFirst({
        where: { slug, id: { not: id } },
      })

      if (slugConflict) {
        throw { code: 'SLUG_EXISTS', message: '文章 slug 已存在' }
      }
    }

    // 更新标签
    if (tagIds !== undefined) {
      // 删除现有标签
      await prisma.postTag.deleteMany({
        where: { postId: id },
      })

      // 添加新标签
      if (tagIds.length > 0) {
        await prisma.postTag.createMany({
          data: tagIds.map(tagId => ({
            postId: id,
            tagId,
          })),
        })
      }
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        title,
        slug,
        summary,
        content,
        coverImage,
        categoryId,
        status,
        projectId,
        publishedAt: status === 'published' && !existing.publishedAt ? new Date() : existing.publishedAt,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return {
      ...post,
      tags: post.tags.map(pt => pt.tag),
    }
  }

  /**
   * 删除文章（软删除）
   */
  async deletePost(id, authorId) {
    const existing = await prisma.post.findUnique({
      where: { id },
    })

    if (!existing || existing.isDeleted) {
      throw { code: 'POST_NOT_FOUND', message: '文章不存在' }
    }

    if (existing.authorId !== authorId) {
      throw { code: 'FORBIDDEN', message: '没有权限删除此文章' }
    }

    await prisma.post.update({
      where: { id },
      data: { isDeleted: true },
    })

    return true
  }

  /**
   * 获取用户的文章数量
   */
  async getUserPostCount(userId) {
    return prisma.post.count({
      where: {
        authorId: userId,
        isDeleted: false,
        status: 'published',
      },
    })
  }

  /**
   * 记录阅读量(同一访客 30 分钟内只计一次)
   * 访客 ID 通过 X-Visitor-Id header 传入(由前端生成持久化)
   */
  async recordView(id, visitorId) {
    // 30 分钟内同访客不计
    const since = new Date(Date.now() - 30 * 60 * 1000)
    const recent = await prisma.postView.findFirst({
      where: {
        postId: id,
        visitorId,
        createdAt: { gte: since },
      },
    })
    if (recent) {
      return prisma.post.findUnique({ where: { id }, select: { viewCount: true } })
    }
    await prisma.postView.create({ data: { postId: id, visitorId } })
    const post = await prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    })
    return post
  }

  /**
   * 切换点赞(同一访客只点赞一次,可取消)
   */
  async toggleLike(id, visitorId) {
    const existing = await prisma.postLike.findFirst({
      where: { postId: id, visitorId },
    })
    if (existing) {
      await prisma.postLike.delete({
        where: { postId_visitorId: { postId: id, visitorId } },
      })
      const post = await prisma.post.update({
        where: { id },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      })
      return { liked: false, likeCount: Math.max(0, post.likeCount) }
    }
    await prisma.postLike.create({ data: { postId: id, visitorId } })
    const post = await prisma.post.update({
      where: { id },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true },
    })
    return { liked: true, likeCount: post.likeCount }
  }

  /**
   * 获取点赞状态
   */
  async getLikeStatus(id, visitorId) {
    const liked = !!(await prisma.postLike.findFirst({
      where: { postId: id, visitorId },
    }))
    const post = await prisma.post.findUnique({
      where: { id },
      select: { likeCount: true },
    })
    return { liked, likeCount: post?.likeCount ?? 0 }
  }

  /**
   * 获取上下篇(同分类、按时间顺序)
   */
  async getAdjacentPosts(id) {
    const current = await prisma.post.findUnique({
      where: { id },
      select: { categoryId: true, createdAt: true },
    })
    if (!current) {
      const err = new Error('文章不存在'); err.code = 'POST_NOT_FOUND'; throw err
    }
    const baseWhere = { isDeleted: false, status: 'published' }

    // 上一篇:同分类 + 时间更早,或(同分类 + 同一时间但 id 更小),取最近
    const prev = await prisma.post.findFirst({
      where: {
        ...baseWhere,
        categoryId: current.categoryId,
        OR: [
          { createdAt: { lt: current.createdAt } },
          { createdAt: current.createdAt, id: { lt: id } },
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { id: true, title: true, slug: true, createdAt: true },
    })

    // 下一篇:同分类 + 时间更晚
    const next = await prisma.post.findFirst({
      where: {
        ...baseWhere,
        categoryId: current.categoryId,
        OR: [
          { createdAt: { gt: current.createdAt } },
          { createdAt: current.createdAt, id: { gt: id } },
        ],
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: { id: true, title: true, slug: true, createdAt: true },
    })

    return { prev, next }
  }
}

module.exports = new PostService()