const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const path = require('path')
const routes = require('./routes')
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware')

// 创建 Express 应用
const app = express()

// 中间件
app.use(cors()) // 跨域资源共享
app.use(morgan('dev')) // HTTP 日志
app.use(express.json()) // JSON 解析
app.use(express.urlencoded({ extended: true })) // URL 编码

// 静态文件（上传的图片）
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
