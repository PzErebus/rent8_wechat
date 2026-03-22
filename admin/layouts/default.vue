<template>
  <el-container class="h-screen">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="aside-transition">
      <div class="logo-container">
        <img src="/logo.png" alt="logo" class="logo" v-if="!isCollapse">
        <span v-else class="logo-mini">R8</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        class="border-r-0"
      >
        <el-menu-item index="/">
          <el-icon><DataLine /></el-icon>
          <template #title>数据概览</template>
        </el-menu-item>
        
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
        
        <el-menu-item index="/orders">
          <el-icon><Document /></el-icon>
          <template #title>订单记录</template>
        </el-menu-item>
        
        <el-menu-item index="/logs">
          <el-icon><List /></el-icon>
          <template #title>操作日志</template>
        </el-menu-item>
        
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>系统设置</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶部导航 -->
      <el-header class="flex items-center justify-between border-b">
        <div class="flex items-center">
          <el-button
            :icon="isCollapse ? Expand : Fold"
            @click="toggleCollapse"
            text
          />
          <breadcrumb class="ml-4" />
        </div>
        
        <div class="flex items-center gap-4">
          <el-button :icon="Moon" v-if="colorMode === 'light'" @click="toggleColorMode" text />
          <el-button :icon="Sunny" v-else @click="toggleColorMode" text />
          
          <el-dropdown @command="handleCommand">
            <span class="flex items-center cursor-pointer">
              <el-avatar :size="32" :src="userStore.avatar" />
              <span class="ml-2">{{ userStore.nickname }}</span>
              <el-icon class="ml-1"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="bg-gray-50 dark:bg-gray-900">
        <slot />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import {
  DataLine,
  User,
  Document,
  List,
  Setting,
  Fold,
  Expand,
  ArrowDown,
  Moon,
  Sunny,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const colorMode = useColorMode()

const isCollapse = ref(false)

const activeMenu = computed(() => route.path)

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'logout':
      userStore.logout()
      router.push('/login')
      break
    case 'profile':
      router.push('/profile')
      break
    case 'password':
      router.push('/password')
      break
  }
}

onMounted(() => {
  userStore.getUserInfo()
})
</script>

<style scoped lang="scss">
.aside-transition {
  transition: width 0.3s;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--el-border-color);
  
  .logo {
    height: 40px;
  }
  
  .logo-mini {
    font-size: 20px;
    font-weight: bold;
    color: var(--el-color-primary);
  }
}
</style>
