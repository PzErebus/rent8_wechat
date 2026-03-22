<?php
/**
 * 房东小程序API
 * 处理微信登录、权限验证等
 */
require_once '../config.php';

// 小程序配置
const MINIPROGRAM_APPID = 'your_appid_here';
const MINIPROGRAM_SECRET = 'your_secret_here';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    $db = getDB();
    
    switch ($action) {
        case 'login':
            // 微信登录
            if ($method !== 'POST') {
                error('请求方式错误');
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $code = $data['code'] ?? '';
            
            if (empty($code)) {
                error('登录凭证不能为空');
            }
            
            // 调用微信接口获取openid
            $url = "https://api.weixin.qq.com/sns/jscode2session";
            $params = [
                'appid' => MINIPROGRAM_APPID,
                'secret' => MINIPROGRAM_SECRET,
                'js_code' => $code,
                'grant_type' => 'authorization_code'
            ];
            
            $response = file_get_contents($url . '?' . http_build_query($params));
            $wxData = json_decode($response, true);
            
            if (isset($wxData['errcode'])) {
                error('微信登录失败: ' . $wxData['errmsg']);
            }
            
            $openid = $wxData['openid'] ?? '';
            $sessionKey = $wxData['session_key'] ?? '';
            
            if (empty($openid)) {
                error('获取openid失败');
            }
            
            // 查询用户是否存在
            $stmt = $db->prepare("SELECT * FROM users WHERE openid = ?");
            $stmt->execute([$openid]);
            $user = $stmt->fetch();
            
            // 生成token
            $token = md5($openid . time() . uniqid());
            
            if (!$user) {
                // 新用户
                success([
                    'is_new' => true,
                    'openid' => $openid,
                    'session_key' => $sessionKey
                ], '新用户，需要注册');
            }
            
            // 检查用户状态
            if ($user['status'] === 'disabled') {
                error('账号已被禁用', 403);
            }
            
            // 检查是否过期
            $isExpired = false;
            if ($user['user_type'] === 'trial') {
                $isExpired = $user['trial_end_date'] && strtotime($user['trial_end_date']) < time();
            } else {
                $isExpired = $user['formal_end_date'] && strtotime($user['formal_end_date']) < time();
            }
            
            if ($isExpired && $user['status'] !== 'expired') {
                // 更新状态为过期
                $stmt = $db->prepare("UPDATE users SET status = 'expired' WHERE id = ?");
                $stmt->execute([$user['id']]);
                $user['status'] = 'expired';
            }
            
            // 更新登录信息
            $stmt = $db->prepare("UPDATE users SET login_count = login_count + 1, last_login_time = NOW() WHERE id = ?");
            $stmt->execute([$user['id']]);
            
            // 返回用户信息
            success([
                'is_new' => false,
                'token' => $token,
                'user_id' => $user['id'],
                'nickname' => $user['nickname'],
                'avatar' => $user['avatar'],
                'phone' => $user['phone'],
                'user_type' => $user['user_type'],
                'status' => $user['status'],
                'trial_end_date' => $user['trial_end_date'],
                'formal_end_date' => $user['formal_end_date'],
                'room_count' => $user['room_count'],
                'tenant_count' => $user['tenant_count']
            ], '登录成功');
            break;
            
        case 'register':
            // 用户注册
            if ($method !== 'POST') {
                error('请求方式错误');
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $openid = $data['openid'] ?? '';
            $encryptedData = $data['encryptedData'] ?? '';
            $iv = $data['iv'] ?? '';
            
            if (empty($openid)) {
                error('openid不能为空');
            }
            
            // 解密手机号（这里简化处理，实际需要微信解密）
            $phone = '138' . rand(10000000, 99999999); // 临时方案
            $nickname = '房东' . substr($phone, -4);
            
            // 获取试用天数
            $trialDays = intval(getSetting('trial_days', 7));
            $trialStart = date('Y-m-d');
            $trialEnd = date('Y-m-d', strtotime("+$trialDays days"));
            
            // 创建用户
            $stmt = $db->prepare("INSERT INTO users (openid, nickname, phone, user_type, status, trial_start_date, trial_end_date, login_count) VALUES (?, ?, ?, 'trial', 'active', ?, ?, 1)");
            $stmt->execute([$openid, $nickname, $phone, $trialStart, $trialEnd]);
            
            $userId = $db->lastInsertId();
            
            // 生成token
            $token = md5($openid . time() . uniqid());
            
            // 记录日志
            logOperation('新用户注册', 'user', $userId, "手机号: $phone");
            
            success([
                'token' => $token,
                'user_id' => $userId,
                'nickname' => $nickname,
                'phone' => $phone,
                'user_type' => 'trial',
                'status' => 'active',
                'trial_end_date' => $trialEnd,
                'room_count' => 0,
                'tenant_count' => 0
            ], '注册成功');
            break;
            
        case 'info':
            // 获取用户信息
            checkLandlordAuth();
            $userId = getLandlordId();
            
            $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            if (!$user) {
                error('用户不存在');
            }
            
            success([
                'user_id' => $user['id'],
                'nickname' => $user['nickname'],
                'avatar' => $user['avatar'],
                'phone' => $user['phone'],
                'user_type' => $user['user_type'],
                'status' => $user['status'],
                'trial_start_date' => $user['trial_start_date'],
                'trial_end_date' => $user['trial_end_date'],
                'formal_start_date' => $user['formal_start_date'],
                'formal_end_date' => $user['formal_end_date'],
                'room_count' => $user['room_count'],
                'tenant_count' => $user['tenant_count'],
                'login_count' => $user['login_count'],
                'last_login_time' => $user['last_login_time']
            ]);
            break;
            
        case 'update':
            // 更新用户信息
            checkLandlordAuth();
            $userId = getLandlordId();
            
            if ($method !== 'POST') {
                error('请求方式错误');
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $nickname = cleanInput($data['nickname'] ?? '');
            $avatar = $data['avatar'] ?? '';
            
            $stmt = $db->prepare("UPDATE users SET nickname = ?, avatar = ? WHERE id = ?");
            $stmt->execute([$nickname, $avatar, $userId]);
            
            success(null, '更新成功');
            break;
    }
    
} catch (Exception $e) {
    error($e->getMessage());
}

/**
 * 验证房东权限
 */
function checkLandlordAuth() {
    $headers = getallheaders();
    $token = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (empty($token)) {
        error('未登录', 401);
    }
    
    // 这里简化处理，实际应该验证token有效性
    // 可以扩展为使用JWT或session验证
}

/**
 * 获取当前房东ID
 */
function getLandlordId() {
    // 从token解析用户ID
    // 简化处理，实际应该根据token查询
    return intval($_SESSION['landlord_id'] ?? 0);
}
