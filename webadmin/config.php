<?php
/**
 * rent8 管理后台 - 配置文件
 */

// 数据库配置
define('DB_HOST', 'localhost');
define('DB_NAME', 'rent8_admin');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// 应用配置
define('APP_NAME', 'rent8 管理后台');
define('APP_VERSION', '1.0.0');
define('APP_DEBUG', true);

// 会话配置
define('SESSION_NAME', 'rent8_admin_session');
define('SESSION_LIFETIME', 7200); // 2小时

// 分页配置
define('PAGE_SIZE', 10);

// 时区设置
date_default_timezone_set('Asia/Shanghai');

// 错误显示
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    error_reporting(0);
    ini_set('display_errors', '0');
}

/**
 * 数据库连接类
 */
class Database {
    private static $instance = null;
    private $pdo;
    
    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $this->pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            throw new Exception("数据库连接失败: " . $e->getMessage());
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getPdo() {
        return $this->pdo;
    }
}

/**
 * 获取数据库连接
 */
function getDB() {
    return Database::getInstance()->getPdo();
}

/**
 * API响应函数
 */
function jsonResponse($code, $msg, $data = null) {
    header('Content-Type: application/json; charset=utf-8');
    $response = [
        'code' => $code,
        'msg' => $msg,
        'data' => $data
    ];
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * 成功响应
 */
function success($data = null, $msg = '操作成功') {
    jsonResponse(200, $msg, $data);
}

/**
 * 错误响应
 */
function error($msg = '操作失败', $code = 400) {
    jsonResponse($code, $msg, null);
}

/**
 * 检查登录状态
 */
function checkLogin() {
    session_name(SESSION_NAME);
    session_start();
    
    if (!isset($_SESSION['admin_id']) || empty($_SESSION['admin_id'])) {
        if (isAjaxRequest()) {
            error('未登录', 401);
        } else {
            header('Location: login.php');
            exit;
        }
    }
    
    // 检查会话是否过期
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > SESSION_LIFETIME)) {
        session_destroy();
        if (isAjaxRequest()) {
            error('会话已过期', 401);
        } else {
            header('Location: login.php');
            exit;
        }
    }
    
    $_SESSION['last_activity'] = time();
}

/**
 * 检查是否是AJAX请求
 */
function isAjaxRequest() {
    return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && 
           strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
}

/**
 * 获取当前管理员ID
 */
function getAdminId() {
    return $_SESSION['admin_id'] ?? 0;
}

/**
 * 获取当前管理员信息
 */
function getAdminInfo() {
    return [
        'id' => $_SESSION['admin_id'] ?? 0,
        'username' => $_SESSION['admin_username'] ?? '',
        'nickname' => $_SESSION['admin_nickname'] ?? '',
        'role' => $_SESSION['admin_role'] ?? ''
    ];
}

/**
 * 生成订单号
 */
function generateOrderNo() {
    return 'ORD' . date('Ymd') . strtoupper(substr(uniqid(), -6));
}

/**
 * 记录操作日志
 */
function logOperation($action, $targetType = '', $targetId = 0, $content = '') {
    try {
        $db = getDB();
        $admin = getAdminInfo();
        
        $stmt = $db->prepare("INSERT INTO operation_logs (admin_id, admin_name, action, target_type, target_id, content, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $admin['id'],
            $admin['nickname'] ?: $admin['username'],
            $action,
            $targetType,
            $targetId,
            $content,
            $_SERVER['REMOTE_ADDR'] ?? '',
            $_SERVER['HTTP_USER_AGENT'] ?? ''
        ]);
    } catch (Exception $e) {
        // 日志记录失败不影响主流程
        error_log("记录操作日志失败: " . $e->getMessage());
    }
}

/**
 * 获取系统设置
 */
function getSetting($key, $default = '') {
    try {
        $db = getDB();
        $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = ?");
        $stmt->execute([$key]);
        $result = $stmt->fetch();
        return $result ? $result['setting_value'] : $default;
    } catch (Exception $e) {
        return $default;
    }
}

/**
 * 更新系统设置
 */
function setSetting($key, $value) {
    try {
        $db = getDB();
        $stmt = $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
        $stmt->execute([$key, $value, $value]);
        return true;
    } catch (Exception $e) {
        return false;
    }
}

/**
 * 密码哈希
 */
function passwordHash($password) {
    return password_hash($password, PASSWORD_BCRYPT);
}

/**
 * 密码验证
 */
function passwordVerify($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * 安全过滤
 */
function cleanInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

/**
 * 分页计算
 */
function pagination($page, $pageSize, $total) {
    $page = max(1, intval($page));
    $pageSize = max(1, min(100, intval($pageSize)));
    $totalPages = ceil($total / $pageSize);
    $offset = ($page - 1) * $pageSize;
    
    return [
        'page' => $page,
        'pageSize' => $pageSize,
        'total' => $total,
        'totalPages' => $totalPages,
        'offset' => $offset
    ];
}
