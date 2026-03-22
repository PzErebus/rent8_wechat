<template>
  <div>
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-6">
      <el-col :span="6" v-for="stat in stats" :key="stat.title">
        <el-card shadow="hover" :body-style="{ padding: '20px' }">
          <div class="flex items-center">
            <div
              class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
              :class="stat.bgClass"
            >
              <el-icon :size="24" :color="stat.color">
                <component :is="stat.icon" />
              </el-icon>
            </div>
            <div class="ml-4">
              <div class="text-gray-500 text-sm">{{ stat.title }}</div>
              <div class="text-2xl font-bold">{{ stat.value }}</div>
              <div class="text-xs mt-1" :class="stat.trend > 0 ? 'text-green-500' : 'text-red-500'">
                {{ stat.trend > 0 ? '+' : '' }}{{ stat.trend }}% 较上月
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表 -->
    <el-row :gutter="20" class="mb-6">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="flex justify-between items-center">
              <span>收入趋势</span>
              <el-radio-group v-model="timeRange" size="small">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
                <el-radio-button label="year">本年</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <v-chart class="h-80" :option="revenueChartOption" autoresize />
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>用户分布</span>
          </template>
          <v-chart class="h-80" :option="userChartOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 最新订单和即将到期用户 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="flex justify-between items-center">
              <span>最新订单</span>
              <el-button text @click="$router.push('/orders')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="latestOrders" stripe>
            <el-table-column prop="orderNo" label="订单号" width="140" />
            <el-table-column prop="user.nickname" label="用户" />
            <el-table-column prop="amount" label="金额">
              <template #default="{ row }">
                <span class="text-red-500">¥{{ row.amount }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="时间" width="160">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="flex justify-between items-center">
              <span>即将到期用户</span>
              <el-button text @click="$router.push('/users?status=expiring')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="expiringUsers" stripe>
            <el-table-column prop="nickname" label="用户" />
            <el-table-column prop="phone" label="手机号" />
            <el-table-column prop="trialEndAt" label="到期时间">
              <template #default="{ row }">
                <el-tag :type="getExpireTagType(row.trialEndAt)">
                  {{ formatDate(row.trialEndAt) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleRenew(row)">
                  续费
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  User,
  Money,
  ShoppingCart,
  TrendCharts,
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
])

const { $api } = useNuxtApp()

const timeRange = ref('month')

const stats = ref([
  {
    title: '总用户数',
    value: '1,234',
    trend: 12.5,
    icon: User,
    color: '#409EFF',
    bgClass: 'bg-blue-100',
  },
  {
    title: '本月收入',
    value: '¥45,678',
    trend: 8.2,
    icon: Money,
    color: '#67C23A',
    bgClass: 'bg-green-100',
  },
  {
    title: '本月订单',
    value: '156',
    trend: -3.1,
    icon: ShoppingCart,
    color: '#E6A23C',
    bgClass: 'bg-yellow-100',
  },
  {
    title: '转化率',
    value: '32.5%',
    trend: 5.4,
    icon: TrendCharts,
    color: '#F56C6C',
    bgClass: 'bg-red-100',
  },
])

const revenueChartOption = ref({
  tooltip: {
    trigger: 'axis',
  },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: '收入',
      type: 'line',
      smooth: true,
      data: [1200, 1800, 1500, 2200, 2800, 3200, 3500],
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' },
          ],
        },
      },
    },
  ],
})

const userChartOption = ref({
  tooltip: {
    trigger: 'item',
  },
  legend: {
    bottom: '5%',
  },
  series: [
    {
      name: '用户类型',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        show: false,
      },
      data: [
        { value: 735, name: '试用用户', itemStyle: { color: '#409EFF' } },
        { value: 580, name: '正式用户', itemStyle: { color: '#67C23A' } },
        { value: 120, name: '已过期', itemStyle: { color: '#909399' } },
      ],
    },
  ],
})

const latestOrders = ref([])
const expiringUsers = ref([])

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const getExpireTagType = (date: string) => {
  const days = dayjs(date).diff(dayjs(), 'day')
  if (days <= 1) return 'danger'
  if (days <= 3) return 'warning'
  return 'info'
}

const handleRenew = (row: any) => {
  // 跳转到用户管理页面并打开续费对话框
}

const fetchDashboardData = async () => {
  try {
    const res = await $api.get('/dashboard')
    if (res.data) {
      // 更新统计数据
      // 更新图表数据
      // 更新订单和用户列表
    }
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
  }
}

const fetchExpiringUsers = async () => {
  try {
    const res = await $api.get('/users/expiring?days=7')
    expiringUsers.value = res.data || []
  } catch (error) {
    console.error('获取即将到期用户失败:', error)
  }
}

onMounted(() => {
  fetchDashboardData()
  fetchExpiringUsers()
})
</script>
