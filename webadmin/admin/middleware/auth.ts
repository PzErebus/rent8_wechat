export default defineNuxtRouteMiddleware((to) => {
  // 登录页不需要验证
  if (to.path === '/login') {
    return
  }

  // 检查是否有 token
  const token = localStorage.getItem('token')
  
  if (!token) {
    return navigateTo('/login')
  }
})
