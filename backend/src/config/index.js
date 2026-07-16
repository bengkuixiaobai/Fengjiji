// P3-3: 显式加载 backend/.env,避免 PM2 在父目录启动时找不到
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') })

const nodeEnv = process.env.NODE_ENV || 'development'
const isProd = nodeEnv === 'production'

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv,

  jwt: {
    // P3-14:生产环境强制要求设置 JWT_SECRET,使用弱密钥会直接退出
    secret: (() => {
      const secret = process.env.JWT_SECRET
      if (isProd && (!secret || secret === 'default-secret-key' || secret.length < 32)) {
        console.error('❌ FATAL: 生产环境必须设置强 JWT_SECRET (至少 32 字符)')
        console.error('   生成方式: openssl rand -hex 32')
        process.exit(1)
      }
      if (!secret) {
        console.warn('⚠️  JWT_SECRET 未设置,使用弱默认值(仅限 dev)')
        return 'dev-only-secret-please-replace-in-production'
      }
      return secret
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  cors: {
    // P3-17:生产环境只允许指定来源
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
      : (isProd ? false : '*'),
  },
}
