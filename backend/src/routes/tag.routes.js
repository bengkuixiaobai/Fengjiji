const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { authenticate } = require('../middleware/auth.middleware')
const ApiResponse = require('../utils/response')

const prisma = new PrismaClient()

/**
 * @route   POST /api/tags
 * @desc    创建标签
 * @access  Private
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name) return ApiResponse.validationError(res, '请输入标签名称')

    const slug = name.toLowerCase().replace(/[^a-z0-9一-龥]+/g, '-').replace(/(^-|-$)/g, '')
    const tag = await prisma.tag.create({ data: { name, slug } })
    return ApiResponse.created(res, tag)
  } catch (error) {
    if (error.code === 'P2002') return ApiResponse.conflict(res, '标签已存在')
    next(error)
  }
})

/**
 * @route   GET /api/tags
 * @desc    获取所有标签
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    })

    return ApiResponse.success(res, tags)
  } catch (error) {
    next(error)
  }
})

/**
 * @route   GET /api/tags/:id
 * @desc    获取标签详情
 * @access  Public
 */
router.get('/:idOrSlug', async (req, res, next) => {
  try {
    const { idOrSlug } = req.params
    // P1-6:前端按 slug 查,后端同时支持按 id(数字)和 slug(字符串)
    const isNumeric = /^\d+$/.test(idOrSlug)
    const where = isNumeric
      ? { id: parseInt(idOrSlug) }
      : { slug: idOrSlug }
    const tag = await prisma.tag.findUnique({
      where,
      include: {
        _count: { select: { posts: true } },
      },
    })

    if (!tag) {
      return ApiResponse.notFound(res, '标签不存在')
    }

    return ApiResponse.success(res, tag)
  } catch (error) {
    next(error)
  }
})

module.exports = router