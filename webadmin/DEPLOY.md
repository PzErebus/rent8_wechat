# rent8 管理后台 - 部署指南

## 📋 部署方案概览

### 方案一：单服务器部署（推荐初期使用）
- **服务器数量**：1台
- **适用场景**：用户量 < 1000，日访问量 < 1万
- **成本**：约 50-100元/月

### 方案二：分离部署（推荐正式运营）
- **服务器数量**：2台
- **适用场景**：用户量 > 1000，需要高可用
- **成本**：约 100-200元/月

---

## 🖥️ 环境要求

### 基础环境
| 组件 | 最低版本 | 推荐版本 | 说明 |
|------|---------|---------|------|
| PHP | 7.4 | 8.0+ | 运行环境 |
| MySQL | 5.7 | 8.0 | 数据库 |
| Nginx | 1.18 | 1.24+ | Web服务器 |
| Redis | 可选 | 7.0+ | 缓存（可选）|

### 服务器配置
| 配置项 | 最低配置 | 推荐配置 |
|--------|---------|---------|
| CPU | 1核 | 2核 |
| 内存 | 1GB | 2GB |
| 硬盘 | 20GB SSD | 50GB SSD |
| 带宽 | 1Mbps | 3Mbps |

---

## 🚀 方案一：单服务器部署（宝塔面板）

### 步骤1：购买服务器
推荐云服务商：
- 阿里云（ECS）
- 腾讯云（CVM）
- 华为云

选择 **CentOS 7.9** 或 **Ubuntu 20.04** 系统

### 步骤2：安装宝塔面板
```bash
# CentOS
yum install -y wget && wget -O install.sh http://download.bt.cn/install/install_6.0.sh && sh install.sh

# Ubuntu
wget -O install.sh http://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh
```

### 步骤3：宝塔面板配置

1. **安装LNMP环境**
   - 登录宝塔面板
   - 点击"软件商店"
   - 安装：Nginx 1.24、MySQL 8.0、PHP 8.0
   - 安装PHP扩展：pdo、pdo_mysql、mbstring、gd

2. **创建网站**
   - 点击"网站" -> "添加站点"
   - 域名：填写你的域名或服务器IP
   - 根目录：`/www/wwwroot/rent8_admin`
   - PHP版本：PHP-8.0

3. **创建数据库**
   - 点击"数据库" -> "添加数据库"
   - 数据库名：`rent8_admin`
   - 用户名：`rent8_user`
   - 密码：生成强密码

### 步骤4：上传代码
```bash
# 方式1：使用宝塔面板文件管理器上传
# 方式2：使用Git克隆
cd /www/wwwroot/rent8_admin
git clone https://your-repo.git .

# 方式3：使用SFTP上传
# 使用FileZilla等工具连接到服务器，上传webadmin文件夹
```

### 步骤5：配置项目
1. **修改数据库配置**
   ```bash
   cd /www/wwwroot/rent8_admin
   cp config.php config.php.backup
   vim config.php
   ```

   修改以下内容：
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'rent8_admin');
   define('DB_USER', 'rent8_user');
   define('DB_PASS', '你的数据库密码');
   ```

2. **导入数据库**
   ```bash
   mysql -u rent8_user -p rent8_admin < database.sql
   ```

3. **设置目录权限**
   ```bash
   chmod -R 755 /www/wwwroot/rent8_admin
   chmod -R 777 /www/wwwroot/rent8_admin/backups
   ```

### 步骤6：配置Nginx
在宝塔面板中，点击网站 -> 设置 -> 配置文件，添加：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /www/wwwroot/rent8_admin;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/tmp/php-cgi-80.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

### 步骤7：配置SSL（HTTPS）
1. 宝塔面板 -> 网站 -> 设置 -> SSL
2. 选择"Let's Encrypt"免费证书
3. 开启强制HTTPS

---

## 🐳 方案二：Docker部署（推荐开发使用）

### 步骤1：安装Docker
```bash
# CentOS
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# Ubuntu
sudo apt update
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
```

### 步骤2：创建Docker Compose配置
创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  # MySQL数据库
  mysql:
    image: mysql:8.0
    container_name: rent8_mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: your_root_password
      MYSQL_DATABASE: rent8_admin
      MYSQL_USER: rent8_user
      MYSQL_PASSWORD: your_user_password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "3306:3306"
    networks:
      - rent8_network

  # PHP应用
  php:
    image: php:8.0-fpm
    container_name: rent8_php
    restart: always
    volumes:
      - ./:/var/www/html
    working_dir: /var/www/html
    networks:
      - rent8_network
    depends_on:
      - mysql

  # Nginx
  nginx:
    image: nginx:alpine
    container_name: rent8_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./:/var/www/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
    networks:
      - rent8_network
    depends_on:
      - php

volumes:
  mysql_data:

networks:
  rent8_network:
    driver: bridge
```

### 步骤3：创建Nginx配置
创建 `nginx.conf` 文件：

```nginx
server {
    listen 80;
    server_name localhost;
    root /var/www/html;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass php:9000;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

### 步骤4：启动服务
```bash
# 构建并启动
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

---

## ☁️ 方案三：云原生部署（阿里云/腾讯云）

### 阿里云部署
1. **购买ECS服务器**
   - 推荐：2核2G，CentOS 7.9
   - 选择按量付费或包年包月

2. **配置安全组**
   - 开放端口：80、443、3306（可选）

3. **部署步骤**
   ```bash
   # 连接服务器
   ssh root@your-server-ip

   # 安装宝塔面板
   yum install -y wget && wget -O install.sh http://download.bt.cn/install/install_6.0.sh && sh install.sh

   # 后续步骤同方案一
   ```

### 腾讯云部署
类似阿里云，使用腾讯云CVM服务器

---

## 🔒 安全配置

### 1. 修改默认密码
首次登录后立即修改：
- 后台默认密码：`Rent8@Admin2024!`
- 数据库root密码

### 2. 配置防火墙
```bash
# 开放必要端口
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload

# 关闭不必要的端口
firewall-cmd --permanent --remove-port=3306/tcp  # 如果不需要远程访问MySQL
```

### 3. 定期备份
```bash
# 创建备份脚本
vim /backup/backup.sh

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p'your_password' rent8_admin > /backup/rent8_admin_$DATE.sql

# 添加定时任务
crontab -e
0 2 * * * /backup/backup.sh  # 每天凌晨2点备份
```

### 4. 配置HTTPS
使用Let's Encrypt免费证书：
```bash
# 安装Certbot
yum install -y certbot python3-certbot-nginx

# 申请证书
certbot --nginx -d your-domain.com

# 自动续期
certbot renew --dry-run
```

---

## 📊 监控与维护

### 1. 安装监控（可选）
```bash
# 安装Prometheus + Grafana
# 或使用宝塔面板的监控插件
```

### 2. 日志管理
```bash
# 定期清理日志
echo "0 0 * * 0 rm -f /www/wwwroot/rent8_admin/backups/*.sql" | crontab
```

### 3. 性能优化
- 开启PHP OPcache
- 配置MySQL慢查询日志
- 使用Redis缓存（可选）

---

## 💰 成本估算

| 方案 | 配置 | 月费用 | 适用场景 |
|------|------|--------|---------|
| 入门版 | 1核1G + 20G | 50元 | 测试/演示 |
| 基础版 | 2核2G + 50G | 100元 | 初期运营 |
| 标准版 | 2核4G + 100G | 200元 | 正式运营 |
| 高级版 | 4核8G + 200G | 500元 | 大规模用户 |

---

## 🆘 故障排查

### 无法访问网站
1. 检查安全组/防火墙是否开放80/443端口
2. 检查Nginx是否启动：`systemctl status nginx`
3. 检查PHP是否启动：`systemctl status php-fpm-80`

### 数据库连接失败
1. 检查MySQL是否启动：`systemctl status mysqld`
2. 检查config.php中的数据库配置
3. 检查数据库用户权限

### 500错误
1. 查看PHP错误日志：`/var/log/php-fpm/error.log`
2. 检查文件权限
3. 检查磁盘空间：`df -h`

---

## 📞 技术支持

如有部署问题，请检查：
1. 服务器环境是否满足要求
2. 配置文件是否正确
3. 查看错误日志获取详细信息
