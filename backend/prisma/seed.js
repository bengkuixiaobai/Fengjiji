// 初始化管理员 + 体验访客 + 各自动生成的邀请码
// 运行: node prisma/seed.js
//
// 管理员账号从环境变量读取(避免硬编码弱密码):
//   ADMIN_USERNAME   默认 admin
//   ADMIN_EMAIL      默认 admin@fengjiji.local
//   ADMIN_PASSWORD   必填,启动时会强制校验
//   ADMIN_NICKNAME   默认 风迹集主
//
// 访客账号(可选,设置 GUEST_PASSWORD 才会创建):
//   GUEST_PASSWORD   启动时若设置,则创建体验访客
//
// ⚠️  生产环境务必设置 ADMIN_PASSWORD(强密码,8 位以上,推荐 16 位)
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const crypto = require('crypto')

const prisma = new PrismaClient()

// 管理员配置
const ADMIN = {
  username: process.env.ADMIN_USERNAME || 'admin',
  email: process.env.ADMIN_EMAIL || 'admin@fengjiji.local',
  password: process.env.ADMIN_PASSWORD,
  nickname: process.env.ADMIN_NICKNAME || '风迹集主',
  role: 'admin',
}

// 体验访客配置(可选,通过环境变量 GUEST_PASSWORD 启用)
// 如果不设置 GUEST_PASSWORD,则不创建访客账号
const GUEST = {
  username: process.env.GUEST_USERNAME || 'guest',
  email: process.env.GUEST_EMAIL || 'guest@fengjiji.local',
  password: process.env.GUEST_PASSWORD,
  nickname: process.env.GUEST_NICKNAME || '体验访客',
  role: 'visitor',
}

/** 生成 8 位邀请码,格式 FJ-XXXX-XXXX */
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 去掉易混淆的 0/O/1/I
  const part = () =>
    Array.from(crypto.randomBytes(4))
      .map(b => chars[b % chars.length])
      .join('')
  return `FJ-${part()}-${part()}`
}

/** 给某个用户确保拥有一个邀请码(没有则生成) */
async function ensureInviteCodeFor(user) {
  const existing = await prisma.inviteCode.findFirst({
    where: { creatorId: user.id },
  })
  if (existing) {
    console.log(`[OK] ${user.username} 已拥有邀请码: ${existing.code}`)
    return existing
  }
  const code = generateInviteCode()
  await prisma.inviteCode.create({
    data: {
      code,
      creatorId: user.id,
      maxUsage: 5,
    },
  })
  console.log(`[OK] 为 ${user.username} 生成邀请码: ${code}`)
  return code
}

/** 创建或跳过用户 */
async function createOrSkipUser(userData, isRequired = true) {
  // 没密码但必填 → 报错
  if (!userData.password) {
    if (isRequired) {
      console.error(`❌ FATAL: ${userData.username} 未设置 ${userData.username === 'admin' ? 'ADMIN_PASSWORD' : 'GUEST_PASSWORD'} 环境变量`)
      console.error('   生成方式: openssl rand -base64 16')
      process.exit(1)
    }
    return null // 跳过非必填的访客
  }

  const existing = await prisma.user.findUnique({
    where: { username: userData.username },
  })
  if (existing) {
    console.log(`[OK] 用户 ${userData.username} 已存在 (id=${existing.id})`)
    return existing
  }

  const passwordHash = await bcrypt.hash(userData.password, 10)
  const user = await prisma.user.create({
    data: {
      username: userData.username,
      email: userData.email,
      password: passwordHash,
      nickname: userData.nickname,
      role: userData.role,
    },
  })
  console.log(`[OK] 用户 ${userData.username} 已创建 (id=${user.id})`)
  console.log(`     密码已用 bcrypt 哈希存储,不在日志中显示`)
  return user
}

async function main() {
  console.log('===== 风迹集种子数据 =====')

  // 1. 管理员
  const admin = await createOrSkipUser(ADMIN, true)

  // 2. 体验访客(可选,需要 GUEST_PASSWORD)
  const guest = await createOrSkipUser(GUEST, false)

  // 3. 给每个用户生成邀请码
  if (admin) await ensureInviteCodeFor(admin)
  if (guest) await ensureInviteCodeFor(guest)

  console.log('\n===== 完成 =====')
  console.log('下一步:')
  console.log('  1. 启动后端: npm start')
  console.log('  2. 访问 http://localhost:5173 (前端)')
  console.log('  3. 用管理员账号登录,首登后请立即修改密码')
  if (guest) {
    console.log('  4. 体验访客账号已创建(账号信息未在控制台显示,自行到数据库或部署信息文件查看)')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())