#!/bin/bash
#
# 风迹集一键更新脚本(部署后日常使用)
# 用法:在服务器上 bash update.sh
#
# 适用:已部署的项目,需要拉取最新代码并重启
#

set -e

APP_DIR="/home/fengjiji/code/Fengjiji"
APP_USER="fengjiji"
BRANCH="${1:-main}"   # 默认更新 main 分支

echo "============================================="
echo "  风迹集一键更新"
echo "============================================="
echo "项目目录:$APP_DIR"
echo "更新分支:$BRANCH"
echo ""

cd "$APP_DIR"

# 1. 拉取最新代码
echo "▶ 1/4 拉取最新代码..."
sudo -u "$APP_USER" git fetch origin
sudo -u "$APP_USER" git pull origin "$BRANCH"

# 2. 检查是否有 schema 变更
HAS_MIGRATION=false
if [ -d "backend/prisma/migrations" ]; then
    # 检查是否有未应用的 migration
    PENDING=$(sudo -u "$APP_USER" npx prisma migrate status 2>&1 | grep -c "Following migration" || true)
    if [ "$PENDING" -gt 0 ]; then
        HAS_MIGRATION=true
    fi
fi

# 3. 根据情况执行
if [ "$HAS_MIGRATION" = true ]; then
    echo "▶ 2/4 检测到数据库 migration,先应用..."
    cd backend
    sudo -u "$APP_USER" npx prisma migrate deploy
    sudo -u "$APP_USER" npx prisma generate
    cd ..
fi

# 4. 重新构建前端
echo "▶ 3/4 构建前端..."
cd frontend
sudo -u "$APP_USER" npm install --production   # 防止依赖没装
sudo -u "$APP_USER" npm run build
cd ..

# 5. 重启后端
echo "▶ 4/4 重启 PM2 服务..."
sudo -u "$APP_USER" pm2 restart fengjiji-api

echo ""
echo "============================================="
echo "  ✅ 更新完成"
echo "============================================="
echo ""
echo "查看日志:sudo -u $APP_USER pm2 logs fengjiji-api"
echo "查看状态:sudo -u $APP_USER pm2 list"