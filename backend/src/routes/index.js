const express = require('express')
const router = express.Router()

const authRoutes = require('./auth.routes')
const userRoutes = require('./user.routes')
const postRoutes = require('./post.routes')
const projectRoutes = require('./project.routes')
const categoryRoutes = require('./category.routes')
const tagRoutes = require('./tag.routes')
const checkinRoutes = require('./checkin.routes')
const statsRoutes = require('./stats.routes')
const uploadRoutes = require('./upload.routes')

// 挂载路由
router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/posts', postRoutes)
router.use('/projects', projectRoutes)
router.use('/categories', categoryRoutes)
router.use('/tags', tagRoutes)
router.use('/checkins', checkinRoutes)
router.use('/stats', statsRoutes)
router.use('/upload', uploadRoutes)

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务器运行正常',
    timestamp: new Date().toISOString(),
  })
})

module.exports = router
