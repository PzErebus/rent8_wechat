# rent8 管理后台系统

## 项目简介

rent8 管理后台是一个基于 PHP + MySQL + Vue3 + Element Plus 构建的用户收费管理系统，用于管理出租屋小程序的用户、订单和系统设置。

## 技术栈

- **后端**: PHP 7.4+ + MySQL 5.7+
- **前端**: Vue 3 + Element Plus + ECharts
- **UI框架**: Element Plus (CDN引入)

## 功能特性

### 用户管理
- ✅ 用户列表管理（试用/正式用户分类）
- ✅ 用户增删改查
- ✅ 用户续费功能
- ✅ 有效期进度显示
- ✅ 即将到期用户提醒

### 订单管理
- ✅ 订单列表和筛选
- ✅ 订单退款功能
- ✅ 收入统计

### 数据统计
- ✅ 收入趋势图表
- ✅ 用户类型分布
- ✅ 实时数据统计

### 系统设置
- ✅ 基础设置（系统名称、客服电话等）
- ✅ 通知设置
- ✅ 试用/正式用户配置

### 安全功能
- ✅ 管理员登录认证
- ✅ 操作日志记录
- ✅ 会话管理

## 安装部署

### 环境要求
- PHP >= 7.4
- MySQL >= 5.7
- Apache/Nginx

### 安装步骤

1. **克隆项目到服务器**
```bash
cd /var/www/html
mkdir rent8_admin
cd rent8_admin
```

2. **创建数据库**
```bash
mysql -u root -p
source database.sql
```

3. **配置数据库连接**
编辑 `config.php`:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'rent8_admin');
define('DB_USER', 'root');
define('DB_PASS', '你的密码');
```

4. **配置Web服务器**

**Apache (.htaccess)**:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
```

**Nginx**:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html/rent8_admin;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

5. **访问系统**
- 后台地址: `http://your-domain.com/login.php`
- 默认账号: `admin`
- 默认密码: `password`

## 项目结构

```
webadmin/
├── api/                    # API接口目录
│   ├── users.php          # 用户管理API
│   ├── orders.php         # 订单管理API
│   ├── dashboard.php      # 仪表盘统计API
│   └── settings.php       # 系统设置API
├── config.php             # 配置文件（数据库连接、公共函数）
├── database.sql           # 数据库结构
├── login.php              # 登录页面
├── index.php              # 管理后台主页面
├── logout.php             # 退出登录
└── README.md              # 项目说明
```

## 数据库结构

### 管理员表 (admins)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| username | VARCHAR(50) | 用户名 |
| password | VARCHAR(255) | 密码（bcrypt加密） |
| nickname | VARCHAR(50) | 昵称 |
| role | ENUM | 角色：super/admin |
| status | TINYINT | 状态：0禁用 1启用 |

### 用户表 (users)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| openid | VARCHAR(100) | 微信openid |
| nickname | VARCHAR(100) | 昵称 |
| phone | VARCHAR(20) | 手机号 |
| user_type | ENUM | 类型：trial试用/formal正式 |
| status | ENUM | 状态：active/expired/disabled |
| trial_start_date | DATE | 试用开始日期 |
| trial_end_date | DATE | 试用结束日期 |
| formal_start_date | DATE | 正式用户开始日期 |
| formal_end_date | DATE | 正式用户结束日期 |

### 订单表 (orders)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| order_no | VARCHAR(50) | 订单号 |
| user_id | INT | 用户ID |
| package_type | ENUM | 套餐类型：trial/formal |
| duration | INT | 时长（月） |
| amount | DECIMAL(10,2) | 金额 |
| pay_method | ENUM | 支付方式 |
| pay_status | ENUM | 支付状态 |

### 系统设置表 (settings)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| setting_key | VARCHAR(50) | 设置键 |
| setting_value | TEXT | 设置值 |
| description | VARCHAR(255) | 描述 |

### 操作日志表 (operation_logs)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| admin_id | INT | 管理员ID |
| action | VARCHAR(50) | 操作类型 |
| target_type | VARCHAR(50) | 操作对象类型 |
| target_id | INT | 操作对象ID |
| content | TEXT | 操作内容 |
| ip | VARCHAR(50) | IP地址 |
| create_time | DATETIME | 创建时间 |

## API接口文档

### 用户管理 API

#### 获取用户列表
```
GET /api/users.php?action=list&page=1&pageSize=10&keyword=&userType=&status=
```

**参数**:
- `page`: 页码，默认1
- `pageSize`: 每页数量，默认10
- `keyword`: 搜索关键词（昵称/手机号）
- `userType`: 用户类型（trial/formal）
- `status`: 状态（active/expired/disabled）

**响应**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "list": [...],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

#### 创建用户
```
POST /api/users.php?action=create
```

**请求体**:
```json
{
  "nickname": "张三",
  "phone": "13800138000",
  "userType": "trial",
  "status": "active",
  "remark": ""
}
```

#### 更新用户
```
POST /api/users.php?action=update
```

**请求体**:
```json
{
  "id": 1,
  "nickname": "张三",
  "phone": "13800138000",
  "userType": "formal",
  "status": "active",
  "remark": "VIP客户"
}
```

#### 删除用户
```
DELETE /api/users.php?id=1
```

#### 用户续费
```
POST /api/users.php?action=renew
```

**请求体**:
```json
{
  "id": 1,
  "duration": 12,
  "amount": 99,
  "payMethod": "wechat"
}
```

### 订单管理 API

#### 获取订单列表
```
GET /api/orders.php?action=list&page=1&pageSize=10&status=&startDate=&endDate=
```

#### 订单退款
```
POST /api/orders.php?action=refund
```

**请求体**:
```json
{
  "id": 1,
  "reason": "用户申请退款"
}
```

### 仪表盘 API

#### 获取概览数据
```
GET /api/dashboard.php?action=overview
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "totalUsers": 128,
    "trialUsers": 42,
    "formalUsers": 86,
    "monthIncome": 12580,
    "expiringUsers": 5,
    "todayNewUsers": 3,
    "todayIncome": 299
  }
}
```

#### 获取收入趋势
```
GET /api/dashboard.php?action=incomeTrend&period=week
```

**参数**:
- `period`: 周期（week/month/year）

### 系统设置 API

#### 获取所有设置
```
GET /api/settings.php
```

#### 更新设置
```
POST /api/settings.php
```

**请求体**:
```json
{
  "system_name": "rent8 管理系统",
  "trial_days": 7,
  "formal_price": 99
}
```

## 安全说明

1. **密码加密**: 使用 bcrypt 算法加密存储
2. **SQL注入防护**: 使用 PDO 预处理语句
3. **XSS防护**: 使用 htmlspecialchars 转义输出
4. **CSRF防护**: 建议生产环境添加 CSRF Token
5. **会话安全**: 使用自定义会话名称，定期过期

## 开发计划

- [ ] 用户详情页面
- [ ] 操作日志查看
- [ ] 数据备份功能
- [ ] 批量导入用户
- [ ] 邮件通知功能
- [ ] 多管理员权限管理

## 更新日志

### v1.0.0 (2024-03-22)
- ✅ 初始版本发布
- ✅ 用户管理功能
- ✅ 订单管理功能
- ✅ 数据统计功能
- ✅ 系统设置功能

## 联系方式

如有问题或建议，请联系：
- 邮箱: support@rent8.com
- 电话: 400-888-8888

## License

MIT License
