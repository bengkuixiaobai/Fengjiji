#!/bin/bash
# 风迹集服务器初始化 — 安装 Node.js 18 + PostgreSQL 16 + PM2 + Nginx
# 适用:Ubuntu 22.04 / Debian 12
# 用法:sudo bash install-stack.sh

set -e

echo "===== 开始安装风迹集依赖 ====="

# 1. Node.js 18 LTS
echo ""
echo "▶ 1/5 Node.js 18..."
if command -v node &> /dev/null && [[ "$(node -v)" == v18* ]]; then
    echo "✓ 已安装: $(node -v)"
else
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    echo "✓ 安装完成: $(node -v)"
fi

# 2. PM2
echo ""
echo "▶ 2/5 PM2..."
if command -v pm2 &> /dev/null; then
    echo "✓ 已安装: $(pm2 -v)"
else
    npm install -g pm2
    echo "✓ 安装完成: $(pm2 -v)"
fi

# 3. PostgreSQL 16
echo ""
echo "▶ 3/5 PostgreSQL 16..."
if command -v psql &> /dev/null; then
    echo "✓ 已安装: $(psql --version)"
else
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
    apt update
    apt install -y postgresql-16
    systemctl enable postgresql
    systemctl start postgresql
    echo "✓ 安装完成: $(psql --version)"
fi

# 4. Nginx
echo ""
echo "▶ 4/5 Nginx..."
if command -v nginx &> /dev/null; then
    echo "✓ 已安装"
else
    apt install -y nginx
    systemctl enable nginx
    echo "✓ 安装完成"
fi

# 5. certbot
echo ""
echo "▶ 5/5 Certbot..."
if command -v certbot &> /dev/null; then
    echo "✓ 已安装"
else
    apt install -y certbot python3-certbot-nginx
    echo "✓ 安装完成"
fi

echo ""
echo "===== 全部依赖安装完成 ====="
echo ""
echo "下一步:"
echo "1. 上传 deploy.sh 到 /root/"
echo "2. 修改 deploy.sh 顶部的 CONFIG(域名、Git 仓库等)"
echo "3. bash /root/deploy.sh"