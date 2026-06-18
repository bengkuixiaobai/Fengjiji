const ApiResponse = require('../utils/response')

/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err)

  // Joi 验证错误
  if (err.isJoi) {
    return ApiResponse.validationError(
      res,
      err.details.map((d) => d.message).join(', ')
    )
  }

  // Prisma 唯一约束错误
  if (err.code === 'P2002') {
    return ApiResponse.conflict(res, '该资源已存在')
  }

  // Prisma 记录不存在
  if (err.code === 'P2025') {
    return ApiResponse.notFound(res, '记录不存在')
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Token 无效')
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Token 已过期')
  }

  // 默认服务器错误
  const message = process.env.NODE_ENV === 'production'
    ? '服务器内部错误'
    : err.message || '服务器内部错误'

  return ApiResponse.serverError(res, message)
}

/**
 * 404 处理
 */
function notFoundHandler(req, res) {
  return ApiResponse.notFound(res, 'API 路由不存在')
}

module.exports = {
  errorHandler,
  notFoundHandler,
}
