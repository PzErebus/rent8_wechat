<?php
/**
 * 用户管理API
 */
require_once '../config.php';
checkLogin();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    $db = getDB();
    
    switch ($method) {
        case 'GET':
            if ($action === 'list') {
                // 获取用户列表
                $page = intval($_GET['page'] ?? 1);
                $pageSize = intval($_GET['pageSize'] ?? PAGE_SIZE);
                $keyword = $_GET['keyword'] ?? '';
                $userType = $_GET['userType'] ?? '';
                $status = $_GET['status'] ?? '';
                
                // 构建查询条件
                $where = ['1=1'];
                $params = [];
                
                if ($keyword) {
                    $where[] = '(nickname LIKE ? OR phone LIKE ?)';
                    $params[] = "%$keyword%";
                    $params[] = "%$keyword%";
                }
                
                if ($userType) {
                    $where[] = 'user_type = ?';
                    $params[] = $userType;
                }
                
                if ($status) {
                    $where[] = 'status = ?';
                    $params[] = $status;
                }
                
                $whereStr = implode(' AND ', $where);
                
                // 获取总数
                $countStmt = $db->prepare("SELECT COUNT(*) as total FROM users WHERE $whereStr");
                $countStmt->execute($params);
                $total = $countStmt->fetch()['total'];
                
                // 分页
                $pager = pagination($page, $pageSize, $total);
                
                // 获取数据
                $sql = "SELECT * FROM users WHERE $whereStr ORDER BY id DESC LIMIT {$pager['offset']}, {$pager['pageSize']}";
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                $users = $stmt->fetchAll();
                
                // 计算进度
                foreach ($users as &$user) {
                    $user['progress'] = calculateProgress($user);
                }
                
                success([
                    'list' => $users,
                    'pagination' => [
                        'page' => $pager['page'],
                        'pageSize' => $pager['pageSize'],
                        'total' => $pager['total'],
                        'totalPages' => $pager['totalPages']
                    ]
                ]);
                
            } elseif ($action === 'detail') {
                // 获取用户详情
                $id = intval($_GET['id'] ?? 0);
                if (!$id) {
                    error('用户ID不能为空');
                }
                
                $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
                $stmt->execute([$id]);
                $user = $stmt->fetch();
                
                if (!$user) {
                    error('用户不存在');
                }
                
                // 获取用户订单
                $orderStmt = $db->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC");
                $orderStmt->execute([$id]);
                $user['orders'] = $orderStmt->fetchAll();
                
                success($user);
                
            } elseif ($action === 'expiring') {
                // 获取即将到期用户
                $days = intval($_GET['days'] ?? 7);
                $date = date('Y-m-d', strtotime("+$days days"));
                
                $stmt = $db->prepare("SELECT *, DATEDIFF(trial_end_date, CURDATE()) as remaining_days FROM users WHERE user_type = 'trial' AND status = 'active' AND trial_end_date <= ? AND trial_end_date >= CURDATE() ORDER BY trial_end_date ASC");
                $stmt->execute([$date]);
                $users = $stmt->fetchAll();
                
                success($users);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if ($action === 'create') {
                // 创建用户
                $nickname = cleanInput($data['nickname'] ?? '');
                $phone = cleanInput($data['phone'] ?? '');
                $userType = $data['userType'] ?? 'trial';
                $status = $data['status'] ?? 'active';
                $remark = cleanInput($data['remark'] ?? '');
                
                if (empty($nickname)) {
                    error('用户昵称不能为空');
                }
                
                // 生成openid
                $openid = 'manual_' . uniqid();
                
                // 计算日期
                $trialStart = null;
                $trialEnd = null;
                $formalStart = null;
                $formalEnd = null;
                
                if ($userType === 'trial') {
                    $trialDays = intval(getSetting('trial_days', 7));
                    $trialStart = date('Y-m-d');
                    $trialEnd = date('Y-m-d', strtotime("+$trialDays days"));
                } else {
                    $formalStart = date('Y-m-d');
                    $formalEnd = date('Y-m-d', strtotime('+1 year'));
                }
                
                $stmt = $db->prepare("INSERT INTO users (openid, nickname, phone, user_type, status, trial_start_date, trial_end_date, formal_start_date, formal_end_date, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$openid, $nickname, $phone, $userType, $status, $trialStart, $trialEnd, $formalStart, $formalEnd, $remark]);
                
                $userId = $db->lastInsertId();
                
                // 记录日志
                logOperation('创建用户', 'user', $userId, "创建用户: $nickname");
                
                success(['id' => $userId], '用户创建成功');
                
            } elseif ($action === 'update') {
                // 更新用户
                $id = intval($data['id'] ?? 0);
                if (!$id) {
                    error('用户ID不能为空');
                }
                
                $nickname = cleanInput($data['nickname'] ?? '');
                $phone = cleanInput($data['phone'] ?? '');
                $userType = $data['userType'] ?? 'trial';
                $status = $data['status'] ?? 'active';
                $remark = cleanInput($data['remark'] ?? '');
                
                // 获取原用户信息
                $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
                $stmt->execute([$id]);
                $oldUser = $stmt->fetch();
                
                if (!$oldUser) {
                    error('用户不存在');
                }
                
                // 如果类型改变，更新日期
                $trialStart = $oldUser['trial_start_date'];
                $trialEnd = $oldUser['trial_end_date'];
                $formalStart = $oldUser['formal_start_date'];
                $formalEnd = $oldUser['formal_end_date'];
                
                if ($userType !== $oldUser['user_type']) {
                    if ($userType === 'trial') {
                        $trialDays = intval(getSetting('trial_days', 7));
                        $trialStart = date('Y-m-d');
                        $trialEnd = date('Y-m-d', strtotime("+$trialDays days"));
                    } else {
                        $formalStart = date('Y-m-d');
                        $formalEnd = date('Y-m-d', strtotime('+1 year'));
                    }
                }
                
                $stmt = $db->prepare("UPDATE users SET nickname = ?, phone = ?, user_type = ?, status = ?, trial_start_date = ?, trial_end_date = ?, formal_start_date = ?, formal_end_date = ?, remark = ? WHERE id = ?");
                $stmt->execute([$nickname, $phone, $userType, $status, $trialStart, $trialEnd, $formalStart, $formalEnd, $remark, $id]);
                
                // 记录日志
                logOperation('更新用户', 'user', $id, "更新用户: $nickname");
                
                success(null, '用户更新成功');
                
            } elseif ($action === 'renew') {
                // 用户续费
                $id = intval($data['id'] ?? 0);
                $duration = intval($data['duration'] ?? 12);
                $amount = floatval($data['amount'] ?? 0);
                $payMethod = $data['payMethod'] ?? 'wechat';
                
                if (!$id) {
                    error('用户ID不能为空');
                }
                
                // 获取用户信息
                $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
                $stmt->execute([$id]);
                $user = $stmt->fetch();
                
                if (!$user) {
                    error('用户不存在');
                }
                
                // 计算新的到期日期
                $currentEnd = $user['user_type'] === 'trial' ? $user['trial_end_date'] : $user['formal_end_date'];
                $baseDate = $currentEnd && strtotime($currentEnd) > time() ? $currentEnd : date('Y-m-d');
                $newEnd = date('Y-m-d', strtotime("$baseDate +$duration months"));
                
                // 更新用户为正式用户
                $stmt = $db->prepare("UPDATE users SET user_type = 'formal', status = 'active', formal_start_date = ?, formal_end_date = ? WHERE id = ?");
                $stmt->execute([date('Y-m-d'), $newEnd, $id]);
                
                // 创建订单
                $orderNo = generateOrderNo();
                $stmt = $db->prepare("INSERT INTO orders (order_no, user_id, package_type, duration, amount, pay_method, pay_status, pay_time, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)");
                $stmt->execute([$orderNo, $id, 'formal', $duration, $amount, $payMethod, 'success', getAdminId()]);
                
                // 记录日志
                logOperation('用户续费', 'user', $id, "续费$duration个月，金额：$amount");
                
                success(['orderNo' => $orderNo, 'expireDate' => $newEnd], '续费成功');
            }
            break;
            
        case 'DELETE':
            $id = intval($_GET['id'] ?? 0);
            if (!$id) {
                error('用户ID不能为空');
            }
            
            // 获取用户信息
            $stmt = $db->prepare("SELECT nickname FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $user = $stmt->fetch();
            
            if (!$user) {
                error('用户不存在');
            }
            
            // 删除用户
            $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);
            
            // 记录日志
            logOperation('删除用户', 'user', $id, "删除用户: {$user['nickname']}");
            
            success(null, '用户删除成功');
            break;
    }
    
} catch (Exception $e) {
    error($e->getMessage());
}

/**
 * 计算用户使用进度
 */
function calculateProgress($user) {
    if ($user['user_type'] === 'trial' && $user['trial_start_date'] && $user['trial_end_date']) {
        $start = strtotime($user['trial_start_date']);
        $end = strtotime($user['trial_end_date']);
        $now = time();
        
        if ($now >= $end) return 100;
        if ($now <= $start) return 0;
        
        $total = $end - $start;
        $used = $now - $start;
        return min(100, round($used / $total * 100));
    }
    
    if ($user['user_type'] === 'formal' && $user['formal_start_date'] && $user['formal_end_date']) {
        $start = strtotime($user['formal_start_date']);
        $end = strtotime($user['formal_end_date']);
        $now = time();
        
        if ($now >= $end) return 100;
        if ($now <= $start) return 0;
        
        $total = $end - $start;
        $used = $now - $start;
        return min(100, round($used / $total * 100));
    }
    
    return 0;
}
