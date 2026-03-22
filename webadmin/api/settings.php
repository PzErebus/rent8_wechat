<?php
/**
 * 系统设置API
 */
require_once '../config.php';
checkLogin();

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = getDB();
    
    switch ($method) {
        case 'GET':
            // 获取所有设置
            $stmt = $db->query("SELECT setting_key, setting_value, description FROM settings");
            $settings = $stmt->fetchAll();
            
            $result = [];
            foreach ($settings as $setting) {
                $result[$setting['setting_key']] = [
                    'value' => $setting['setting_value'],
                    'description' => $setting['description']
                ];
            }
            
            success($result);
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!is_array($data)) {
                error('数据格式错误');
            }
            
            $updated = [];
            foreach ($data as $key => $value) {
                if (setSetting($key, $value)) {
                    $updated[] = $key;
                }
            }
            
            // 记录日志
            logOperation('更新设置', 'settings', 0, '更新设置项: ' . implode(', ', $updated));
            
            success(null, '设置保存成功');
            break;
    }
    
} catch (Exception $e) {
    error($e->getMessage());
}
