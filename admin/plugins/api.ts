import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const userStore = useUserStore()
  const router = useRouter()

  const apiFetch = $fetch.create({
    baseURL: config.public.apiBase,
    
    onRequest({ options }) {
      // 添加认证头
      const token = userStore.token || localStorage.getItem('token')
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        }
      }
    },

    async onResponseError({ response }) {
      if (response.status === 401) {
        // Token 过期，尝试刷新
        try {
          await userStore.refreshAccessToken()
          // 刷新成功，可以在这里重试原请求
        } catch {
          // 刷新失败，跳转到登录页
          userStore.logout()
          router.push('/login')
        }
      } else if (response.status === 403) {
        ElMessage.error('权限不足')
      }
    },
  })

  return {
    provide: {
      api: {
        get: <T = any>(url: string, options?: NitroFetchOptions<NitroFetchRequest>) =>
          apiFetch<T>(url, { method: 'GET', ...options }),
        
        post: <T = any>(url: string, body?: any, options?: NitroFetchOptions<NitroFetchRequest>) =>
          apiFetch<T>(url, { method: 'POST', body, ...options }),
        
        patch: <T = any>(url: string, body?: any, options?: NitroFetchOptions<NitroFetchRequest>) =>
          apiFetch<T>(url, { method: 'PATCH', body, ...options }),
        
        put: <T = any>(url: string, body?: any, options?: NitroFetchOptions<NitroFetchRequest>) =>
          apiFetch<T>(url, { method: 'PUT', body, ...options }),
        
        delete: <T = any>(url: string, options?: NitroFetchOptions<NitroFetchRequest>) =>
          apiFetch<T>(url, { method: 'DELETE', ...options }),
      },
    },
  }
})
