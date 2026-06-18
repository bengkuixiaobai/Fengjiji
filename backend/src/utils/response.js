/**
 * 统一响应格式工具
 */

class ApiResponse {
  /**
   * 成功响应
   */
  static success(res, data = null, message = '操作成功') {
    return res.json({
      success: true,
      data,
      message,
    })
  }

  /**
   * 创建成功 (201)
   */
  static created(res, data = null, message = '创建成功') {
    return res.status(201).json({
      success: true,
      data,
      message,
    })
  }

  /**
   * 错误响应
   */
  static error(res, message = '操作失败', code = 'ERROR', statusCode = 400) {
    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
      },
    })
  }

  /**
   * 未授权 (401)
   */
  static unauthorized(res, message = '未授权，请登录') {
    return this.error(res, message, 'UNAUTHORIZED', 401)
  }

  /**
   * 禁止访问 (403)
   */
  static forbidden(res, message = '禁止访问') {
    return this.error(res, message, 'FORBIDDEN', 403)
  }

  /**
   * 资源不存在 (404)
   */
  static notFound(res, message = '资源不存在') {
    return this.error(res, message, 'NOT_FOUND', 404)
  }

  /**
   * 服务器错误 (500)
   */
  static serverError(res, message = '服务器内部错误') {
    return this.error(res, message, 'SERVER_ERROR', 500)
  }

  /**
   * 验证错误 (400)
   */
  static validationError(res, message = '参数验证失败') {
    return this.error(res, message, 'VALIDATION_ERROR', 400)
  }

  /**
   * 资源冲突 (409)
   */
  static conflict(res, message = '资源冲突') {
    return this.error(res, message, 'CONFLICT', 409)
  }
}

module.exports = ApiResponse
