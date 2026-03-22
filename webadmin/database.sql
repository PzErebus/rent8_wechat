-- rent8 管理后台数据库结构
-- 创建数据库
CREATE DATABASE IF NOT EXISTS rent8_admin DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE rent8_admin;

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    nickname VARCHAR(50) DEFAULT '' COMMENT '昵称',
    email VARCHAR(100) DEFAULT '' COMMENT '邮箱',
    phone VARCHAR(20) DEFAULT '' COMMENT '手机号',
    avatar VARCHAR(255) DEFAULT '' COMMENT '头像',
    role ENUM('super', 'admin') DEFAULT 'admin' COMMENT '角色',
    status TINYINT DEFAULT 1 COMMENT '状态：0禁用 1启用',
    last_login_time DATETIME DEFAULT NULL COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) DEFAULT '' COMMENT '最后登录IP',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- 用户表（小程序用户）
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    openid VARCHAR(100) NOT NULL UNIQUE COMMENT '微信openid',
    unionid VARCHAR(100) DEFAULT '' COMMENT '微信unionid',
    nickname VARCHAR(100) DEFAULT '' COMMENT '昵称',
    avatar VARCHAR(255) DEFAULT '' COMMENT '头像',
    phone VARCHAR(20) DEFAULT '' COMMENT '手机号',
    user_type ENUM('trial', 'formal') DEFAULT 'trial' COMMENT '用户类型：trial试用 formal正式',
    status ENUM('active', 'expired', 'disabled') DEFAULT 'active' COMMENT '状态',
    trial_start_date DATE DEFAULT NULL COMMENT '试用开始日期',
    trial_end_date DATE DEFAULT NULL COMMENT '试用结束日期',
    formal_start_date DATE DEFAULT NULL COMMENT '正式用户开始日期',
    formal_end_date DATE DEFAULT NULL COMMENT '正式用户结束日期',
    remark TEXT COMMENT '备注',
    room_count INT DEFAULT 0 COMMENT '房间数量',
    tenant_count INT DEFAULT 0 COMMENT '租客数量',
    login_count INT DEFAULT 0 COMMENT '登录次数',
    last_login_time DATETIME DEFAULT NULL COMMENT '最后登录时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_openid (openid),
    INDEX idx_user_type (user_type),
    INDEX idx_status (status),
    INDEX idx_phone (phone),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(50) NOT NULL UNIQUE COMMENT '订单号',
    user_id INT UNSIGNED NOT NULL COMMENT '用户ID',
    package_type ENUM('trial', 'formal') NOT NULL COMMENT '套餐类型',
    duration INT DEFAULT 12 COMMENT '时长（月）',
    amount DECIMAL(10, 2) NOT NULL COMMENT '金额',
    pay_method ENUM('wechat', 'alipay', 'bank', 'cash') DEFAULT 'wechat' COMMENT '支付方式',
    pay_status ENUM('pending', 'success', 'failed', 'refunded') DEFAULT 'pending' COMMENT '支付状态',
    pay_time DATETIME DEFAULT NULL COMMENT '支付时间',
    pay_trade_no VARCHAR(100) DEFAULT '' COMMENT '第三方支付流水号',
    remark TEXT COMMENT '备注',
    admin_id INT UNSIGNED DEFAULT 0 COMMENT '操作管理员ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_no (order_no),
    INDEX idx_user_id (user_id),
    INDEX idx_pay_status (pay_status),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- 系统设置表
CREATE TABLE IF NOT EXISTS settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) NOT NULL UNIQUE COMMENT '设置键',
    setting_value TEXT COMMENT '设置值',
    description VARCHAR(255) DEFAULT '' COMMENT '描述',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统设置表';

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id INT UNSIGNED DEFAULT 0 COMMENT '管理员ID',
    admin_name VARCHAR(50) DEFAULT '' COMMENT '管理员名称',
    action VARCHAR(50) NOT NULL COMMENT '操作类型',
    target_type VARCHAR(50) DEFAULT '' COMMENT '操作对象类型',
    target_id INT UNSIGNED DEFAULT 0 COMMENT '操作对象ID',
    content TEXT COMMENT '操作内容',
    ip VARCHAR(50) DEFAULT '' COMMENT 'IP地址',
    user_agent TEXT COMMENT '用户代理',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 插入默认管理员
-- 密码: Rent8@Admin2024!
INSERT INTO admins (username, password, nickname, role, status) VALUES
('admin', '$2y$10$N9qo8uLOickgx2ZMRZoMy.MqrqhmM6JGKpS4G3R1G2tH8JkF8Z2y', '超级管理员', 'super', 1);

-- 插入默认系统设置
INSERT INTO settings (setting_key, setting_value, description) VALUES
('system_name', 'rent8 出租屋管理系统', '系统名称'),
('service_phone', '400-888-8888', '客服电话'),
('trial_days', '7', '试用天数'),
('remind_days', '7', '到期提醒天数'),
('formal_price', '99', '正式用户年费'),
('notify_expire', '1', '到期提醒通知：0关闭 1开启'),
('notify_new_user', '1', '新用户注册通知：0关闭 1开启'),
('notify_payment', '1', '支付成功通知：0关闭 1开启'),
('notify_renew', '1', '用户续费通知：0关闭 1开启'),
('company_name', 'rent8科技', '公司名称'),
('icp', '', 'ICP备案号');

-- 插入测试用户数据
INSERT INTO users (openid, nickname, phone, user_type, status, trial_start_date, trial_end_date, formal_start_date, formal_end_date, remark) VALUES
('test_openid_1', '张小明', '13800138001', 'formal', 'active', NULL, NULL, '2024-01-15', '2025-06-30', 'VIP客户'),
('test_openid_2', '李房东', '13900139002', 'formal', 'active', NULL, NULL, '2024-02-20', '2025-12-31', '企业用户'),
('test_openid_3', '王阿姨', '13700137003', 'trial', 'active', '2025-03-20', '2025-03-27', NULL, NULL, ''),
('test_openid_4', '陈先生', '13600136004', 'trial', 'expired', '2025-03-15', '2025-03-22', NULL, NULL, '试用到期'),
('test_openid_5', '刘经理', '13500135005', 'formal', 'active', NULL, NULL, '2024-01-28', '2025-08-20', ''),
('test_openid_6', '赵女士', '13400134006', 'formal', 'disabled', NULL, NULL, '2024-02-15', '2025-05-10', '欠费停用'),
('test_openid_7', '孙老板', '13300133007', 'formal', 'active', NULL, NULL, '2023-12-01', '2026-01-01', '长期合作'),
('test_openid_8', '周房东', '13200132008', 'trial', 'active', '2025-03-18', '2025-03-25', NULL, NULL, '');

-- 插入测试订单数据
INSERT INTO orders (order_no, user_id, package_type, duration, amount, pay_method, pay_status, pay_time, remark) VALUES
('ORD20240320001', 1, 'formal', 12, 99.00, 'wechat', 'success', '2024-03-20 10:30:00', ''),
('ORD20240319002', 2, 'formal', 12, 299.00, 'alipay', 'success', '2024-03-19 15:20:00', ''),
('ORD20240318003', 3, 'trial', 0, 0.00, 'wechat', 'success', '2024-03-18 09:15:00', ''),
('ORD20240317004', 5, 'formal', 12, 99.00, 'wechat', 'success', '2024-03-17 14:45:00', ''),
('ORD20240316005', 7, 'formal', 12, 299.00, 'bank', 'success', '2024-03-16 11:00:00', '');
