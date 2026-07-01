const authService = require('../services/auth.service')
const ApiResponse = require('../utils/response')

/**
 * 用户注册
 */
async function register(req, res, next) {
  try {
    const { username, email, password, inviteCode } = req.body

    const result = await authService.register(username, email, password, inviteCode)

    return ApiResponse.created(res, {
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken,
    })
  } catch (error) {
    if (error.code === 'USERNAME_EXISTS' || error.code === 'EMAIL_EXISTS') {
      return ApiResponse.conflict(res, error.message)
    }
    if (error.code === 'INVITE_REQUIRED' || error.code === 'INVITE_INVALID' || error.code === 'INVITE_USED') {
      return ApiResponse.error(res, error.message, error.code, 400)
    }
    next(error)
  }
}

/**
 * 用户登录
 */
async function login(req, res, next) {
  try {
    const { usernameOrEmail, password } = req.body

    if (!usernameOrEmail) {
      return ApiResponse.validationError(res, '请输入用户名或邮箱')
    }

    const result = await authService.login(usernameOrEmail, password)

    return ApiResponse.success(res, {
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken,
    })
  } catch (error) {
    if (error.code === 'INVALID_CREDENTIALS') {
      return ApiResponse.unauthorized(res, error.message)
    }
    next(error)
  }
}

/**
 * 刷新 Token
 */
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return ApiResponse.validationError(res, '请提供 refreshToken')
    }

    const result = await authService.refreshToken(refreshToken)

    return ApiResponse.success(res, result)
  } catch (error) {
    if (error.code === 'INVALID_REFRESH_TOKEN') {
      return ApiResponse.unauthorized(res, error.message)
    }
    next(error)
  }
}

/**
 * 获取当前用户
 */
async function getCurrentUser(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.userId)

    return ApiResponse.success(res, user)
  } catch (error) {
    next(error)
  }
}

/**
 * 更新用户信息
 */
async function updateProfile(req, res, next) {
  try {
    const { nickname, avatar, bio } = req.body

    const user = await authService.updateProfile(req.userId, { nickname, avatar, bio })

    return ApiResponse.success(res, user)
  } catch (error) {
    next(error)
  }
}

/**
 * 修改密码
 */
async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return ApiResponse.validationError(res, '请提供旧密码和新密码')
    }

    if (newPassword.length < 6) {
      return ApiResponse.validationError(res, '新密码至少6个字符')
    }

    await authService.changePassword(req.userId, oldPassword, newPassword)

    return ApiResponse.success(res, null, '密码修改成功')
  } catch (error) {
    if (error.code === 'WRONG_PASSWORD') {
      return ApiResponse.error(res, error.message, 'WRONG_PASSWORD', 400)
    }
    next(error)
  }
}

/**
 * 登出（前端删除 Token 即可，后端可扩展为 Token 黑名单）
 */
async function logout(req, res, next) {
  // 这里可以扩展为将 Token 加入黑名单
  return ApiResponse.success(res, null, '登出成功')
}

/**
 * 获取当前用户的邀请码
 */
async function getMyInviteCode(req, res, next) {
  try {
    const inviteInfo = await authService.getMyInviteCode(req.userId)
    return ApiResponse.success(res, inviteInfo)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  register,
  login,
  refresh,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout,
  getMyInviteCode,
}
