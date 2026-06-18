const express = require('express')
const router = express.Router()
const Joi = require('joi')
const postController = require('../controllers/post.controller')
const { authenticate } = require('../middleware/auth.middleware')
const ApiResponse = require('../utils/response')

// 验证中间件
function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body)
    if (error) {
      return ApiResponse.validationError(res, error.details[0].message)
    }
    next()
  }
}

// 创建文章验证 schema
const createPostSchema = Joi.object({
  title: Joi.string().required().messages({
    'string.empty': '请输入文章标题',
  }),
  slug: Joi.string().required().messages({
    'string.empty': '请输入文章 slug',
  }),
  summary: Joi.string().allow('', null),
  content: Joi.string().required().messages({
    'string.empty': '请输入文章内容',
  }),
  coverImage: Joi.string().uri().allow('', null),
  categoryId: Joi.number().integer().allow(null),
  tagIds: Joi.array().items(Joi.number().integer()),
  status: Joi.string().valid('draft', 'published').default('draft'),
  projectId: Joi.number().integer().allow(null),
})

// 更新文章验证 schema
const updatePostSchema = Joi.object({
  title: Joi.string(),
  slug: Joi.string(),
  summary: Joi.string().allow('', null),
  content: Joi.string(),
  coverImage: Joi.string().uri().allow('', null),
  categoryId: Joi.number().integer().allow(null),
  tagIds: Joi.array().items(Joi.number().integer()),
  status: Joi.string().valid('draft', 'published'),
  projectId: Joi.number().integer().allow(null),
})

/**
 * @route   GET /api/posts
 * @desc    获取文章列表
 * @access  Public
 */
router.get('/', postController.getPosts)

/**
 * @route   GET /api/posts/:id
 * @desc    获取文章详情
 * @access  Public
 */
router.get('/:id', postController.getPostById)

/**
 * @route   POST /api/posts
 * @desc    创建文章
 * @access  Private
 */
router.post('/', authenticate, validate(createPostSchema), postController.createPost)

/**
 * @route   PUT /api/posts/:id
 * @desc    更新文章
 * @access  Private
 */
router.put('/:id', authenticate, validate(updatePostSchema), postController.updatePost)

/**
 * @route   DELETE /api/posts/:id
 * @desc    删除文章
 * @access  Private
 */
router.delete('/:id', authenticate, postController.deletePost)

module.exports = router