#!/bin/bash
# 服务器基础环境自检 — 部署前必跑

echo "===== 服务器环境自检 ====="
echo ""

# 系统
echo "【系统】"
echo "  主机名:$(hostname)"
echo "  系统:$(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "  内核:$(uname -r)"
echo "  当前用户:$(whoami)"
echo "  公网 IP:$(curl -s ifconfig.me 2>/dev/null || echo '无法获取')"
echo ""

# 时间
echo "【时间】"
echo "  当前时间:$(date)"
echo "  时区:$(timedatectl | grep 'Time zone' | awk '{print $3}')"
echo ""

# 资源
echo "【资源】"
free -h | grep -E "Mem|Swap" | sed 's/^/  /'
echo "  硬盘占用:"
df -h / | sed 's/^/    /'
echo ""

# 系统更新
echo "【系统更新】"
apt list --upgradable 2>/dev/null | wc -l | xargs -I {} echo "  待更新包数:{}"
echo ""

# 防火墙
echo "【防火墙 UFW】"
ufw status 2>&1 | grep -E "Status|22|80|443" | sed 's/^/  /' || echo "  UFW 未安装"
echo ""

# fail2ban
echo "【fail2ban】"
if command -v fail2ban-client &>/dev/null; then
    systemctl is-active fail2ban | xargs -I {} echo "  状态:{}"
    fail2ban-client status sshd 2>&1 | head -3 | sed 's/^/    /'
else
    echo "  未安装"
fi
echo ""

# 应用用户
echo "【应用用户】"
id fengjiji 2>&1 | sed 's/^/  /'
echo ""

# Node.js
echo "【Node.js】"
if command -v node &>/dev/null; then
    node -v | xargs -I {} echo "  Node:{}"
    npm -v | xargs -I {} echo "  npm:{}"
else
    echo "  未安装"
fi
echo ""

# PostgreSQL
echo "【PostgreSQL】"
if command -v psql &>/dev/null; then
    psql --version | sed 's/^/  /'
    systemctl status postgresql --no-pager 2>&1 | grep -E "Active|active" | head -1 | sed 's/^/  /'
else
    echo "  未安装"
fi
echo ""

# PM2
echo "【PM2】"
if command -v pm2 &>/dev/null; then
    pm2 -v | xargs -I {} echo "  版本:{}"
    pm2 list 2>&1 | sed 's/^/  /'
else
    echo "  未安装"
fi
echo ""

# Nginx
echo "【Nginx】"
if command -v nginx &>/dev/null; then
    nginx -v 2>&1 | sed 's/^/  /'
    nginx -t 2>&1 | tail -1 | sed 's/^/  /'
else
    echo "  未安装"
fi
echo ""

echo "===== 自检完成 ====="
echo ""
echo "告诉我结果,我帮你判断下一步该做什么"