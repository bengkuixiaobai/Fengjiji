const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { authenticate } = require('../middleware/auth.middleware')
const ApiResponse = require('../utils/response')

const prisma = new PrismaClient()

/**
 * @route   GET /api/checkins
 * @desc    获取用户签到记录
 * @access  Private
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { year, month } = req.query

    const where = {
      userId: req.userId,
    }

    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0)
      where.date = {
        gte: startDate,
        lte: endDate,
      }
    }

    const checkins = await prisma.checkIn.findMany({
      where,
      orderBy: { date: 'desc' },
    })

    // 返回日期字符串数组
    const dates = checkins.map(c => c.date.toISOString().split('T')[0])

    return ApiResponse.success(res, { dates, total: checkins.length })
  } catch (error) {
    next(error)
  }
})

/**
 * @route   POST /api/checkins
 * @desc    签到
 * @access  Private
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { date } = req.body

    if (!date) {
      return ApiResponse.validationError(res, '请选择签到日期')
    }

    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)

    // 检查是否已经签到
    const existing = await prisma.checkIn.findFirst({
      where: {
        userId: req.userId,
        date: checkDate,
      },
    })

    if (existing) {
      return ApiResponse.conflict(res, '今日已签到')
    }

    // 创建签到记录
    const checkin = await prisma.checkIn.create({
      data: {
        userId: req.userId,
        date: checkDate,
      },
    })

    return ApiResponse.created(res, {
      date: checkin.date.toISOString().split('T')[0],
    }, '签到成功')
  } catch (error) {
    next(error)
  }
})

/**
 * @route   GET /api/checkins/stats
 * @desc    获取签到统计
 * @access  Private
 */
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const totalDays = await prisma.checkIn.count({
      where: { userId: req.userId },
    })

    // 获取本月签到天数
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthDays = await prisma.checkIn.count({
      where: {
        userId: req.userId,
        date: {
          gte: startOfMonth,
          lte: now,
        },
      },
    })

    return ApiResponse.success(res, {
      totalDays,
      thisMonthDays,
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router