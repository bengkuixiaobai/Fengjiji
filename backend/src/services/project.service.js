const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

class ProjectService {
  /**
   * 获取项目列表
   */
  async getProjects(options = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      authorId,
      isPublic = true,
      search,
      orderBy = 'createdAt',
      order = 'desc',
    } = options

    const skip = (page - 1) * limit

    const where = {
      isPublic,
    }

    if (status) {
      where.status = status
    }

    if (authorId) {
      where.authorId = authorId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const orderByObj = {}
    if (orderBy === 'completionRate') {
      orderByObj.completionRate = order
    } else {
      orderByObj.createdAt = order
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
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
          stages: {
            orderBy: { sortOrder: 'asc' },
            include: {
              tasks: {
                where: { isCompleted: true },
              },
            },
          },
          _count: {
            select: {
              posts: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ])

    // 格式化返回数据
    const formattedProjects = projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      techStack: project.techStack ? JSON.parse(project.techStack) : [],
      plan: project.plan ? JSON.parse(project.plan) : [],
      codeUrl: project.codeUrl,
      demoUrl: project.demoUrl,
      status: project.status,
      completionRate: project.completionRate,
      isPublic: project.isPublic,
      createdAt: project.createdAt,
      completedAt: project.completedAt,
      author: project.author,
      stagesCount: project.stages.length,
      tasksCompletedCount: project.stages.reduce((acc, stage) => acc + stage.tasks.length, 0),
      postsCount: project._count.posts,
    }))

    return {
      projects: formattedProjects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * 获取项目详情
   */
  async getProjectById(id) {
    const project = await prisma.project.findUnique({
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
        stages: {
          orderBy: { sortOrder: 'asc' },
          include: {
            tasks: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        posts: {
          where: { isDeleted: false },
          select: {
            id: true,
            title: true,
            slug: true,
            createdAt: true,
          },
        },
      },
    })

    if (!project) {
      throw { code: 'PROJECT_NOT_FOUND', message: '项目不存在' }
    }

    return {
      ...project,
      techStack: project.techStack ? JSON.parse(project.techStack) : [],
      plan: project.plan ? JSON.parse(project.plan) : [],
    }
  }

  /**
   * 创建项目
   */
  async createProject(authorId, data) {
    const { name, description, techStack, codeUrl, demoUrl, status, isPublic,
            startDate, expectedEndDate, bufferDays, plan } = data

    const project = await prisma.project.create({
      data: {
        name,
        description,
        techStack: techStack ? JSON.stringify(techStack) : null,
        codeUrl,
        demoUrl,
        status: status || 'planning',
        isPublic: isPublic !== false,
        authorId,
        startDate: startDate ? new Date(startDate) : null,
        expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : null,
        bufferDays: bufferDays ?? 0,
        plan: plan ? JSON.stringify(plan) : null,
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
      },
    })

    return {
      ...project,
      techStack: project.techStack ? JSON.parse(project.techStack) : [],
      plan: project.plan ? JSON.parse(project.plan) : [],
    }
  }

  /**
   * 更新项目
   */
  async updateProject(id, authorId, data) {
    const { name, description, techStack, codeUrl, demoUrl, status, isPublic, completionRate,
            startDate, expectedEndDate, bufferDays, plan } = data

    const existing = await prisma.project.findUnique({
      where: { id },
    })

    if (!existing) {
      throw { code: 'PROJECT_NOT_FOUND', message: '项目不存在' }
    }

    if (existing.authorId !== authorId) {
      throw { code: 'FORBIDDEN', message: '没有权限修改此项目' }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        techStack: techStack ? JSON.stringify(techStack) : undefined,
        codeUrl,
        demoUrl,
        status,
        isPublic,
        completionRate,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        expectedEndDate: expectedEndDate !== undefined ? (expectedEndDate ? new Date(expectedEndDate) : null) : undefined,
        bufferDays: bufferDays !== undefined ? bufferDays : undefined,
        plan: plan !== undefined ? (plan ? JSON.stringify(plan) : null) : undefined,
        completedAt: status === 'completed' && !existing.completedAt ? new Date() : existing.completedAt,
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
      },
    })

    return {
      ...project,
      techStack: project.techStack ? JSON.parse(project.techStack) : [],
      plan: project.plan ? JSON.parse(project.plan) : [],
    }
  }

  /**
   * 删除项目
   */
  async deleteProject(id, authorId) {
    const existing = await prisma.project.findUnique({
      where: { id },
    })

    if (!existing) {
      throw { code: 'PROJECT_NOT_FOUND', message: '项目不存在' }
    }

    if (existing.authorId !== authorId) {
      throw { code: 'FORBIDDEN', message: '没有权限删除此项目' }
    }

    await prisma.project.delete({
      where: { id },
    })

    return true
  }

  /**
   * 获取用户项目数量
   */
  async getUserProjectCount(userId) {
    return prisma.project.count({
      where: {
        authorId: userId,
        isPublic: true,
      },
    })
  }
}

module.exports = new ProjectService()