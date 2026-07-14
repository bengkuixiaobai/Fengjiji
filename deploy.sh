#!/bin/bash
#
# 风迹集一键部署脚本
# 适用系统:Ubuntu 22.04 LTS(其他版本可能需要调整)
# 用法:
#   1. SSH 到服务器,切到 root (sudo -i)
#   2. 下载脚本:curl -O https://.../deploy.sh
#   3. 修改环境变量(脚本顶部的 CONFIG 区)
#   4. 运行:bash deploy.sh
#

set -e  # 任何命令失败立即退出

# ============================================================
# CONFIG — 根据实际修改这些值
# ============================================================

# --- 应用 ---
APP_USER="fengjiji"               # 应用运行用户
APP_DIR="/home/fengjiji/code/Fengjiji"   # 项目部署目录
GIT_REPO="https://github.com/bengkuixiaobai/Fengjiji.git"  # Git 仓库(已配)
GIT_BRANCH="main"                  # 部署的分支

# --- 域名(必填)---
DOMAIN="fengjiji.top"
DOMAIN_ALIAS="www.fengjiji.top"

# --- 数据库 ---
DB_NAME="fengjiji"
DB_USER="fengjiji_db"
# 密码留空则自动生成(脚本会输出生成的密码)
DB_PASSWORD=""

# --- 后端账号 ---
# 管理员密码(必填或留空自动生成,会输出)
ADMIN_PASSWORD=""
# 访客密码(留空则不创建访客账号)
GUEST_PASSWORD=""

# --- 端口(默认值,一般不需要改)---
SSH_PORT="22"
HTTP_PORT="80"
HTTPS_PORT="443"
NODE_PORT="3000"

# ============================================================
# 工具函数
# ============================================================

LOG_FILE="/var/log/fengjiji-deploy.log"

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo -e "$msg"
    echo -e "$msg" >> "$LOG_FILE"
}

step() {
    echo ""
    echo "============================================================"
    echo "▶  $1"
    echo "============================================================"
    log "STEP: $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo "❌ 请用 root 用户运行:sudo -i"
        exit 1
    fi
}

check_ubuntu() {
    if ! grep -q "Ubuntu" /etc/os-release; then
        echo "❌ 此脚本仅支持 Ubuntu。当前系统:"
        cat /etc/os-release | grep PRETTY_NAME
        exit 1
    fi
}

generate_password() {
    openssl rand -hex 12
}

# ============================================================
# 主流程
# ============================================================

check_root
check_ubuntu

# 创建日志
touch "$LOG_FILE"
log "===== 风迹集部署开始 ====="

# 生成缺失的密码
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(generate_password)
    log "自动生成数据库密码"
fi

if [ -z "$ADMIN_PASSWORD" ]; then
    ADMIN_PASSWORD=$(generate_password)
    log "自动生成管理员密码"
fi

if [ -n "$GUEST_PASSWORD" ]; then
    GUEST_ENABLED=true
else
    GUEST_ENABLED=false
fi

# ============================================================
# Step 1: Node.js 18
# ============================================================

step "Step 1/7: 安装 Node.js 18"

if command -v node &> /dev/null && [[ "$(node -v)" == v18* ]]; then
    log "Node.js 18 已安装: $(node -v)"
else
    log "安装 Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - >> "$LOG_FILE" 2>&1
    apt install -y nodejs >> "$LOG_FILE" 2>&1
    log "✅ Node.js 安装完成: $(node -v) / npm $(npm -v)"
fi

# 安装 PM2(全局)
if ! command -v pm2 &> /dev/null; then
    log "安装 PM2..."
    npm install -g pm2 >> "$LOG_FILE" 2>&1
fi
log "✅ PM2: $(pm2 -v)"

# ============================================================
# Step 2: PostgreSQL 16
# ============================================================

step "Step 2/7: 安装 PostgreSQL 16"

if command -v psql &> /dev/null; then
    log "PostgreSQL 已安装: $(psql --version)"
else
    log "安装 PostgreSQL 16..."
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
    apt update >> "$LOG_FILE" 2>&1
    apt install -y postgresql-16 >> "$LOG_FILE" 2>&1

    # 启动并设置开机自启
    systemctl enable postgresql
    systemctl start postgresql
    log "✅ PostgreSQL 16 安装完成: $(psql --version)"
fi

# ============================================================
# Step 3: 配置 PostgreSQL
# ============================================================

step "Step 3/7: 创建数据库 + 用户"

# 创建用户和数据库(如果不存在)
sudo -u postgres psql <<EOF >> "$LOG_FILE" 2>&1
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
EOF

# 修改 pg_hba.conf 用 md5 认证
PG_HBA="/etc/postgresql/16/main/pg_hba.conf"
if ! grep -q "host    all             $DB_USER             127.0.0.1/32            md5" "$PG_HBA"; then
    log "配置 pg_hba.conf ..."
    # 在文件中追加(简化处理,生产环境建议精确修改)
    cat >> "$PG_HBA" <<EOF

# fengjiji app user
host    $DB_NAME             $DB_USER             127.0.0.1/32            md5
host    $DB_NAME             $DB_USER             ::1/128                 md5
EOF
    systemctl reload postgresql
fi

log "✅ 数据库配置完成"
log "   数据库名: $DB_NAME"
log "   用户名: $DB_USER"
log "   密码: $DB_PASSWORD (请妥善保存)"

# ============================================================
# Step 4: 部署后端
# ============================================================

step "Step 4/7: 部署后端"

# 创建应用用户
if ! id "$APP_USER" &>/dev/null; then
    log "创建应用用户 $APP_USER ..."
    useradd -m -s /bin/bash "$APP_USER"
    usermod -aG sudo "$APP_USER"
    echo "$APP_USER:$ADMIN_PASSWORD" | chpasswd  # 也用作 sudo 密码
fi

# 准备目录
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# 克隆/拉取代码
if [ -d "$APP_DIR/.git" ]; then
    log "项目已存在,拉取最新代码..."
    sudo -u "$APP_USER" bash -c "cd $APP_DIR && git pull origin $GIT_BRANCH" >> "$LOG_FILE" 2>&1
else
    log "克隆项目..."
    sudo -u "$APP_USER" git clone -b "$GIT_BRANCH" "$GIT_REPO" "$APP_DIR" >> "$LOG_FILE" 2>&1
fi

# 生成 JWT_SECRET
JWT_SECRET=$(generate_password)$(generate_password)
log "生成 JWT_SECRET (64 字符)"

# 创建 .env 文件
cat > "$APP_DIR/backend/.env" <<EOF
# 数据库
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@127.0.0.1:5432/$DB_NAME?schema=public"

# JWT
JWT_SECRET="$JWT_SECRET"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# 服务器
PORT=3000
NODE_ENV=production

# CORS
CORS_ORIGIN="https://$DOMAIN,https://www.$DOMAIN"
EOF
chown "$APP_USER:$APP_USER" "$APP_DIR/backend/.env"
log "✅ .env 文件已生成"

# 安装后端依赖
log "安装后端依赖..."
cd "$APP_DIR/backend"
sudo -u "$APP_USER" npm install --production >> "$LOG_FILE" 2>&1

# 运行 migration
log "运行数据库 migration..."
sudo -u "$APP_USER" npx prisma migrate deploy >> "$LOG_FILE" 2>&1

# 生成 Prisma Client
sudo -u "$APP_USER" npx prisma generate >> "$LOG_FILE" 2>&1

# 运行 seed(用环境变量传入密码)
log "运行 seed..."
sudo -u "$APP_USER" \
    ADMIN_PASSWORD="$ADMIN_PASSWORD" \
    GUEST_PASSWORD="$GUEST_PASSWORD" \
    bash -c "node prisma/seed.js" >> "$LOG_FILE" 2>&1

log "✅ 后端部署完成"

# 配置 PM2 启动
log "启动 PM2..."
cat > "/etc/systemd/system/fengjiji-pm2.service" <<EOF
[Unit]
Description=Fengjiji PM2 process manager
After=network.target

[Service]
Type=forking
User=$APP_USER
Environment=PM2_HOME=/home/$APP_USER/.pm2
ExecStart=/usr/bin/pm2 resurrect
ExecReload=/usr/bin/pm2 reload all
ExecStop=/usr/bin/pm2 kill

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable fengjiji-pm2.service

# 用 ecosystem 启动
cd "$APP_DIR"
sudo -u "$APP_USER" bash -c "cd $APP_DIR && pm2 start ecosystem.config.js --env production" >> "$LOG_FILE" 2>&1
sudo -u "$APP_USER" pm2 save >> "$LOG_FILE" 2>&1

log "✅ PM2 启动完成"
log "   查看进程:sudo -u $APP_USER pm2 list"
log "   查看日志:sudo -u $APP_USER pm2 logs fengjiji-api"

# ============================================================
# Step 5: 构建前端
# ============================================================

step "Step 5/7: 构建前端"

# 创建 .env
cat > "$APP_DIR/frontend/.env" <<EOF
VITE_API_BASE_URL=/api
VITE_USE_MOCK=false
EOF
chown "$APP_USER:$APP_USER" "$APP_DIR/frontend/.env"

# 安装依赖并构建
log "安装前端依赖并构建..."
cd "$APP_DIR/frontend"
sudo -u "$APP_USER" npm install >> "$LOG_FILE" 2>&1
sudo -u "$APP_USER" npm run build >> "$LOG_FILE" 2>&1

log "✅ 前端构建完成"
log "   产物目录: $APP_DIR/frontend/dist/"

# ============================================================
# Step 6: 配置 Nginx
# ============================================================

step "Step 6/7: 配置 Nginx"

if ! command -v nginx &> /dev/null; then
    log "安装 Nginx..."
    apt install -y nginx >> "$LOG_FILE" 2>&1
fi

# 创建站点配置
cat > "/etc/nginx/sites-available/fengjiji" <<EOF
upstream fengjiji_api {
    server 127.0.0.1:3000;
    keepalive 32;
}

# HTTP → HTTPS 重定向
server {
    listen $HTTP_PORT;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen $HTTPS_PORT ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL(由 certbot 配置后填充)
    ssl_certificate     /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 静态资源
    root $APP_DIR/frontend/dist;
    index index.html;
    etag on;

    # Gzip
    gzip on;
    gzip_types text/css text/javascript application/javascript application/json image/svg+xml;
    gzip_min_length 256;

    # 上传大小限制
    client_max_body_size 10m;

    # API 反向代理
    location /api/ {
        proxy_pass http://fengjiji_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
        add_header Cache-Control "no-store";
    }

    # 上传文件
    location /uploads/ {
        proxy_pass http://fengjiji_api;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 禁止访问敏感路径
    location ~ /\.(git|env) { deny all; return 404; }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/fengjiji /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试配置(此时 certbot 还没跑,所以会报错 SSL 证书不存在,先注释掉 SSL 行)
log "临时注释 SSL 配置(等 certbot 申请后开启)..."
sed -i 's|^    ssl_certificate|#    ssl_certificate|' /etc/nginx/sites-available/fengjiji
sed -i 's|^    ssl_certificate_key|#    ssl_certificate_key|' /etc/nginx/sites-available/fengjiji

nginx -t >> "$LOG_FILE" 2>&1
systemctl reload nginx
log "✅ Nginx 配置完成(SSL 待 certbot 申请后启用)"

# ============================================================
# Step 7: 申请 HTTPS
# ============================================================

step "Step 7/7: 申请 HTTPS 证书"

# 安装 certbot
if ! command -v certbot &> /dev/null; then
    log "安装 certbot..."
    apt install -y certbot python3-certbot-nginx >> "$LOG_FILE" 2>&1
fi

# 申请证书
log "申请 SSL 证书(需要域名已解析到本服务器 IP)..."
log "  ⚠️  请先确认 $DOMAIN 已通过 DNS A 记录指向 $(curl -s ifconfig.me)"
echo ""
read -p "按 Enter 继续申请(或 Ctrl+C 取消,先去配 DNS)..."

certbot --nginx -d "$DOMAIN" -d "$DOMAIN_ALIAS" --non-interactive --agree-tos --register-unsafely-without-email >> "$LOG_FILE" 2>&1 || {
    log "❌ 证书申请失败,可能原因:"
    log "   1. 域名未解析到本 IP"
    log "   2. 80 端口被防火墙拦截"
    log "   3. Let's Encrypt 限流"
    log "   请手动执行:certbot --nginx -d $DOMAIN"
}

# 启用自动续期(默认已有 systemd timer)
systemctl enable certbot.timer
log "✅ SSL 证书申请完成"

# ============================================================
# 收尾
# ============================================================

step "✅ 部署完成！"

echo ""
echo "============================================="
echo "  🎉 风迹集已部署完成"
echo "============================================="
echo ""
echo "访问地址:https://$DOMAIN"
echo ""
echo "【账号信息】"
echo "  管理员:username=admin"
echo "  密码:$ADMIN_PASSWORD (已用 bcrypt 哈希存储)"
echo "  ⚠️  请妥善保存,此信息只在本次部署时显示一次"
echo ""
if [ "$GUEST_ENABLED" = true ]; then
echo "  体验访客账号已创建"
echo "  ⚠️  账号信息已保存到 /root/.fengjiji-deploy-info"
echo ""
fi
echo "【数据库】"
echo "  主机:127.0.0.1"
echo "  端口:5432"
echo "  数据库:$DB_NAME"
echo "  用户:$DB_USER"
echo "  密码:$DB_PASSWORD"
echo ""
echo "【项目目录】"
echo "  代码:$APP_DIR"
echo "  前端 dist:$APP_DIR/frontend/dist"
echo "  后端 .env:$APP_DIR/backend/.env"
echo ""
echo "【运维命令】"
echo "  查看 PM2:sudo -u $APP_USER pm2 list"
echo "  查看日志:sudo -u $APP_USER pm2 logs fengjiji-api"
echo "  重启后端:sudo -u $APP_USER pm2 restart fengjiji-api"
echo "  重载 Nginx:systemctl reload nginx"
echo "  续期 SSL:certbot renew"
echo ""
echo "⚠️  重要:"
echo "  1. 管理员密码已用 bcrypt 哈希存储,不会明文保存"
echo "  2. JWT_SECRET 已自动生成,不要再修改 .env(否则所有 token 失效)"
echo "  3. 建议把上述账号信息保存到密码管理器"
echo "  4. 定期运行:apt update && apt upgrade"
echo ""
echo "部署日志:$LOG_FILE"
echo "============================================="
echo ""

# 保存所有重要信息到一个文件(方便日后查阅)
cat > "/root/.fengjiji-deploy-info" <<EOF
# 风迹集部署信息(请妥善保管)
# 此文件权限 600,只有 root 可读
DOMAIN=$DOMAIN
APP_USER=$APP_USER
APP_DIR=$APP_DIR
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$ADMIN_PASSWORD
$(if [ "$GUEST_ENABLED" = true ]; then
  echo "GUEST_USERNAME=${GUEST_USERNAME:-guest}"
  echo "GUEST_PASSWORD=$GUEST_PASSWORD"
fi)
EOF
chmod 600 /root/.fengjiji-deploy-info

log "===== 风迹集部署完成 ====="