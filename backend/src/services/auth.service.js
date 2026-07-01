const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { PrismaClient } = require('@prisma/client')
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth.middleware')

const prisma = new PrismaClient()
const SALT_ROUNDS = 12

/** 生成 8 位邀请码,格式 FJ-XXXX-XXXX */
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 去掉易混淆字符
  const part = () =>
    Array.from(crypto.randomBytes(4))
      .map(b => chars[b % chars.length])
      .join('')
  return `FJ-${part()}-${part()}`
}

class AuthService {
  /**
   * 用户注册
   * - 必须有有效邀请码
   * - 邀请码的 creator 已邀请人数必须 < 5
   * - 注册成功后给新用户生成一个邀请码
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
    // 检查使用次数上限
    if (code.usageCount >= code.maxUsage) {
      throw { code: 'INVITE_EXHAUSTED', message: `该邀请码已被使用 ${code.maxUsage} 次,无法再邀请新用户` }
    }
    // 兼容旧数据:如果之前是 usedById 模式但没转过来,跳过 (新 schema 里这个列已删)

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
        role: 'admin', // 通过邀请码注册的都是 admin(体验访客在 seed 创建)
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

    // 增加邀请码使用次数
    await prisma.inviteCode.update({
      where: { id: code.id },
      data: { usageCount: { increment: 1 } },
    })

    // 给新用户生成一个邀请码(每人一码,最多邀请 5 人)
    await prisma.inviteCode.create({
      data: {
        code: generateInviteCode(),
        creatorId: user.id,
        maxUsage: 5,
      },
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
    const isEmail = usernameOrEmail.includes('@')

    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail,
        },
    })

    if (!user) {
      throw { code: 'INVALID_CREDENTIALS', message: '用户名/邮箱或密码错误' }
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      throw { code: 'INVALID_CREDENTIALS', message: '用户名/邮箱或密码错误' }
    }

    const token = generateToken(user.id)
    const refreshToken = generateRefreshToken(user.id)

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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      throw { code: 'USER_NOT_FOUND', message: '用户不存在' }
    }

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
   * 获取当前用户的邀请码信息
   * 返回:邀请码本身 + 已使用次数 + 上限
   */
  async getMyInviteCode(userId) {
    let code = await prisma.inviteCode.findFirst({
      where: { creatorId: userId },
    })

    // 如果还没有邀请码(老用户迁移等情况),自动生成一个
    if (!code) {
      code = await prisma.inviteCode.create({
        data: {
          code: generateInviteCode(),
          creatorId: userId,
          maxUsage: 5,
        },
      })
    }

    return {
      code: code.code,
      usageCount: code.usageCount,
      maxUsage: code.maxUsage,
      remaining: Math.max(0, code.maxUsage - code.usageCount),
    }
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw { code: 'USER_NOT_FOUND', message: '用户不存在' }
    }

    const isValid = await bcrypt.compare(oldPassword, user.password)

    if (!isValid) {
      throw { code: 'WRONG_PASSWORD', message: '旧密码错误' }
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

    await prisma.user.update({
      where: { id: userId },
      data: { password: passwordHash },
    })

    return true
  }
}

module.exports = new AuthService()