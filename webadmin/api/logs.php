<?php
/**
 * 操作日志API
 */
require_once '../config.php';
checkLogin();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

try {
    $db = getDB();
    
    switch ($action) {
        case 'list':
            // 获取日志列表
            $page = intval($_GET['page'] ?? 1);
            $pageSize = intval($_GET['pageSize'] ?? 20);
            $adminId = intval($_GET['adminId'] ?? 0);
            $actionType = $_GET['actionType'] ?? '';
            $startDate = $_GET['startDate'] ?? '';
            $endDate = $_GET['endDate'] ?? '';
            
            // 构建查询条件
            $where = ['1=1'];
            $params = [];
            
            if ($adminId) {
                $where[] = 'admin_id = ?';
                $params[] = $adminId;
            }
            
            if ($actionType) {
                $where[] = 'action = ?';
                $params[] = $actionType;
            }
            
            if ($startDate) {
                $where[] = 'create_time >= ?';
                $params[] = "$startDate 00:00:00";
            }
            
            if ($endDate) {
                $where[] = 'create_time <= ?';
                $params[] = "$endDate 23:59:59";
            }
            
            $whereStr = implode(' AND ', $where);
            
            // 获取总数
            $countStmt = $db->prepare("SELECT COUNT(*) as total FROM operation_logs WHERE $whereStr");
            $countStmt->execute($params);
            $total = $countStmt->fetch()['total'];
            
            // 分页
            $pager = pagination($page, $pageSize, $total);
            
            // 获取数据
            $sql = "SELECT * FROM operation_logs WHERE $whereStr ORDER BY id DESC LIMIT {$pager['offset']}, {$pager['pageSize']}";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $logs = $stmt->fetchAll();
            
            success([
                'list' => $logs,
                'pagination' => [
                    'page' => $pager['page'],
                    'pageSize' => $pager['pageSize'],
                    'total' => $pager['total'],
                    'totalPages' => $pager['totalPages']
                ]
            ]);
            break;
            
        case 'actions':
            // 获取所有操作类型
            $stmt = $db->query("SELECT DISTINCT action FROM operation_logs ORDER BY action");
            $actions = $stmt->fetchAll(PDO::FETCH_COLUMN);
            success($actions);
            break;
            
        case 'admins':
            // 获取所有管理员（用于筛选）
            $stmt = $db->query("SELECT id, username, nickname FROM admins WHERE status = 1 ORDER BY id");
            $admins = $stmt->fetchAll();
            success($admins);
            break;
            
        case 'clear':
            // 清空日志（保留最近30天）
            $keepDays = intval($_GET['keepDays'] ?? 30);
            $date = date('Y-m-d', strtotime("-$keepDays days"));
            
            $stmt = $db->prepare("DELETE FROM operation_logs WHERE create_time < ?");
            $stmt->execute(["$date 00:00:00"]);
            $deletedCount = $stmt->rowCount();
            
            logOperation('清空日志', 'log', 0, "清空$deletedCount条日志，保留最近$keepDays天");
            
            success(['deleted' => $deletedCount], "已清空 $deletedCount 条日志记录");
            break;
            
        case 'stats':
            // 日志统计
            // 今日操作数
            $stmt = $db->query("SELECT COUNT(*) as count FROM operation_logs WHERE DATE(create_time) = CURDATE()");
            $todayCount = $stmt->fetch()['count'];
            
            // 本周操作数
            $stmt = $db->query("SELECT COUNT(*) as count FROM operation_logs WHERE YEARWEEK(create_time) = YEARWEEK(CURDATE())");
            $weekCount = $stmt->fetch()['count'];
            
            // 本月操作数
            $stmt = $db->query("SELECT COUNT(*) as count FROM operation_logs WHERE DATE_FORMAT(create_time, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')");
            $monthCount = $stmt->fetch()['count'];
            
            // 总操作数
            $stmt = $db->query("SELECT COUNT(*) as count FROM operation_logs");
            $totalCount = $stmt->fetch()['count'];
            
            // 各类型操作统计
            $stmt = $db->query("SELECT action, COUNT(*) as count FROM operation_logs GROUP BY action ORDER BY count DESC LIMIT 10");
            $actionStats = $stmt->fetchAll();
            
            success([
                'today' => intval($todayCount),
                'week' => intval($weekCount),
                'month' => intval($monthCount),
                'total' => intval($totalCount),
                'actionStats' => $actionStats
            ]);
            break;
    }
    
} catch (Exception $e) {
    error($e->getMessage());
}
