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
    # 检测系统版本决定装哪版 PG
    DISTRO=$(lsb_release -cs 2>/dev/null || grep VERSION_CODENAME /etc/os-release | cut -d'=' -f2)
    if [ "$DISTRO" = "focal" ] || [ "$DISTRO" = "jammy" ]; then
        # Ubuntu 20.04/22.04 默认源里有 PG(12/14)
        apt install -y postgresql
    else
        # 其他系统:用 PGDG 源
        apt-get install -y wget gnupg
        sh -c "echo 'deb http://apt.postgresql.org/pub/repos/apt ${DISTRO}-pgdg main' > /etc/apt/sources.list.d/pgdg.list"
        wget --quiet -O /usr/share/keyrings/pgdg.asc https://www.postgresql.org/media/keys/ACCC4CF8.asc
        sed -i "s|^deb |deb [signed-by=/usr/share/keyrings/pgdg.asc] |" /etc/apt/sources.list.d/pgdg.list
        apt update
        apt install -y postgresql-16
    fi
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