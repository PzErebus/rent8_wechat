# Rent8 出租屋管理系统

一套现代化的出租屋管理系统，包含微信小程序（房东使用）和管理后台（系统管理员使用）。

## 系统架构

### 技术栈

| 层级 | 技术 |
|------|------|
| 后端 API | NestJS + TypeScript + Prisma |
| 数据库 | PostgreSQL |
| 缓存 | Redis |
| 管理后台 | Nuxt 3 + Vue 3 + Element Plus |
| 小程序 | 微信小程序原生框架 |
| 部署 | Docker + Docker Compose |

## 项目结构

```
rent8_wechat/
├── xiaochengxu/          # 微信小程序（房东端）
│   ├── pages/            # 页面
│   ├── components/       # 组件
│   ├── utils/            # 工具函数
│   └── app.js            # 小程序入口
├── webadmin/             # 管理后台
│   ├── backend/          # NestJS 后端 API
│   │   ├── src/          # 源代码
│   │   ├── prisma/       # 数据库模型
│   │   └── Dockerfile
│   ├── admin/            # Nuxt 3 管理后台前端
│   │   ├── pages/        # 页面
│   │   ├── composables/  # 组合式函数
│   │   └── Dockerfile
│   └── nginx/            # Nginx 配置
│       └── nginx.conf
├── docker-compose.yml    # Docker 编排
├── .gitignore           # Git 忽略文件
└── README.md            # 项目文档
```

## 快速开始

### 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 20+ (开发环境)

### 使用 Docker 部署

1. 克隆项目
```bash
git clone https://github.com/PzErebus/rent8_wechat.git
cd rent8_wechat
```

2. 配置环境变量
```bash
# 复制环境变量模板
cp webadmin/backend/.env.example webadmin/backend/.env

# 编辑 .env 文件，配置以下参数：
# - WECHAT_APPID: 微信小程序 AppID
# - WECHAT_SECRET: 微信小程序 AppSecret
# - JWT_SECRET: JWT 密钥（生产环境请修改）
```

3. 启动服务
```bash
docker-compose up -d
```

4. 初始化数据库
```bash
# 执行数据库迁移
docker-compose exec backend npx prisma migrate dev

# 生成 Prisma 客户端
docker-compose exec backend npx prisma generate
```

5. 访问系统
- 管理后台: http://localhost
- API 文档: http://localhost/api/docs
- 默认管理员账号: admin / Rent8@Admin2024!

### 开发环境

#### 后端开发

```bash
cd webadmin/backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 启动开发服务器
npm run start:dev
```

#### 管理后台开发

```bash
cd webadmin/admin

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

#### 小程序开发

使用微信开发者工具打开 `xiaochengxu` 文件夹。

## 功能特性

### 管理后台

- 📊 数据概览仪表盘
- 👥 用户管理（试用/正式用户）
- 💰 订单管理
- 📝 操作日志
- ⚙️ 系统设置

### 小程序（房东端）

- 🏠 房间管理
- 👤 租客管理
- 💵 账单管理
- 📈 数据统计
- 👤 个人中心

## API 文档

启动服务后访问: http://localhost/api/docs

## 系统架构图

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   微信小程序    │────▶│   Nginx 代理    │────▶│  NestJS 后端    │
│  (xiaochengxu)  │     │  (webadmin/nginx)│    │(webadmin/backend)│
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                              ┌──────────────────────────┼──────────┐
                              │                          │          │
                              ▼                          ▼          ▼
                    ┌─────────────────┐        ┌─────────────────┐
                    │   PostgreSQL    │        │     Redis       │
                    │    (主数据库)   │        │    (缓存)       │
                    └─────────────────┘        └─────────────────┘
                                                         │
                              ┌──────────────────────────┘
                              ▼
                    ┌─────────────────┐
                    │  Nuxt 3 管理后台 │
                    │ (webadmin/admin)│
                    └─────────────────┘
```

## 安全说明

- 生产环境请务必修改默认密码和 JWT 密钥
- 建议使用 HTTPS 部署
- 定期备份数据库
- 启用防火墙限制端口访问

## 许可证

MIT License
