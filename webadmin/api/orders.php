<?php
/**
 * 订单管理API
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
                // 获取订单列表
                $page = intval($_GET['page'] ?? 1);
                $pageSize = intval($_GET['pageSize'] ?? PAGE_SIZE);
                $keyword = $_GET['keyword'] ?? '';
                $status = $_GET['status'] ?? '';
                $startDate = $_GET['startDate'] ?? '';
                $endDate = $_GET['endDate'] ?? '';
                
                // 构建查询条件
                $where = ['1=1'];
                $params = [];
                
                if ($keyword) {
                    $where[] = '(o.order_no LIKE ? OR u.nickname LIKE ? OR u.phone LIKE ?)';
                    $params[] = "%$keyword%";
                    $params[] = "%$keyword%";
                    $params[] = "%$keyword%";
                }
                
                if ($status) {
                    $where[] = 'o.pay_status = ?';
                    $params[] = $status;
                }
                
                if ($startDate) {
                    $where[] = 'o.create_time >= ?';
                    $params[] = "$startDate 00:00:00";
                }
                
                if ($endDate) {
                    $where[] = 'o.create_time <= ?';
                    $params[] = "$endDate 23:59:59";
                }
                
                $whereStr = implode(' AND ', $where);
                
                // 获取总数
                $countSql = "SELECT COUNT(*) as total FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE $whereStr";
                $countStmt = $db->prepare($countSql);
                $countStmt->execute($params);
                $total = $countStmt->fetch()['total'];
                
                // 分页
                $pager = pagination($page, $pageSize, $total);
                
                // 获取数据
                $sql = "SELECT o.*, u.nickname as user_name, u.phone as user_phone, u.avatar as user_avatar 
                        FROM orders o 
                        LEFT JOIN users u ON o.user_id = u.id 
                        WHERE $whereStr 
                        ORDER BY o.id DESC 
                        LIMIT {$pager['offset']}, {$pager['pageSize']}";
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
                $orders = $stmt->fetchAll();
                
                success([
                    'list' => $orders,
                    'pagination' => [
                        'page' => $pager['page'],
                        'pageSize' => $pager['pageSize'],
                        'total' => $pager['total'],
                        'totalPages' => $pager['totalPages']
                    ]
                ]);
                
            } elseif ($action === 'detail') {
                // 获取订单详情
                $id = intval($_GET['id'] ?? 0);
                if (!$id) {
                    error('订单ID不能为空');
                }
                
                $stmt = $db->prepare("SELECT o.*, u.nickname as user_name, u.phone as user_phone FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?");
                $stmt->execute([$id]);
                $order = $stmt->fetch();
                
                if (!$order) {
                    error('订单不存在');
                }
                
                success($order);
                
            } elseif ($action === 'statistics') {
                // 订单统计
                $startDate = $_GET['startDate'] ?? date('Y-m-01');
                $endDate = $_GET['endDate'] ?? date('Y-m-d');
                
                // 总收入
                $stmt = $db->prepare("SELECT SUM(amount) as total FROM orders WHERE pay_status = 'success' AND pay_time BETWEEN ? AND ?");
                $stmt->execute(["$startDate 00:00:00", "$endDate 23:59:59"]);
                $totalIncome = $stmt->fetch()['total'] ?? 0;
                
                // 总订单数
                $stmt = $db->prepare("SELECT COUNT(*) as count FROM orders WHERE create_time BETWEEN ? AND ?");
                $stmt->execute(["$startDate 00:00:00", "$endDate 23:59:59"]);
                $totalOrders = $stmt->fetch()['count'];
                
                // 成功订单数
                $stmt = $db->prepare("SELECT COUNT(*) as count FROM orders WHERE pay_status = 'success' AND pay_time BETWEEN ? AND ?");
                $stmt->execute(["$startDate 00:00:00", "$endDate 23:59:59"]);
                $successOrders = $stmt->fetch()['count'];
                
                // 退款金额
                $stmt = $db->prepare("SELECT SUM(amount) as total FROM orders WHERE pay_status = 'refunded' AND update_time BETWEEN ? AND ?");
                $stmt->execute(["$startDate 00:00:00", "$endDate 23:59:59"]);
                $refundAmount = $stmt->fetch()['total'] ?? 0;
                
                success([
                    'totalIncome' => floatval($totalIncome),
                    'totalOrders' => intval($totalOrders),
                    'successOrders' => intval($successOrders),
                    'refundAmount' => floatval($refundAmount)
                ]);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if ($action === 'refund') {
                // 订单退款
                $id = intval($data['id'] ?? 0);
                $reason = cleanInput($data['reason'] ?? '');
                
                if (!$id) {
                    error('订单ID不能为空');
                }
                
                // 获取订单信息
                $stmt = $db->prepare("SELECT * FROM orders WHERE id = ?");
                $stmt->execute([$id]);
                $order = $stmt->fetch();
                
                if (!$order) {
                    error('订单不存在');
                }
                
                if ($order['pay_status'] !== 'success') {
                    error('只有已支付订单才能退款');
                }
                
                // 更新订单状态
                $stmt = $db->prepare("UPDATE orders SET pay_status = 'refunded', remark = CONCAT(remark, ' 退款原因：', ?) WHERE id = ?");
                $stmt->execute([$reason, $id]);
                
                // 记录日志
                logOperation('订单退款', 'order', $id, "订单退款，原因：$reason");
                
                success(null, '退款成功');
            }
            break;
    }
    
} catch (Exception $e) {
    error($e->getMessage());
}
