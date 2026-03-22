<?php
/**
 * 数据备份API
 */
require_once '../config.php';
checkLogin();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

try {
    $db = getDB();
    
    // 备份目录
    $backupDir = __DIR__ . '/../backups/';
    if (!is_dir($backupDir)) {
        mkdir($backupDir, 0755, true);
    }
    
    switch ($action) {
        case 'list':
            // 获取备份列表
            $backups = [];
            if (is_dir($backupDir)) {
                $files = glob($backupDir . '*.sql');
                foreach ($files as $file) {
                    $backups[] = [
                        'filename' => basename($file),
                        'size' => formatFileSize(filesize($file)),
                        'create_time' => date('Y-m-d H:i:s', filemtime($file))
                    ];
                }
            }
            // 按时间倒序
            usort($backups, function($a, $b) {
                return strtotime($b['create_time']) - strtotime($a['create_time']);
            });
            success($backups);
            break;
            
        case 'create':
            // 创建备份
            $filename = 'backup_' . date('Ymd_His') . '.sql';
            $filepath = $backupDir . $filename;
            
            // 获取所有表
            $tables = [];
            $result = $db->query("SHOW TABLES");
            while ($row = $result->fetch(PDO::FETCH_NUM)) {
                $tables[] = $row[0];
            }
            
            $output = "-- rent8 数据库备份\n";
            $output .= "-- 生成时间: " . date('Y-m-d H:i:s') . "\n";
            $output .= "-- 数据库: " . DB_NAME . "\n\n";
            $output .= "SET FOREIGN_KEY_CHECKS=0;\n\n";
            
            foreach ($tables as $table) {
                // 表结构
                $result = $db->query("SHOW CREATE TABLE `$table`");
                $row = $result->fetch();
                $output .= "-- 表结构: $table\n";
                $output .= "DROP TABLE IF EXISTS `$table`;\n";
                $output .= $row['Create Table'] . ";\n\n";
                
                // 表数据
                $result = $db->query("SELECT * FROM `$table`");
                $rows = $result->fetchAll();
                
                if (count($rows) > 0) {
                    $output .= "-- 表数据: $table\n";
                    $columns = array_keys($rows[0]);
                    $columnStr = '`' . implode('`, `', $columns) . '`';
                    
                    foreach ($rows as $row) {
                        $values = [];
                        foreach ($row as $value) {
                            if ($value === null) {
                                $values[] = 'NULL';
                            } else {
                                $values[] = "'" . addslashes($value) . "'";
                            }
                        }
                        $valueStr = implode(', ', $values);
                        $output .= "INSERT INTO `$table` ($columnStr) VALUES ($valueStr);\n";
                    }
                    $output .= "\n";
                }
            }
            
            $output .= "SET FOREIGN_KEY_CHECKS=1;\n";
            
            // 写入文件
            file_put_contents($filepath, $output);
            
            // 记录日志
            logOperation('创建备份', 'backup', 0, "创建数据库备份: $filename");
            
            success([
                'filename' => $filename,
                'size' => formatFileSize(filesize($filepath)),
                'create_time' => date('Y-m-d H:i:s')
            ], '备份创建成功');
            break;
            
        case 'download':
            // 下载备份
            $filename = basename($_GET['filename'] ?? '');
            
            // 验证文件名格式
            if (!preg_match('/^backup_\d{8}_\d{6}\.sql$/', $filename)) {
                error('非法的文件名格式');
            }
            
            $filepath = realpath($backupDir . $filename);
            
            // 验证文件路径是否在备份目录内
            if ($filepath === false || strpos($filepath, realpath($backupDir)) !== 0) {
                error('非法的文件路径');
            }
            
            if (!file_exists($filepath)) {
                error('备份文件不存在');
            }
            
            // 记录日志
            logOperation('下载备份', 'backup', 0, "下载备份文件: $filename");
            
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            header('Content-Length: ' . filesize($filepath));
            readfile($filepath);
            exit;
            
        case 'delete':
            // 删除备份
            $filename = basename($_GET['filename'] ?? '');
            
            // 验证文件名格式
            if (!preg_match('/^backup_\d{8}_\d{6}\.sql$/', $filename)) {
                error('非法的文件名格式');
            }
            
            $filepath = realpath($backupDir . $filename);
            
            // 验证文件路径是否在备份目录内
            if ($filepath === false || strpos($filepath, realpath($backupDir)) !== 0) {
                error('非法的文件路径');
            }
            
            if (!file_exists($filepath)) {
                error('备份文件不存在');
            }
            
            if (unlink($filepath)) {
                logOperation('删除备份', 'backup', 0, "删除备份文件: $filename");
                success(null, '备份删除成功');
            } else {
                error('删除失败');
            }
            break;
            
        case 'restore':
            // 恢复备份
            $filename = basename($_GET['filename'] ?? '');
            
            // 验证文件名格式
            if (!preg_match('/^backup_\d{8}_\d{6}\.sql$/', $filename)) {
                error('非法的文件名格式');
            }
            
            $filepath = realpath($backupDir . $filename);
            
            // 验证文件路径是否在备份目录内
            if ($filepath === false || strpos($filepath, realpath($backupDir)) !== 0) {
                error('非法的文件路径');
            }
            
            if (!file_exists($filepath)) {
                error('备份文件不存在');
            }
            
            // 读取SQL文件
            $sql = file_get_contents($filepath);
            
            // 分割SQL语句
            $statements = array_filter(array_map('trim', explode(';', $sql)));
            
            // 执行SQL
            $db->exec("SET FOREIGN_KEY_CHECKS=0");
            foreach ($statements as $statement) {
                if (!empty($statement) && !preg_match('/^--/', $statement)) {
                    $db->exec($statement);
                }
            }
            $db->exec("SET FOREIGN_KEY_CHECKS=1");
            
            logOperation('恢复备份', 'backup', 0, "恢复数据库备份: $filename");
            
            success(null, '数据库恢复成功');
            break;
            
        case 'stats':
            // 备份统计
            $stats = [
                'total' => 0,
                'totalSize' => 0,
                'lastBackup' => null
            ];
            
            if (is_dir($backupDir)) {
                $files = glob($backupDir . '*.sql');
                $stats['total'] = count($files);
                
                $totalSize = 0;
                $lastTime = 0;
                foreach ($files as $file) {
                    $totalSize += filesize($file);
                    $mtime = filemtime($file);
                    if ($mtime > $lastTime) {
                        $lastTime = $mtime;
                        $stats['lastBackup'] = [
                            'filename' => basename($file),
                            'time' => date('Y-m-d H:i:s', $mtime)
                        ];
                    }
                }
                $stats['totalSize'] = formatFileSize($totalSize);
            }
            
            success($stats);
            break;
    }
    
} catch (Exception $e) {
    error($e->getMessage());
}

/**
 * 格式化文件大小
 */
function formatFileSize($size) {
    $units = ['B', 'KB', 'MB', 'GB'];
    $unitIndex = 0;
    while ($size >= 1024 && $unitIndex < count($units) - 1) {
        $size /= 1024;
        $unitIndex++;
    }
    return round($size, 2) . ' ' . $units[$unitIndex];
}
