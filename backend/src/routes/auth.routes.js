const express = require('express')
const router = express.Router()
const Joi = require('joi')
const authController = require('../controllers/auth.controller')
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

// 注册验证 schema
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(20).required()
    .messages({
      'string.min': '用户名至少3个字符',
      'string.max': '用户名最多20个字符',
    }),
  email: Joi.string().email().required()
    .messages({
      'string.email': '请输入有效的邮箱地址',
    }),
  password: Joi.string().min(6).required()
    .messages({
      'string.min': '密码至少6个字符',
    }),
  inviteCode: Joi.string().required().messages({
    'string.empty': '请输入邀请码',
  }),
})

// 登录验证 schema
const loginSchema = Joi.object({
  usernameOrEmail: Joi.string().required()
    .messages({
      'string.empty': '请输入用户名或邮箱',
    }),
  password: Joi.string().required()
    .messages({
      'string.empty': '请输入密码',
    }),
})

// 刷新 Token 验证 schema
const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
})

/**
 * @route   POST /api/auth/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', validate(registerSchema), authController.register)

/**
 * @route   POST /api/auth/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login', validate(loginSchema), authController.login)

/**
 * @route   POST /api/auth/refresh
 * @desc    刷新 Token
 * @access  Public
 */
router.post('/refresh', validate(refreshSchema), authController.refresh)

/**
 * @route   POST /api/auth/logout
 * @desc    用户登出
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout)

module.exports = router
