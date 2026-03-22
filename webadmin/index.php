<?php
/**
 * 管理后台主页面
 */
require_once 'config.php';
checkLogin();

$admin = getAdminInfo();
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo APP_NAME; ?></title>
    <!-- Vue 3 -->
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <!-- Element Plus -->
    <link rel="stylesheet" href="https://unpkg.com/element-plus/dist/index.css">
    <script src="https://unpkg.com/element-plus"></script>
    <script src="https://unpkg.com/element-plus/dist/locale/zh-cn"></script>
    <!-- ECharts -->
    <script src="https://unpkg.com/echarts@5/dist/echarts.min.js"></script>
    <!-- Icons -->
    <script src="https://unpkg.com/@element-plus/icons-vue"></script>
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; }
        
        .admin-container { min-height: 100vh; }
        .admin-aside {
            background: #001529;
            color: white;
            transition: width 0.3s;
        }
        .admin-logo {
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: bold;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .admin-menu { border-right: none; }
        
        .admin-header {
            background: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .header-right { display: flex; align-items: center; gap: 16px; }
        
        .admin-main {
            background: #f0f2f5;
            padding: 24px;
            overflow-y: auto;
        }
        
        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            display: flex;
            align-items: center;
            gap: 16px;
            transition: all 0.3s;
        }
        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.1); }
        .stat-icon {
            width: 64px;
            height: 64px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
        }
        .stat-icon.blue { background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); color: white; }
        .stat-icon.green { background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: white; }
        .stat-icon.orange { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); color: white; }
        .stat-icon.purple { background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); color: white; }
        .stat-icon.red { background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); color: white; }
        .stat-info h3 { font-size: 28px; font-weight: bold; margin-bottom: 4px; }
        .stat-info p { color: #6b7280; }
        
        .content-card {
            background: white;
            border-radius: 12px;
            margin-bottom: 24px;
        }
        .card-header {
            padding: 20px 24px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .card-title { font-size: 16px; font-weight: 600; }
        .card-body { padding: 24px; }
        
        .user-avatar-cell { display: flex; align-items: center; gap: 12px; }
        .chart-container { height: 350px; }
        
        .fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
        .fade-enter-from, .fade-leave-to { opacity: 0; }
    </style>
</head>
<body>
    <div id="app">
        <el-container class="admin-container">
            <!-- 侧边栏 -->
            <el-aside :width="isCollapse ? '64px' : '220px'" class="admin-aside">
                <div class="admin-logo">
                    <span style="font-size: 24px; margin-right: 8px;">🏠</span>
                    <span v-show="!isCollapse">rent8</span>
                </div>
                <el-menu
                    :default-active="activeMenu"
                    class="admin-menu"
                    background-color="#001529"
                    text-color="#a6adb4"
                    active-text-color="#fff"
                    :collapse="isCollapse"
                    :collapse-transition="false"
                    @select="handleMenuSelect"
                >
                    <el-menu-item index="dashboard">
                        <el-icon><odometer /></el-icon>
                        <template #title>数据概览</template>
                    </el-menu-item>
                    <el-menu-item index="users">
                        <el-icon><user /></el-icon>
                        <template #title>用户管理</template>
                    </el-menu-item>
                    <el-menu-item index="orders">
                        <el-icon><list /></el-icon>
                        <template #title>订单记录</template>
                    </el-menu-item>
                    <el-menu-item index="logs">
                        <el-icon><document /></el-icon>
                        <template #title>操作日志</template>
                    </el-menu-item>
                    <el-menu-item index="settings">
                        <el-icon><setting /></el-icon>
                        <template #title>系统设置</template>
                    </el-menu-item>
                </el-menu>
            </el-aside>

            <el-container>
                <!-- 顶部栏 -->
                <el-header class="admin-header" height="64px">
                    <div class="header-left">
                        <el-icon :size="20" style="cursor: pointer;" @click="isCollapse = !isCollapse">
                            <fold v-if="!isCollapse" />
                            <expand v-else />
                        </el-icon>
                        <el-breadcrumb>
                            <el-breadcrumb-item>首页</el-breadcrumb-item>
                            <el-breadcrumb-item>{{ pageTitle }}</el-breadcrumb-item>
                        </el-breadcrumb>
                    </div>
                    <div class="header-right">
                        <el-dropdown @command="handleCommand">
                            <span style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <el-avatar :size="32"><?php echo $admin['nickname'] ? substr($admin['nickname'], 0, 1) : 'A'; ?></el-avatar>
                                <span><?php echo htmlspecialchars($admin['nickname'] ?: $admin['username']); ?></span>
                                <el-icon><arrow-down /></el-icon>
                            </span>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                                    <el-dropdown-item command="settings">系统设置</el-dropdown-item>
                                    <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </div>
                </el-header>

                <!-- 主内容 -->
                <el-main class="admin-main">
                    <transition name="fade" mode="out-in">
                        <!-- 数据概览 -->
                        <div v-if="activeMenu === 'dashboard'" key="dashboard">
                            <el-row :gutter="20">
                                <el-col :xs="24" :sm="12" :lg="6" v-for="stat in statistics" :key="stat.title">
                                    <div class="stat-card" :style="{ marginBottom: '20px' }">
                                        <div class="stat-icon" :class="stat.color">
                                            <el-icon :size="28"><component :is="stat.icon" /></el-icon>
                                        </div>
                                        <div class="stat-info">
                                            <h3>{{ stat.value }}</h3>
                                            <p>{{ stat.title }}</p>
                                        </div>
                                    </div>
                                </el-col>
                            </el-row>

                            <el-row :gutter="20">
                                <el-col :xs="24" :lg="16">
                                    <div class="content-card">
                                        <div class="card-header">
                                            <span class="card-title">收入趋势</span>
                                            <el-radio-group v-model="chartPeriod" size="small" @change="loadIncomeTrend">
                                                <el-radio-button label="week">本周</el-radio-button>
                                                <el-radio-button label="month">本月</el-radio-button>
                                                <el-radio-button label="year">全年</el-radio-button>
                                            </el-radio-group>
                                        </div>
                                        <div class="card-body">
                                            <div ref="incomeChart" class="chart-container"></div>
                                        </div>
                                    </div>
                                </el-col>
                                <el-col :xs="24" :lg="8">
                                    <div class="content-card">
                                        <div class="card-header">
                                            <span class="card-title">用户类型分布</span>
                                        </div>
                                        <div class="card-body">
                                            <div ref="userTypeChart" style="height: 350px;"></div>
                                        </div>
                                    </div>
                                </el-col>
                            </el-row>

                            <div class="content-card">
                                <div class="card-header">
                                    <span class="card-title">即将到期用户（7天内）</span>
                                    <el-button type="primary" size="small" @click="activeMenu = 'users'">
                                        查看全部
                                    </el-button>
                                </div>
                                <div class="card-body">
                                    <el-table :data="expiringUsers" style="width: 100%" v-loading="loading.expiring">
                                        <el-table-column label="用户信息" min-width="180">
                                            <template #default="{ row }">
                                                <div class="user-avatar-cell">
                                                    <el-avatar :size="40">{{ row.nickname ? row.nickname.charAt(0) : 'U' }}</el-avatar>
                                                    <div>
                                                        <div style="font-weight: 500;">{{ row.nickname }}</div>
                                                        <div style="font-size: 12px; color: #6b7280;">{{ row.phone }}</div>
                                                    </div>
                                                </div>
                                            </template>
                                        </el-table-column>
                                        <el-table-column label="类型" width="100">
                                            <template #default="{ row }">
                                                <el-tag :type="row.user_type === 'trial' ? 'warning' : 'success'" effect="light">
                                                    {{ row.user_type === 'trial' ? '试用' : '正式' }}
                                                </el-tag>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="expire_date" label="到期时间" width="120" />
                                        <el-table-column label="剩余天数" width="100">
                                            <template #default="{ row }">
                                                <el-tag :type="row.remaining_days <= 3 ? 'danger' : 'warning'" effect="plain">
                                                    {{ row.remaining_days }}天
                                                </el-tag>
                                            </template>
                                        </el-table-column>
                                        <el-table-column label="操作" width="120" fixed="right">
                                            <template #default="{ row }">
                                                <el-button type="primary" size="small" @click="showRenewDialog(row)">续费</el-button>
                                            </template>
                                        </el-table-column>
                                    </el-table>
                                </div>
                            </div>
                        </div>

                        <!-- 用户管理 -->
                        <div v-if="activeMenu === 'users'" key="users">
                            <div class="content-card">
                                <div class="card-header">
                                    <div style="display: flex; gap: 12px; align-items: center;">
                                        <span class="card-title">用户列表</span>
                                        <el-input v-model="userSearch" placeholder="搜索用户昵称/手机号" style="width: 240px;;" clearable @keyup.enter="loadUsers">
                                            <template #prefix><el-icon><search /></el-icon></template>
                                        </el-input>
                                        <el-select v-model="userTypeFilter" placeholder="用户类型" clearable style="width: 120px;" @change="loadUsers">
                                            <el-option label="试用用户" value="trial" />
                                            <el-option label="正式用户" value="formal" />
                                        </el-select>
                                        <el-select v-model="userStatusFilter" placeholder="状态" clearable style="width: 120px;" @change="loadUsers">
                                            <el-option label="正常" value="active" />
                                            <el-option label="已过期" value="expired" />
                                            <el-option label="已禁用" value="disabled" />
                                        </el-select>
                                    </div>
                                    <div>
                                        <el-button type="success" @click="exportUsers">
                                            <el-icon><download /></el-icon>导出
                                        </el-button>
                                        <el-button type="primary" @click="showUserDialog()">
                                            <el-icon><plus /></el-icon>添加用户
                                        </el-button>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <el-table :data="users" style="width: 100%" v-loading="loading.users">
                                        <el-table-column type="selection" width="55" />
                                        <el-table-column label="用户信息" min-width="200">
                                            <template #default="{ row }">
                                                <div class="user-avatar-cell">
                                                    <el-avatar :size="40">{{ row.nickname ? row.nickname.charAt(0) : 'U' }}</el-avatar>
                                                    <div>
                                                        <div style="font-weight: 500;">{{ row.nickname }}</div>
                                                        <div style="font-size: 12px; color: #6b7280;">ID: {{ row.id }}</div>
                                                    </div>
                                                </div>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="phone" label="手机号" width="140" />
                                        <el-table-column label="类型" width="100">
                                            <template #default="{ row }">
                                                <el-tag :type="row.user_type === 'trial' ? 'warning' : 'success'" effect="light">
                                                    {{ row.user_type === 'trial' ? '试用' : '正式' }}
                                                </el-tag>
                                            </template>
                                        </el-table-column>
                                        <el-table-column label="有效期" min-width="200">
                                            <template #default="{ row }">
                                                <div>{{ row.user_type === 'trial' ? row.trial_start_date : row.formal_start_date }} 至 {{ row.user_type === 'trial' ? row.trial_end_date : row.formal_end_date }}</div>
                                                <el-progress :percentage="row.progress || 0" :status="(row.progress || 0) > 80 ? 'exception' : ''" :stroke-width="6" style="margin-top: 4px;" />
                                            </template>
                                        </el-table-column>
                                        <el-table-column label="状态" width="100">
                                            <template #default="{ row }">
                                                <el-tag :type="getStatusType(row.status)" effect="light">
                                                    {{ getStatusText(row.status) }}
                                                </el-tag>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="create_time" label="注册时间" width="160" />
                                        <el-table-column label="操作" width="200" fixed="right">
                                            <template #default="{ row }">
                                                <el-button type="primary" size="small" text @click="showUserDialog(row)">编辑</el-button>
                                                <el-button type="success" size="small" text @click="showRenewDialog(row)">续费</el-button>
                                                <el-button type="danger" size="small" text @click="deleteUser(row)">删除</el-button>
                                            </template>
                                        </el-table-column>
                                    </el-table>
                                    <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
                                        <el-pagination v-model:current-page="userPage" v-model:page-size="userPageSize" :page-sizes="[10, 20, 50, 100]" :total="userTotal" layout="total, sizes, prev, pager, next" @change="loadUsers" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 订单记录 -->
                        <div v-if="activeMenu === 'orders'" key="orders">
                            <div class="content-card">
                                <div class="card-header">
                                    <div style="display: flex; gap: 12px; align-items: center;">
                                        <span class="card-title">订单列表</span>
                                        <el-date-picker v-model="orderDateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 260px;" @change="loadOrders" />
                                        <el-select v-model="orderStatusFilter" placeholder="订单状态" clearable style="width: 120px;" @change="loadOrders">
                                            <el-option label="支付成功" value="success" />
                                            <el-option label="待支付" value="pending" />
                                            <el-option label="已退款" value="refunded" />
                                        </el-select>
                                    </div>
                                    <el-button type="success" @click="exportOrders">
                                        <el-icon><download /></el-icon>导出订单
                                    </el-button>
                                </div>
                                <div class="card-body">
                                    <el-table :data="orders" style="width: 100%" v-loading="loading.orders">
                                        <el-table-column prop="order_no" label="订单号" width="180" />
                                        <el-table-column label="用户信息" min-width="180">
                                            <template #default="{ row }">
                                                <div class="user-avatar-cell">
                                                    <el-avatar :size="32">{{ row.user_name ? row.user_name.charAt(0) : 'U' }}</el-avatar>
                                                    <span>{{ row.user_name }}</span>
                                                </div>
                                            </template>
                                        </el-table-column>
                                        <el-table-column label="套餐" width="120">
                                            <template #default="{ row }">
                                                <el-tag :type="row.package_type === 'trial' ? 'warning' : 'success'">
                                                    {{ row.package_type === 'trial' ? '试用' : '正式' }}
                                                </el-tag>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="amount" label="金额" width="120">
                                            <template #default="{ row }">
                                                <span style="color: #f56c6c; font-weight: bold;">¥{{ row.amount }}</span>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="pay_method" label="支付方式" width="120">
                                            <template #default="{ row }">
                                                {{ {wechat: '微信支付', alipay: '支付宝', bank: '银行转账', cash: '现金'}[row.pay_method] || row.pay_method }}
                                            </template>
                                        </el-table-column>
                                        <el-table-column label="状态" width="100">
                                            <template #default="{ row }">
                                                <el-tag :type="row.pay_status === 'success' ? 'success' : row.pay_status === 'pending' ? 'warning' : 'info'">
                                                    {{ {success: '成功', pending: '待支付', failed: '失败', refunded: '已退款'}[row.pay_status] }}
                                                </el-tag>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="create_time" label="创建时间" width="180" />
                                        <el-table-column label="操作" width="120" fixed="right">
                                            <template #default="{ row }">
                                                <el-button v-if="row.pay_status === 'success'" type="warning" size="small" text @click="refundOrder(row)">退款</el-button>
                                            </template>
                                        </el-table-column>
                                    </el-table>
                                    <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
                                        <el-pagination v-model:current-page="orderPage" v-model:page-size="orderPageSize" :page-sizes="[10, 20, 50, 100]" :total="orderTotal" layout="total, sizes, prev, pager, next" @change="loadOrders" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 操作日志 -->
                        <div v-if="activeMenu === 'logs'" key="logs">
                            <el-row :gutter="20" style="margin-bottom: 20px;">
                                <el-col :xs="24" :sm="6" :lg="6">
                                    <div class="content-card" style="padding: 20px; text-align: center;">
                                        <div style="font-size: 32px; font-weight: bold; color: #409eff;">{{ logStats.today }}</div>
                                        <div style="color: #666; margin-top: 8px;">今日操作</div>
                                    </div>
                                </el-col>
                                <el-col :xs="24" :sm="6" :lg="6">
                                    <div class="content-card" style="padding: 20px; text-align: center;">
                                        <div style="font-size: 32px; font-weight: bold; color: #67c23a;">{{ logStats.week }}</div>
                                        <div style="color: #666; margin-top: 8px;">本周操作</div>
                                    </div>
                                </el-col>
                                <el-col :xs="24" :sm="6" :lg="6">
                                    <div class="content-card" style="padding: 20px; text-align: center;">
                                        <div style="font-size: 32px; font-weight: bold; color: #e6a23c;">{{ logStats.month }}</div>
                                        <div style="color: #666; margin-top: 8px;">本月操作</div>
                                    </div>
                                </el-col>
                                <el-col :xs="24" :sm="6" :lg="6">
                                    <div class="content-card" style="padding: 20px; text-align: center;">
                                        <div style="font-size: 32px; font-weight: bold; color: #909399;">{{ logStats.total }}</div>
                                        <div style="color: #666; margin-top: 8px;">总记录数</div>
                                    </div>
                                </el-col>
                            </el-row>
                            <div class="content-card">
                                <div class="card-header">
                                    <div style="display: flex; gap: 12px; align-items: center;">
                                        <span class="card-title">操作日志</span>
                                        <el-select v-model="logAdminFilter" placeholder="操作员" clearable style="width: 140px;" @change="loadLogs">
                                            <el-option v-for="admin in logAdmins" :key="admin.id" :label="admin.nickname || admin.username" :value="admin.id" />
                                        </el-select>
                                        <el-select v-model="logActionFilter" placeholder="操作类型" clearable style="width: 140px;" @change="loadLogs">
                                            <el-option v-for="action in logActions" :key="action" :label="action" :value="action" />
                                        </el-select>
                                        <el-date-picker v-model="logDateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 260px;" @change="loadLogs" />
                                    </div>
                                    <el-popconfirm title="确定要清空日志吗？将保留最近30天的记录。" @confirm="clearLogs">
                                        <template #reference>
                                            <el-button type="danger">
                                                <el-icon><delete /></el-icon>清空日志
                                            </el-button>
                                        </template>
                                    </el-popconfirm>
                                </div>
                                <div class="card-body">
                                    <el-table :data="logs" style="width: 100%" v-loading="loading.logs">
                                        <el-table-column prop="id" label="ID" width="80" />
                                        <el-table-column label="操作员" width="120">
                                            <template #default="{ row }">
                                                <span>{{ row.admin_name || '未知' }}</span>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="action" label="操作类型" width="120">
                                            <template #default="{ row }">
                                                <el-tag size="small">{{ row.action }}</el-tag>
                                            </template>
                                        </el-table-column>
                                        <el-table-column label="操作对象" width="150">
                                            <template #default="{ row }">
                                                <span>{{ row.target_type }} #{{ row.target_id }}</span>
                                            </template>
                                        </el-table-column>
                                        <el-table-column prop="content" label="操作内容" min-width="200" show-overflow-tooltip />
                                        <el-table-column prop="ip" label="IP地址" width="140" />
                                        <el-table-column prop="create_time" label="操作时间" width="180" />
                                    </el-table>
                                    <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
                                        <el-pagination v-model:current-page="logPage" v-model:page-size="logPageSize" :page-sizes="[20, 50, 100, 200]" :total="logTotal" layout="total, sizes, prev, pager, next" @change="loadLogs" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 系统设置 -->
                        <div v-if="activeMenu === 'settings'" key="settings">
                            <el-row :gutter="20">
                                <el-col :xs="24" :lg="12">
                                    <div class="content-card">
                                        <div class="card-header">
                                            <span class="card-title">基础设置</span>
                                        </div>
                                        <div class="card-body">
                                            <el-form :model="settings" label-width="140px" v-loading="loading.settings">
                                                <el-form-item label="系统名称">
                                                    <el-input v-model="settings.system_name" />
                                                </el-form-item>
                                                <el-form-item label="客服电话">
                                                    <el-input v-model="settings.service_phone" />
                                                </el-form-item>
                                                <el-form-item label="试用天数">
                                                    <el-input-number v-model="settings.trial_days" :min="1" :max="30" />
                                                </el-form-item>
                                                <el-form-item label="到期提醒天数">
                                                    <el-input-number v-model="settings.remind_days" :min="1" :max="30" />
                                                </el-form-item>
                                                <el-form-item label="正式用户年费">
                                                    <el-input v-model="settings.formal_price">
                                                        <template #append>元/年</template>
                                                    </el-input>
                                                </el-form-item>
                                                <el-form-item>
                                                    <el-button type="primary" @click="saveSettings">保存设置</el-button>
                                                </el-form-item>
                                            </el-form>
                                        </div>
                                    </div>
                                </el-col>
                                <el-col :xs="24" :lg="12">
                                    <div class="content-card">
                                        <div class="card-header">
                                            <span class="card-title">通知设置</span>
                                        </div>
                                        <div class="card-body">
                                            <el-form label-width="160px" v-loading="loading.settings">
                                                <el-form-item label="到期提醒通知">
                                                    <el-switch v-model="settings.notify_expire" :active-value="1" :inactive-value="0" />
                                                </el-form-item>
                                                <el-form-item label="新用户注册通知">
                                                    <el-switch v-model="settings.notify_new_user" :active-value="1" :inactive-value="0" />
                                                </el-form-item>
                                                <el-form-item label="支付成功通知">
                                                    <el-switch v-model="settings.notify_payment" :active-value="1" :inactive-value="0" />
                                                </el-form-item>
                                                <el-form-item label="用户续费通知">
                                                    <el-switch v-model="settings.notify_renew" :active-value="1" :inactive-value="0" />
                                                </el-form-item>
                                                <el-form-item>
                                                    <el-button type="primary" @click="saveSettings">保存设置</el-button>
                                                </el-form-item>
                                            </el-form>
                                        </div>
                                    </div>
                                </el-col>
                            </el-row>
                            <el-row :gutter="20" style="margin-top: 20px;">
                                <el-col :xs="24">
                                    <div class="content-card">
                                        <div class="card-header">
                                            <span class="card-title">数据备份</span>
                                            <el-button type="primary" @click="createBackup" :loading="backupLoading">
                                                <el-icon><plus /></el-icon>创建备份
                                            </el-button>
                                        </div>
                                        <div class="card-body">
                                            <el-row :gutter="20" style="margin-bottom: 20px;">
                                                <el-col :xs="24" :sm="8">
                                                    <div style="text-align: center; padding: 20px; background: #f5f7fa; border-radius: 8px;">
                                                        <div style="font-size: 28px; font-weight: bold; color: #409eff;">{{ backupStats.total }}</div>
                                                        <div style="color: #666; margin-top: 8px;">备份总数</div>
                                                    </div>
                                                </el-col>
                                                <el-col :xs="24" :sm="8">
                                                    <div style="text-align: center; padding: 20px; background: #f5f7fa; border-radius: 8px;">
                                                        <div style="font-size: 28px; font-weight: bold; color: #67c23a;">{{ backupStats.totalSize }}</div>
                                                        <div style="color: #666; margin-top: 8px;">占用空间</div>
                                                    </div>
                                                </el-col>
                                                <el-col :xs="24" :sm="8">
                                                    <div style="text-align: center; padding: 20px; background: #f5f7fa; border-radius: 8px;">
                                                        <div style="font-size: 20px; font-weight: bold; color: #e6a23c;">{{ backupStats.lastBackup ? backupStats.lastBackup.time : '无' }}</div>
                                                        <div style="color: #666; margin-top: 8px;">最近备份</div>
                                                    </div>
                                                </el-col>
                                            </el-row>
                                            <el-table :data="backups" style="width: 100%" v-loading="backupLoading">
                                                <el-table-column prop="filename" label="文件名" min-width="200" />
                                                <el-table-column prop="size" label="大小" width="120" />
                                                <el-table-column prop="create_time" label="创建时间" width="180" />
                                                <el-table-column label="操作" width="250" fixed="right">
                                                    <template #default="{ row }">
                                                        <el-button type="primary" size="small" text @click="downloadBackup(row)">下载</el-button>
                                                        <el-popconfirm title="确定要恢复此备份吗？当前数据将被覆盖！" @confirm="restoreBackup(row)">
                                                            <template #reference>
                                                                <el-button type="warning" size="small" text>恢复</el-button>
                                                            </template>
                                                        </el-popconfirm>
                                                        <el-popconfirm title="确定要删除此备份吗？" @confirm="deleteBackup(row)">
                                                            <template #reference>
                                                                <el-button type="danger" size="small" text>删除</el-button>
                                                            </template>
                                                        </el-popconfirm>
                                                    </template>
                                                </el-table-column>
                                            </el-table>
                                        </div>
                                    </div>
                                </el-col>
                            </el-row>
                        </div>
                    </transition>
                </el-main>
            </el-container>
        </el-container>

        <!-- 用户编辑对话框 -->
        <el-dialog v-model="userDialog.visible" :title="userDialog.title" width="560px">
            <el-form :model="userDialog.form" :rules="userDialog.rules" ref="userFormRef" label-width="100px">
                <el-form-item label="用户昵称" prop="nickname">
                    <el-input v-model="userDialog.form.nickname" placeholder="请输入用户昵称" />
                </el-form-item>
                <el-form-item label="手机号" prop="phone">
                    <el-input v-model="userDialog.form.phone" placeholder="请输入手机号" />
                </el-form-item>
                <el-form-item label="用户类型" prop="user_type">
                    <el-radio-group v-model="userDialog.form.user_type">
                        <el-radio-button label="trial">试用用户</el-radio-button>
                        <el-radio-button label="formal">正式用户</el-radio-button>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="userDialog.form.status">
                        <el-radio label="active">正常</el-radio>
                        <el-radio label="disabled">禁用</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="备注">
                    <el-input v-model="userDialog.form.remark" type="textarea" rows="3" placeholder="可选填" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="userDialog.visible = false">取消</el-button>
                <el-button type="primary" @click="saveUser" :loading="userDialog.loading">确定</el-button>
            </template>
        </el-dialog>

        <!-- 续费对话框 -->
        <el-dialog v-model="renewDialog.visible" title="用户续费" width="480px">
            <div v-if="renewDialog.user" style="margin-bottom: 20px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
                <p><strong>用户：</strong>{{ renewDialog.user.nickname }}</p>
                <p><strong>当前到期：</strong>{{ renewDialog.user.user_type === 'trial' ? renewDialog.user.trial_end_date : renewDialog.user.formal_end_date }}</p>
            </div>
            <el-form :model="renewDialog.form" label-width="100px">
                <el-form-item label="续费时长">
                    <el-radio-group v-model="renewDialog.form.duration">
                        <el-radio-button :label="1">1个月</el-radio-button>
                        <el-radio-button :label="3">3个月</el-radio-button>
                        <el-radio-button :label="6">6个月</el-radio-button>
                        <el-radio-button :label="12">1年</el-radio-button>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="金额">
                    <el-input v-model="renewDialog.form.amount" placeholder="请输入金额">
                        <template #append>元</template>
                    </el-input>
                </el-form-item>
                <el-form-item label="支付方式">
                    <el-select v-model="renewDialog.form.pay_method" style="width: 100%;">
                        <el-option label="微信支付" value="wechat" />
                        <el-option label="支付宝" value="alipay" />
                        <el-option label="银行转账" value="bank" />
                        <el-option label="现金" value="cash" />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="renewDialog.visible = false">取消</el-button>
                <el-button type="primary" @click="confirmRenew" :loading="renewDialog.loading">确认续费</el-button>
            </template>
        </el-dialog>
    </div>

    <script>
        const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;
        const { ElMessage, ElMessageBox } = ElementPlus;

        // 注册所有图标
        for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
            Vue.component(key, component);
        }

        createApp({
            setup() {
                // 布局
                const isCollapse = ref(false);
                const activeMenu = ref('dashboard');
                const pageTitle = computed(() => {
                    const titles = { dashboard: '数据概览', users: '用户管理', orders: '订单记录', logs: '操作日志', settings: '系统设置' };
                    return titles[activeMenu.value] || '';
                });

                // 加载状态
                const loading = ref({
                    dashboard: false,
                    users: false,
                    orders: false,
                    logs: false,
                    settings: false,
                    expiring: false
                });

                // 统计数据
                const statistics = ref([
                    { title: '总用户数', value: 0, icon: 'User', color: 'blue' },
                    { title: '试用用户', value: 0, icon: 'Timer', color: 'orange' },
                    { title: '正式用户', value: 0, icon: 'CircleCheck', color: 'green' },
                    { title: '本月收入', value: '¥0', icon: 'Money', color: 'purple' }
                ]);

                // 图表
                const incomeChart = ref(null);
                const userTypeChart = ref(null);
                const chartPeriod = ref('week');
                let incomeChartInstance = null;
                let userTypeChartInstance = null;

                // 即将到期用户
                const expiringUsers = ref([]);

                // 用户管理
                const users = ref([]);
                const userSearch = ref('');
                const userTypeFilter = ref('');
                const userStatusFilter = ref('');
                const userPage = ref(1);
                const userPageSize = ref(10);
                const userTotal = ref(0);

                // 用户对话框
                const userDialog = ref({
                    visible: false,
                    title: '添加用户',
                    loading: false,
                    form: {
                        id: null,
                        nickname: '',
                        phone: '',
                        user_type: 'trial',
                        status: 'active',
                        remark: ''
                    },
                    rules: {
                        nickname: [{ required: true, message: '请输入用户昵称', trigger: 'blur' }],
                        phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
                        user_type: [{ required: true, message: '请选择用户类型', trigger: 'change' }],
                        status: [{ required: true, message: '请选择状态', trigger: 'change' }]
                    }
                });
                const userFormRef = ref(null);

                // 续费对话框
                const renewDialog = ref({
                    visible: false,
                    loading: false,
                    user: null,
                    form: { duration: 12, amount: 99, pay_method: 'wechat' }
                });

                // 订单管理
                const orders = ref([]);
                const orderDateRange = ref([]);
                const orderStatusFilter = ref('');
                const orderPage = ref(1);
                const orderPageSize = ref(10);
                const orderTotal = ref(0);

                // 操作日志
                const logs = ref([]);
                const logAdminFilter = ref('');
                const logActionFilter = ref('');
                const logDateRange = ref([]);
                const logPage = ref(1);
                const logPageSize = ref(20);
                const logTotal = ref(0);
                const logAdmins = ref([]);
                const logActions = ref([]);
                const logStats = ref({ today: 0, week: 0, month: 0, total: 0 });

                // 系统设置
                const settings = ref({
                    system_name: '',
                    service_phone: '',
                    trial_days: 7,
                    remind_days: 7,
                    formal_price: 99,
                    notify_expire: 1,
                    notify_new_user: 1,
                    notify_payment: 1,
                    notify_renew: 1
                });

                // 数据备份
                const backups = ref([]);
                const backupLoading = ref(false);
                const backupStats = ref({ total: 0, totalSize: '0 B', lastBackup: null });

                // API请求
                const apiRequest = async (url, options = {}) => {
                    const response = await fetch(url, {
                        headers: { 'Content-Type': 'application/json' },
                        ...options
                    });
                    const data = await response.json();
                    if (data.code !== 200) {
                        throw new Error(data.msg || '请求失败');
                    }
                    return data.data;
                };

                // 加载仪表盘数据
                const loadDashboard = async () => {
                    loading.value.dashboard = true;
                    try {
                        const data = await apiRequest('api/dashboard.php?action=overview');
                        statistics.value[0].value = data.totalUsers;
                        statistics.value[1].value = data.trialUsers;
                        statistics.value[2].value = data.formalUsers;
                        statistics.value[3].value = '¥' + data.monthIncome.toLocaleString();
                    } catch (e) {
                        ElMessage.error(e.message);
                    }
                    loading.value.dashboard = false;
                };

                // 加载收入趋势
                const loadIncomeTrend = async () => {
                    try {
                        const data = await apiRequest(`api/dashboard.php?action=incomeTrend&period=${chartPeriod.value}`);
                        if (incomeChartInstance) {
                            incomeChartInstance.setOption({
                                tooltip: { trigger: 'axis' },
                                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                                xAxis: { type: 'category', data: data.labels, axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#6b7280' } },
                                yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#f3f4f6' } }, axisLabel: { color: '#6b7280', formatter: '¥{value}' } },
                                series: [{ data: data.data, type: 'bar', barWidth: '40%', itemStyle: { borderRadius: [4, 4, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#0ea5e9' }, { offset: 1, color: '#06b6d4' }]) } }]
                            });
                        }
                    } catch (e) {
                        console.error(e);
                    }
                };

                // 加载用户类型分布
                const loadUserTypeDistribution = async () => {
                    try {
                        const data = await apiRequest('api/dashboard.php?action=userTypeDistribution');
                        if (userTypeChartInstance) {
                            userTypeChartInstance.setOption({
                                tooltip: { trigger: 'item' },
                                legend: { bottom: '5%' },
                                series: [{ type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'], avoidLabelOverlap: false, itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 }, label: { show: false }, data: data }]
                            });
                        }
                    } catch (e) {
                        console.error(e);
                    }
                };

                // 加载即将到期用户
                const loadExpiringUsers = async () => {
                    loading.value.expiring = true;
                    try {
                        expiringUsers.value = await apiRequest('api/dashboard.php?action=expiringUsers&days=7');
                    } catch (e) {
                        console.error(e);
                    }
                    loading.value.expiring = false;
                };

                // 加载用户列表
                const loadUsers = async () => {
                    loading.value.users = true;
                    try {
                        const params = new URLSearchParams({
                            action: 'list',
                            page: userPage.value,
                            pageSize: userPageSize.value,
                            keyword: userSearch.value,
                            userType: userTypeFilter.value,
                            status: userStatusFilter.value
                        });
                        const data = await apiRequest(`api/users.php?${params}`);
                        users.value = data.list;
                        userTotal.value = data.pagination.total;
                    } catch (e) {
                        ElMessage.error(e.message);
                    }
                    loading.value.users = false;
                };

                // 加载订单列表
                const loadOrders = async () => {
                    loading.value.orders = true;
                    try {
                        const params = new URLSearchParams({
                            action: 'list',
                            page: orderPage.value,
                            pageSize: orderPageSize.value,
                            status: orderStatusFilter.value
                        });
                        if (orderDateRange.value && orderDateRange.value.length === 2) {
                            params.append('startDate', orderDateRange.value[0].toISOString().split('T')[0]);
                            params.append('endDate', orderDateRange.value[1].toISOString().split('T')[0]);
                        }
                        const data = await apiRequest(`api/orders.php?${params}`);
                        orders.value = data.list;
                        orderTotal.value = data.pagination.total;
                    } catch (e) {
                        ElMessage.error(e.message);
                    }
                    loading.value.orders = false;
                };

                // 加载日志列表
                const loadLogs = async () => {
                    loading.value.logs = true;
                    try {
                        const params = new URLSearchParams({
                            action: 'list',
                            page: logPage.value,
                            pageSize: logPageSize.value,
                            adminId: logAdminFilter.value,
                            actionType: logActionFilter.value
                        });
                        if (logDateRange.value && logDateRange.value.length === 2) {
                            params.append('startDate', logDateRange.value[0].toISOString().split('T')[0]);
                            params.append('endDate', logDateRange.value[1].toISOString().split('T')[0]);
                        }
                        const data = await apiRequest(`api/logs.php?${params}`);
                        logs.value = data.list;
                        logTotal.value = data.pagination.total;
                    } catch (e) {
                        ElMessage.error(e.message);
                    }
                    loading.value.logs = false;
                };

                // 加载日志统计
                const loadLogStats = async () => {
                    try {
                        const data = await apiRequest('api/logs.php?action=stats');
                        logStats.value = data;
                    } catch (e) {
                        console.error(e);
                    }
                };

                // 加载日志筛选选项
                const loadLogOptions = async () => {
                    try {
                        const [admins, actions] = await Promise.all([
                            apiRequest('api/logs.php?action=admins'),
                            apiRequest('api/logs.php?action=actions')
                        ]);
                        logAdmins.value = admins;
                        logActions.value = actions;
                    } catch (e) {
                        console.error(e);
                    }
                };

                // 清空日志
                const clearLogs = async () => {
                    try {
                        await apiRequest('api/logs.php?action=clear');
                        ElMessage.success('日志清空成功');
                        loadLogs();
                        loadLogStats();
                    } catch (e) {
                        ElMessage.error(e.message);
                    }
                };

                // 加载设置
                const loadSettings = async () => {
                    loading.value.settings = true;
                    try {
                        const data = await apiRequest('api/settings.php');
                        Object.keys(settings.value).forEach(key => {
                            if (data[key]) {
                                settings.value[key] = data[key].value;
                            }
                        });
                    } catch (e) {
                        ElMessage.error(e.message);
                    }
                    loading.value.settings = false;
                };

                // 保存设置
                const saveSettings = async () => {
                    try {
                        await apiRequest('api/settings.php', {
                            method: 'POST',
                            body: JSON.stringify(settings.value)
                        });
                        ElMessage.success('设置保存成功');
                    } catch (e) {
                        ElMessage.error(e.message);
                    }
                };

                // 加载备份列表
                const loadBackups = async () => {
                    backupLoading.value = true;
                    try {
                        const [list, stats] = await Promise.all([
                            apiRequest('api/backup.php?action=list'),
                            apiRequest('api/backup.php?action=stats')
                        ]);
                        backups.value = list;
                        backupStats.value = stats;
                    } catch (e) {
                        ElMessage.error(e.message);
                    }
                    backupLoading.value = false;
                };

                // 创建备份
                const createBackup = async () => {
                    backupLoading.value = true;
                    try {
                        await apiRequest('api/backup.php?action=create', { method: 'POST' });
                        ElMessage.success('备份创建成功');
                        loadBackups();
                    } catch (e) {
                        ElMessage.error(e.message);
                    }
                    backupLoading.value = false;
                };

                // 下载备份
                const downloadBackup = (row) => {
                    window.open(`api/backup.php?action=download&filename=${encodeURIComponent(row.filename)}`);
                };

                // 恢复备份
                const restoreBackup = async (row) => {
                    backupLoading.value = true;
                    try {
                        await apiRequest(`api/backup.php?action=restore&filename=${encodeURIComponent(row.filename)}`);
                        ElMessage.success('数据库恢复成功');
                    } catch (e) {
                        ElMessage.error(e.message);
                    }
                    backupLoading.value = false;
                };

                // 删除备份
                const deleteBackup = async (row) => {
                    backupLoading.value = true;
                    try {
                        await apiRequest(`api/backup.php?action=delete&filename=${encodeURIComponent(row.filename)}`);
                        ElMessage.success('备份删除成功');
                        loadBackups();
                    } catch (e) {
                        ElMessage.error(e.message);
                    }
                    backupLoading.value = false;
                };

                // 显示用户对话框
                const showUserDialog = (row = null) => {
                    if (row) {
                        userDialog.value.title = '编辑用户';
                        userDialog.value.form = { ...row };
                    } else {
                        userDialog.value.title = '添加用户';
                        userDialog.value.form = { id: null, nickname: '', phone: '', user_type: 'trial', status: 'active', remark: '' };
                    }
                    userDialog.value.visible = true;
                };

                // 保存用户
                const saveUser = async () => {
                    const valid = await userFormRef.value.validate().catch(() => false);
                    if (!valid) return;

                    userDialog.value.loading = true;
                    try {
                        const action = userDialog.value.form.id ? 'update' : 'create';
                        await apiRequest(`api/users.php?action=${action}`, {
                            method: 'POST',
                            body: JSON.stringify(userDialog.value.form)
                        });
                        ElMessage.success(userDialog.value.form.id ? '用户更新成功' : '用户创建成功');
                        userDialog.value.visible = false;
                        loadUsers();
                        loadDashboard();
                    } catch (e) {
                        ElMessage.error(e.message);
                    }
                    userDialog.value.loading = false;
                };

                // 删除用户
                const deleteUser = (row) => {
                    ElMessageBox.confirm(`确定要删除用户 "${row.nickname}" 吗？`, '提示', { type: 'warning' }).then(async () => {
                        try {
                            await apiRequest(`api/users.php?id=${row.id}`, { method: 'DELETE' });
                            ElMessage.success('删除成功');
                            loadUsers();
                            loadDashboard();
                        } catch (e) {
                            ElMessage.error(e.message);
                        }
                    });
                };

                // 显示续费对话框
                const showRenewDialog = (row) => {
                    renewDialog.value.user = row;
                    renewDialog.value.form = { duration: 12, amount: 99, pay_method: 'wechat' };
                    renewDialog.value.visible = true;
                };

                // 确认续费
                const confirmRenew = async () => {
                    renewDialog.value.loading = true;
                    try {
                        const data = await apiRequest('api/users.php?action=renew', {
                            method: 'POST',
                            body: JSON.stringify({
                                id: renewDialog.value.user.id,
                                ...renewDialog.value.form
                            })
                        });
                        ElMessage.success('续费成功');
                        renewDialog.value.visible = false;
                        loadUsers();
                        loadExpiringUsers();
                        loadDashboard();
                        loadOrders();
                    } catch (e) {
                        ElMessage.error(e.message);
                    }
                    renewDialog.value.loading = false;
                };

                // 退款
                const refundOrder = (row) => {
                    ElMessageBox.prompt('请输入退款原因', '订单退款', { confirmButtonText: '确认退款' }).then(async ({ value }) => {
                        try {
                            await apiRequest('api/orders.php?action=refund', {
                                method: 'POST',
                                body: JSON.stringify({ id: row.id, reason: value })
                            });
                            ElMessage.success('退款成功');
                            loadOrders();
                        } catch (e) {
                            ElMessage.error(e.message);
                        }
                    });
                };

                // 导出
                const exportUsers = () => {
                    ElMessage.success('用户数据导出中...');
                };
                const exportOrders = () => {
                    ElMessage.success('订单数据导出中...');
                };

                // 状态处理
                const getStatusType = (status) => ({ active: 'success', expired: 'danger', disabled: 'info' }[status] || 'info');
                const getStatusText = (status) => ({ active: '正常', expired: '已过期', disabled: '已禁用' }[status] || status);

                // 菜单处理
                const handleMenuSelect = (index) => {
                    activeMenu.value = index;
                    if (index === 'dashboard') {
                        nextTick(() => {
                            initCharts();
                            loadIncomeTrend();
                            loadUserTypeDistribution();
                        });
                    } else if (index === 'users') {
                        loadUsers();
                    } else if (index === 'orders') {
                        loadOrders();
                    } else if (index === 'logs') {
                        loadLogs();
                        loadLogStats();
                        loadLogOptions();
                    } else if (index === 'settings') {
                        loadSettings();
                        loadBackups();
                    }
                };

                const handleCommand = (command) => {
                    if (command === 'logout') {
                        ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' }).then(() => {
                            window.location.href = 'logout.php';
                        });
                    } else if (command === 'settings') {
                        activeMenu.value = 'settings';
                        loadSettings();
                    }
                };

                // 初始化图表
                const initCharts = () => {
                    if (incomeChart.value && !incomeChartInstance) {
                        incomeChartInstance = echarts.init(incomeChart.value);
                    }
                    if (userTypeChart.value && !userTypeChartInstance) {
                        userTypeChartInstance = echarts.init(userTypeChart.value);
                    }
                };

                // 监听页面变化
                watch(activeMenu, (val) => {
                    if (val === 'dashboard') {
                        nextTick(() => {
                            initCharts();
                            loadIncomeTrend();
                            loadUserTypeDistribution();
                        });
                    }
                });

                onMounted(() => {
                    loadDashboard();
                    loadExpiringUsers();
                    nextTick(() => {
                        initCharts();
                        loadIncomeTrend();
                        loadUserTypeDistribution();
                    });
                });

                return {
                    isCollapse, activeMenu, pageTitle, loading, statistics,
                    incomeChart, userTypeChart, chartPeriod, expiringUsers,
                    users, userSearch, userTypeFilter, userStatusFilter, userPage, userPageSize, userTotal,
                    userDialog, userFormRef, showUserDialog, saveUser, deleteUser,
                    renewDialog, showRenewDialog, confirmRenew,
                    orders, orderDateRange, orderStatusFilter, orderPage, orderPageSize, orderTotal,
                    logs, logAdminFilter, logActionFilter, logDateRange, logPage, logPageSize, logTotal,
                    logAdmins, logActions, logStats,
                    backups, backupLoading, backupStats,
                    settings, saveSettings,
                    loadUsers, loadOrders, loadLogs, loadLogStats, loadIncomeTrend, loadExpiringUsers,
                    handleMenuSelect, handleCommand, getStatusType, getStatusText,
                    exportUsers, exportOrders, refundOrder, clearLogs,
                    createBackup, downloadBackup, restoreBackup, deleteBackup
                };
            }
        }).use(ElementPlus, { locale: ElementPlusLocaleZhCn }).mount('#app');
    </script>
</body>
</html>
