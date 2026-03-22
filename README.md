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
├── backend/              # NestJS 后端 API
│   ├── src/
│   │   ├── modules/      # 业务模块
│   │   ├── prisma/       # Prisma ORM
│   │   └── main.ts       # 入口文件
│   ├── prisma/
│   │   └── schema.prisma # 数据库模型
│   └── Dockerfile
├── admin/                # Nuxt 3 管理后台
│   ├── pages/            # 页面
│   ├── composables/      # 组合式函数
│   └── Dockerfile
├── miniprogram/          # 微信小程序
│   ├── pages/            # 页面
│   └── app.js            # 小程序入口
├── nginx/                # Nginx 配置
│   └── nginx.conf
└── docker-compose.yml    # Docker 编排
```

## 快速开始

### 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 20+ (开发环境)

### 使用 Docker 部署

1. 克隆项目
```bash
git clone <your-repo>
cd rent8_wechat
```

2. 配置环境变量
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

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
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 启动开发服务器
npm run start:dev
```

#### 管理后台开发

```bash
cd admin

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

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
│   (房东使用)    │     │                 │     │                 │
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
                    │ (系统管理员使用) │
                    └─────────────────┘
```

## 安全说明

- 生产环境请务必修改默认密码和 JWT 密钥
- 建议使用 HTTPS 部署
- 定期备份数据库
- 启用防火墙限制端口访问

## 许可证

MIT License
