const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const path = require('path')
const routes = require('./routes')
const config = require('./config')
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware')

// 创建 Express 应用
const app = express()

// P3-17:生产环境从环境变量 CORS_ORIGIN 读取允许的来源(逗号分隔)
// dev 模式默认 * 便于 Vite 跨域代理
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}))

// 安全头(P3-17a)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // 允许上传图片跨域引用
}))

app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev')) // HTTP 日志

// 请求体解析（限制大小防攻击）
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// 静态文件(上传的图片)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// API 路由
app.use('/api', routes)

// 根路由
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '风迹集 API 服务',
    version: '1.0.0',
    docs: '/api/health',
  })
})

// 404 处理
app.use(notFoundHandler)

// 全局错误处理
app.use(errorHandler)

module.exports = app
