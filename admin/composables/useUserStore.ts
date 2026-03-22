import { defineStore } from 'pinia'

interface UserState {
  token: string | null
  refreshToken: string | null
  id: number | null
  username: string
  nickname: string
  avatar: string
  role: string
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: null,
    refreshToken: null,
    id: null,
    username: '',
    nickname: '',
    avatar: '',
    role: '',
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isSuperAdmin: (state) => state.role === 'SUPER',
  },

  actions: {
    async login(username: string, password: string) {
      const { $api } = useNuxtApp()
      
      const res = await $api.post('/auth/login', {
        username,
        password,
      })
      
      if (res.data) {
        this.token = res.data.access_token
        this.refreshToken = res.data.refresh_token
        this.id = res.data.admin.id
        this.username = res.data.admin.username
        this.nickname = res.data.admin.nickname
        this.avatar = res.data.admin.avatar
        this.role = res.data.admin.role
        
        // 保存到 localStorage
        localStorage.setItem('token', this.token!)
        localStorage.setItem('refreshToken', this.refreshToken!)
        
        return res.data
      }
      
      throw new Error(res.msg || '登录失败')
    },

    async getUserInfo() {
      const token = localStorage.getItem('token')
      if (!token) {
        this.logout()
        return
      }
      
      this.token = token
      this.refreshToken = localStorage.getItem('refreshToken')
      
      // 从 token 解析用户信息
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        this.id = payload.sub
        this.username = payload.username
        this.role = payload.role
      } catch {
        this.logout()
      }
    },

    logout() {
      this.token = null
      this.refreshToken = null
      this.id = null
      this.username = ''
      this.nickname = ''
      this.avatar = ''
      this.role = ''
      
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
    },

    async refreshAccessToken() {
      if (!this.refreshToken) {
        throw new Error('No refresh token')
      }
      
      const { $api } = useNuxtApp()
      
      const res = await $api.post('/auth/refresh', {
        refresh_token: this.refreshToken,
      })
      
      if (res.data?.access_token) {
        this.token = res.data.access_token
        localStorage.setItem('token', this.token!)
        return this.token
      }
      
      throw new Error('Refresh failed')
    },
  },
})
