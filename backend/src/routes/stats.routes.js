const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { authenticate, requireRole } = require('../middleware/auth.middleware')
const ApiResponse = require('../utils/response')

const prisma = new PrismaClient()

/**
 * @route   GET /api/stats/dashboard
 * @desc    获取仪表盘统计数据
 * @access  Private
 */
router.get('/dashboard', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const userId = req.userId

    // 获取文章总数
    const postsCount = await prisma.post.count({
      where: {
        authorId: userId,
        isDeleted: false,
        status: 'published',
      },
    })

    // 获取项目总数
    const projectsCount = await prisma.project.count({
      where: {
        authorId: userId,
        isPublic: true,
      },
    })

    // 获取累计签到天数
    const checkinsCount = await prisma.checkIn.count({
      where: { userId },
    })

    // 获取总访问量（所有文章的浏览量之和）
    const totalViews = await prisma.post.aggregate({
      where: {
        authorId: userId,
        isDeleted: false,
      },
      _sum: {
        viewCount: true,
      },
    })

    return ApiResponse.success(res, {
      postsCount,
      projectsCount,
      checkinsCount,
      totalViews: totalViews._sum.viewCount || 0,
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router