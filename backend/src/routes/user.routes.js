const express = require('express')
const router = express.Router()
const Joi = require('joi')
const authController = require('../controllers/auth.controller')
const { authenticate, requireRole } = require('../middleware/auth.middleware')
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

// 更新个人信息验证 schema
const updateProfileSchema = Joi.object({
  nickname: Joi.string().max(100),
  avatar: Joi.string().uri().allow('', null),
  bio: Joi.string().max(500).allow('', null),
})

// 修改密码验证 schema
const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
    .messages({
      'string.min': '新密码至少6个字符',
    }),
})

/**
 * @route   GET /api/users/me
 * @desc    获取当前用户信息
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser)

/**
 * @route   PUT /api/users/me
 * @desc    更新当前用户信息
 * @access  Private
 */
router.put('/me', authenticate, validate(updateProfileSchema), authController.updateProfile)

/**
 * @route   PUT /api/users/me/password
 * @desc    修改密码
 * @access  Private
 */
router.put('/me/password', authenticate, validate(changePasswordSchema), authController.changePassword)

/**
 * @route   GET /api/users/me/invite-code
 * @desc    获取当前用户的邀请码
 * @access  Private
 */
router.get('/me/invite-code', authenticate, requireRole('admin'), authController.getMyInviteCode)

module.exports = router
