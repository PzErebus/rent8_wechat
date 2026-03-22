<?php
/**
 * 登录页面
 */
require_once 'config.php';

session_name(SESSION_NAME);
session_start();

// 已登录则跳转到首页
if (isset($_SESSION['admin_id']) && !empty($_SESSION['admin_id'])) {
    header('Location: index.php');
    exit;
}

$error = '';

// 处理登录
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        $error = '请输入账号和密码';
    } else {
        try {
            $db = getDB();
            $stmt = $db->prepare("SELECT * FROM admins WHERE username = ? AND status = 1");
            $stmt->execute([$username]);
            $admin = $stmt->fetch();
            
            if ($admin && passwordVerify($password, $admin['password'])) {
                // 登录成功，设置会话
                $_SESSION['admin_id'] = $admin['id'];
                $_SESSION['admin_username'] = $admin['username'];
                $_SESSION['admin_nickname'] = $admin['nickname'];
                $_SESSION['admin_role'] = $admin['role'];
                $_SESSION['last_activity'] = time();
                
                // 更新登录信息
                $stmt = $db->prepare("UPDATE admins SET last_login_time = NOW(), last_login_ip = ? WHERE id = ?");
                $stmt->execute([$_SERVER['REMOTE_ADDR'] ?? '', $admin['id']]);
                
                // 记录日志
                logOperation('登录系统', 'admin', $admin['id'], '管理员登录成功');
                
                header('Location: index.php');
                exit;
            } else {
                $error = '账号或密码错误';
                logOperation('登录失败', 'admin', 0, "用户名: $username");
            }
        } catch (Exception $e) {
            $error = '系统错误，请稍后重试';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录 - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="https://unpkg.com/element-plus/dist/index.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .login-box {
            width: 420px;
            padding: 40px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }
        .login-header {
            text-align: center;
            margin-bottom: 32px;
        }
        .login-logo {
            width: 72px;
            height: 72px;
            background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            color: white;
            font-size: 36px;
        }
        .login-header h1 { font-size: 24px; margin-bottom: 8px; color: #1f2937; }
        .login-header p { color: #6b7280; }
        .login-form .form-group {
            margin-bottom: 20px;
        }
        .login-form label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            color: #374151;
            font-weight: 500;
        }
        .login-form input {
            width: 100%;
            height: 44px;
            padding: 0 16px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.2s;
        }
        .login-form input:focus {
            outline: none;
            border-color: #0ea5e9;
            box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }
        .login-form .error {
            color: #ef4444;
            font-size: 14px;
            margin-bottom: 16px;
            padding: 8px 12px;
            background: #fee2e2;
            border-radius: 6px;
        }
        .login-form button {
            width: 100%;
            height: 44px;
            background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        .login-form button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
        }
        .login-tips {
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 13px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="login-box">
        <div class="login-header">
            <div class="login-logo">🏠</div>
            <h1>rent8 管理后台</h1>
            <p>用户收费管理系统</p>
        </div>
        <form class="login-form" method="POST" action="">
            <?php if ($error): ?>
                <div class="error"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            <div class="form-group">
                <label>管理员账号</label>
                <input type="text" name="username" placeholder="请输入账号" required autofocus>
            </div>
            <div class="form-group">
                <label>密码</label>
                <input type="password" name="password" placeholder="请输入密码" required>
            </div>
            <button type="submit">登 录</button>
        </form>
        <div class="login-tips">
            默认账号：admin &nbsp;|&nbsp; 默认密码：password
        </div>
    </div>
</body>
</html>
