// 生成测试邀请码 + 初始管理员账号
// 运行: node prisma/seed.js
// 管理员密码: Admin@123456 (首次登录后请立即修改!)

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

const ADMIN = {
  username: 'admin',
  email: 'admin@fengjiji.local',
  password: 'Admin@123456',
  nickname: '风迹集主',
}

const INVITE_CODE = 'FENGJI2026'

async function main() {
  // 1. 邀请码
  const existingCode = await prisma.inviteCode.findUnique({ where: { code: INVITE_CODE } })
  if (existingCode) {
    console.log(`[OK] 邀请码 ${INVITE_CODE} 已存在`)
  } else {
    await prisma.inviteCode.create({ data: { code: INVITE_CODE } })
    console.log(`[OK] 邀请码 ${INVITE_CODE} 已创建`)
  }

  // 2. 初始管理员
  const existingUser = await prisma.user.findUnique({ where: { username: ADMIN.username } })
  if (existingUser) {
    console.log(`[OK] 管理员 ${ADMIN.username} 已存在 (id=${existingUser.id})`)
  } else {
    const password = await bcrypt.hash(ADMIN.password, 10)
    const user = await prisma.user.create({
      data: {
        username: ADMIN.username,
        email: ADMIN.email,
        password,
        nickname: ADMIN.nickname,
        role: 'admin',
      },
    })
    console.log(`[OK] 初始管理员已创建:`)
    console.log(`     username: ${ADMIN.username}`)
    console.log(`     email:    ${ADMIN.email}`)
    console.log(`     id:       ${user.id}`)
    console.log(`     ⚠️  密码已在安全 hash 后存储,首次登录后请立即修改密码!`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(() => prisma.$disconnect())
