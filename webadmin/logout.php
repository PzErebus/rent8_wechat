<?php
/**
 * 退出登录
 */
require_once 'config.php';

session_name(SESSION_NAME);
session_start();

// 记录日志
if (isset($_SESSION['admin_id'])) {
    logOperation('退出登录', 'admin', $_SESSION['admin_id'], '管理员退出系统');
}

// 清除会话
session_destroy();

// 跳转到登录页
header('Location: login.php');
exit;
