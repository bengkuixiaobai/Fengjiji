const app = require('./app')
const config = require('./config')

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
