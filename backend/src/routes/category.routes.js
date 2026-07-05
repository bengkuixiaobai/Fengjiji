const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { authenticate, requireRole } = require('../middleware/auth.middleware')
const ApiResponse = require('../utils/response')

const prisma = new PrismaClient()

/**
 * @route   POST /api/categories
 * @desc    创建分类
 * @access  Private
 */
router.post('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name) return ApiResponse.validationError(res, '请输入分类名称')

    const slug = name.toLowerCase().replace(/[^a-z0-9一-龥]+/g, '-').replace(/(^-|-$)/g, '')
    const category = await prisma.category.create({ data: { name, slug } })
    return ApiResponse.created(res, category)
  } catch (error) {
    if (error.code === 'P2002') return ApiResponse.conflict(res, '分类已存在')
    next(error)
  }
})

/**
 * @route   GET /api/categories
 * @desc    获取所有分类
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    })

    return ApiResponse.success(res, categories)
  } catch (error) {
    next(error)
  }
})

/**
 * @route   GET /api/categories/:id
 * @desc    获取分类详情
 * @access  Public
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    })

    if (!category) {
      return ApiResponse.notFound(res, '分类不存在')
    }

    return ApiResponse.success(res, category)
  } catch (error) {
    next(error)
  }
})

/**
 * @route   DELETE /api/categories/:id
 * @desc    删除分类
 * @access  Private
 */
router.delete('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params
    // 将属于该分类的文章设为未分类
    await prisma.post.updateMany({
      where: { categoryId: parseInt(id) },
      data: { categoryId: null },
    })
    await prisma.category.delete({ where: { id: parseInt(id) } })
    return ApiResponse.success(res, null, '分类已删除')
  } catch (error) {
    if (error.code === 'P2025') return ApiResponse.notFound(res, '分类不存在')
    next(error)
  }
})

module.exports = router