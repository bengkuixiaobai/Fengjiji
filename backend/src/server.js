const app = require('./app')
const config = require('./config')

// 全局未捕获异常处理
process.on('unhandledRejection', (reason) => {
  console.error('❌ 未捕获的 Promise 拒绝:', reason)
})
process.on('uncaughtException', (err) => {
  console.error('❌ 未捕获的异常:', err)
  process.exit(1)
})

const PORT = config.port

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 风迹集后端服务已启动                              ║
║                                                       ║
║   📍 地址: http://localhost:${PORT}                     ║
║   🌐 环境: ${config.nodeEnv}                             ║
║                                                       ║
║   📚 API 文档: http://localhost:${PORT}/api/health      ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `)
})
