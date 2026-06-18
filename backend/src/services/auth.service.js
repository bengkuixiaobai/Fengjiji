const bcrypt = require('bcrypt')
const { PrismaClient } = require('@prisma/client')
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth.middleware')

const prisma = new PrismaClient()
const SALT_ROUNDS = 12

class AuthService {
  /**
   * 用户注册
   */
  async register(username, email, password, inviteCode) {
    // 检查邀请码
    if (!inviteCode) {
      throw { code: 'INVITE_REQUIRED', message: '请输入邀请码' }
    }
    const code = await prisma.inviteCode.findUnique({ where: { code: inviteCode } })
    if (!code) {
      throw { code: 'INVITE_INVALID', message: '邀请码无效' }
    }
    if (code.usedById) {
      throw { code: 'INVITE_USED', message: '邀请码已被使用' }
    }

    // 检查用户是否存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    })

    if (existingUser) {
      if (existingUser.username === username) {
        throw { code: 'USERNAME_EXISTS', message: '用户名已存在' }
      }
      throw { code: 'EMAIL_EXISTS', message: '邮箱已被注册' }
    }

    // 密码加密
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: passwordHash,
        nickname: username,
      },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
      },
    })

    // 标记邀请码已使用
    await prisma.inviteCode.update({
      where: { id: code.id },
      data: { usedById: user.id, usedAt: new Date() },
    })

    // 生成 Token
    const token = generateToken(user.id)
    const refreshToken = generateRefreshToken(user.id)

    return { user, token, refreshToken }
  }

  /**
   * 用户登录
   */
  async login(usernameOrEmail, password) {
    // 判断是邮箱还是用户名登录
    const isEmail = usernameOrEmail.includes('@')

    // 查找用户
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail },
    })

    if (!user) {
      throw { code: 'INVALID_CREDENTIALS', message: '用户名/邮箱或密码错误' }
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      throw { code: 'INVALID_CREDENTIALS', message: '用户名/邮箱或密码错误' }
    }

    // 生成 Token
    const token = generateToken(user.id)
    const refreshToken = generateRefreshToken(user.id)

    // 返回用户信息（不含密码）
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
    }

    return { user: userData, token, refreshToken }
  }

  /**
   * 刷新 Token
   */
  async refreshToken(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken)

    if (!decoded) {
      throw { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh Token 无效' }
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      throw { code: 'USER_NOT_FOUND', message: '用户不存在' }
    }

    // 生成新 Token
    const newToken = generateToken(user.id)
    const newRefreshToken = generateRefreshToken(user.id)

    return { token: newToken, refreshToken: newRefreshToken }
  }

  /**
   * 获取当前用户
   */
  async getCurrentUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw { code: 'USER_NOT_FOUND', message: '用户不存在' }
    }

    return user
  }

  /**
   * 更新用户信息
   */
  async updateProfile(userId, data) {
    const { nickname, avatar, bio } = data

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        nickname,
        avatar,
        bio,
      },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        avatar: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return user
  }

  /**
   * 修改密码
   */
  async changePassword(userId, oldPassword, newPassword) {
    // 获取用户
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw { code: 'USER_NOT_FOUND', message: '用户不存在' }
    }

    // 验证旧密码
    const isValid = await bcrypt.compare(oldPassword, user.password)

    if (!isValid) {
      throw { code: 'WRONG_PASSWORD', message: '旧密码错误' }
    }

    // 加密新密码
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

    // 更新密码
    await prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    })

    return true
  }
}

module.exports = new AuthService()
