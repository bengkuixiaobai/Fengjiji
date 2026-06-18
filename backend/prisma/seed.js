// 生成测试邀请码
// 运行: node prisma/seed.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const code = 'FENGJI2026'
  const existing = await prisma.inviteCode.findUnique({ where: { code } })
  if (existing) {
    console.log(`邀请码 ${code} 已存在，状态: ${existing.usedById ? '已使用' : '未使用'}`)
    return
  }
  await prisma.inviteCode.create({ data: { code } })
  console.log(`邀请码 ${code} 已创建`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
