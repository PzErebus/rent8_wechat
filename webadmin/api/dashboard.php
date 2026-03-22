<?php
/**
 * 仪表盘数据统计API
 */
require_once '../config.php';
checkLogin();

try {
    $db = getDB();
    
    $action = $_GET['action'] ?? 'overview';
    
    switch ($action) {
        case 'overview':
            // 总用户数
            $stmt = $db->query("SELECT COUNT(*) as count FROM users");
            $totalUsers = $stmt->fetch()['count'];
            
            // 试用用户数
            $stmt = $db->query("SELECT COUNT(*) as count FROM users WHERE user_type = 'trial'");
            $trialUsers = $stmt->fetch()['count'];
            
            // 正式用户数
            $stmt = $db->query("SELECT COUNT(*) as count FROM users WHERE user_type = 'formal'");
            $formalUsers = $stmt->fetch()['count'];
            
            // 本月收入
            $stmt = $db->prepare("SELECT SUM(amount) as total FROM orders WHERE pay_status = 'success' AND DATE_FORMAT(pay_time, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')");
            $stmt->execute();
            $monthIncome = $stmt->fetch()['total'] ?? 0;
            
            // 即将到期用户（7天内）
            $stmt = $db->query("SELECT COUNT(*) as count FROM users WHERE user_type = 'trial' AND status = 'active' AND trial_end_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND trial_end_date >= CURDATE()");
            $expiringUsers = $stmt->fetch()['count'];
            
            // 今日新增用户
            $stmt = $db->query("SELECT COUNT(*) as count FROM users WHERE DATE(create_time) = CURDATE()");
            $todayNewUsers = $stmt->fetch()['count'];
            
            // 今日收入
            $stmt = $db->query("SELECT SUM(amount) as total FROM orders WHERE pay_status = 'success' AND DATE(pay_time) = CURDATE()");
            $todayIncome = $stmt->fetch()['total'] ?? 0;
            
            success([
                'totalUsers' => intval($totalUsers),
                'trialUsers' => intval($trialUsers),
                'formalUsers' => intval($formalUsers),
                'monthIncome' => floatval($monthIncome),
                'expiringUsers' => intval($expiringUsers),
                'todayNewUsers' => intval($todayNewUsers),
                'todayIncome' => floatval($todayIncome)
            ]);
            break;
            
        case 'incomeTrend':
            // 收入趋势
            $period = $_GET['period'] ?? 'week';
            $data = [];
            $labels = [];
            
            if ($period === 'week') {
                // 最近7天
                for ($i = 6; $i >= 0; $i--) {
                    $date = date('Y-m-d', strtotime("-$i days"));
                    $labels[] = date('m-d', strtotime($date));
                    
                    $stmt = $db->prepare("SELECT SUM(amount) as total FROM orders WHERE pay_status = 'success' AND DATE(pay_time) = ?");
                    $stmt->execute([$date]);
                    $amount = $stmt->fetch()['total'] ?? 0;
                    $data[] = floatval($amount);
                }
            } elseif ($period === 'month') {
                // 最近30天（按周汇总）
                for ($i = 3; $i >= 0; $i--) {
                    $start = date('Y-m-d', strtotime("-" . ($i * 7 + 6) . " days"));
                    $end = date('Y-m-d', strtotime("-" . ($i * 7) . " days"));
                    $labels[] = date('m-d', strtotime($start)) . '~' . date('m-d', strtotime($end));
                    
                    $stmt = $db->prepare("SELECT SUM(amount) as total FROM orders WHERE pay_status = 'success' AND DATE(pay_time) BETWEEN ? AND ?");
                    $stmt->execute([$start, $end]);
                    $amount = $stmt->fetch()['total'] ?? 0;
                    $data[] = floatval($amount);
                }
            } elseif ($period === 'year') {
                // 最近12个月
                for ($i = 11; $i >= 0; $i--) {
                    $month = date('Y-m', strtotime("-$i months"));
                    $labels[] = date('Y-m', strtotime("-$i months"));
                    
                    $stmt = $db->prepare("SELECT SUM(amount) as total FROM orders WHERE pay_status = 'success' AND DATE_FORMAT(pay_time, '%Y-%m') = ?");
                    $stmt->execute([$month]);
                    $amount = $stmt->fetch()['total'] ?? 0;
                    $data[] = floatval($amount);
                }
            }
            
            success([
                'labels' => $labels,
                'data' => $data
            ]);
            break;
            
        case 'userTypeDistribution':
            // 用户类型分布
            $stmt = $db->query("SELECT user_type, COUNT(*) as count FROM users GROUP BY user_type");
            $result = $stmt->fetchAll();
            
            $data = [];
            foreach ($result as $row) {
                $data[] = [
                    'name' => $row['user_type'] === 'trial' ? '试用用户' : '正式用户',
                    'value' => intval($row['count'])
                ];
            }
            
            success($data);
            break;
            
        case 'recentUsers':
            // 最近注册用户
            $limit = intval($_GET['limit'] ?? 5);
            $stmt = $db->prepare("SELECT id, nickname, phone, user_type, create_time FROM users ORDER BY id DESC LIMIT ?");
            $stmt->execute([$limit]);
            $users = $stmt->fetchAll();
            
            success($users);
            break;
            
        case 'expiringUsers':
            // 即将到期用户
            $days = intval($_GET['days'] ?? 7);
            $stmt = $db->prepare("SELECT id, nickname, phone, user_type, trial_end_date as expire_date, DATEDIFF(trial_end_date, CURDATE()) as remaining_days FROM users WHERE user_type = 'trial' AND status = 'active' AND trial_end_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY) AND trial_end_date >= CURDATE() ORDER BY trial_end_date ASC");
            $stmt->execute([$days]);
            $users = $stmt->fetchAll();
            
            success($users);
            break;
    }
    
} catch (Exception $e) {
    error($e->getMessage());
}
