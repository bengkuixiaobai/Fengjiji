const jwt = require('jsonwebtoken')
const config = require('../config')
const { PrismaClient } = require('@prisma/client')
const ApiResponse = require('../utils/response')

const prisma = new PrismaClient()

/**
 * JWT 认证中间件
 */
async function authenticate(req, res, next) {
  try {
    // 从 Header 获取 Token
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, '未提供认证 Token')
    }

    const token = authHeader.split(' ')[1]

    // 验证 Token
    const decoded = jwt.verify(token, config.jwt.secret)

    // 从数据库获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        avatar: true,
        bio: true,
        role: true,
      },
    })

    if (!user) {
      return ApiResponse.unauthorized(res, '用户不存在')
    }

    // 将用户信息挂载到 req
    req.user = user
    req.userId = user.id

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, 'Token 无效')
    }
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Token 已过期')
    }
    next(error)
  }
}

/**
 * 生成 JWT Token
 */
function generateToken(userId) {
  const token = jwt.sign(
    { userId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  )
  return token
}

/**
 * 生成 Refresh Token
 */
function generateRefreshToken(userId) {
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  )
  return refreshToken
}

/**
 * 验证 Refresh Token
 */
function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    if (decoded.type !== 'refresh') {
      return null
    }
    return decoded
  } catch (error) {
    return null
  }
}

module.exports = {
  authenticate,
  requireRole,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
}

/**
 * 角色权限中间件
 * 用法:requireRole('admin') 或 requireRole('admin', 'visitor')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, '未登录')
    }
    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, `此操作仅限 ${allowedRoles.join('/')} 角色,你的角色是 ${req.user.role}`)
    }
    next()
  }
}
