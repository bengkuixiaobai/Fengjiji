// PM2 生态系统配置 — 管理风迹集后端进程
// 使用: pm2 start ecosystem.config.js --env production
// 或:   pm2 start ecosystem.config.js --env development

module.exports = {
  apps: [
    {
      name: 'fengjiji-api',
      script: 'backend/index.js',
      cwd: './',

      // 环境变量
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // 进程管理
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',

      // 日志轮转
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      max_size: '10M',
      retain: 10,

      // 自动重启
      watch: false,
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 10,

      // 优雅关闭
      kill_timeout: 5000,
      listen_timeout: 3000,
    },
  ],
}
