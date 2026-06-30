import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器:添加 Token + 访客 id(用于阅读量/点赞去重)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // 访客 ID(本地持久化,匿名用户用于阅读/点赞去重)
    let visitorId = localStorage.getItem('visitor-id')
    if (!visitorId) {
      visitorId = 'v-' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36)
      localStorage.setItem('visitor-id', visitorId)
    }
    config.headers['X-Visitor-Id'] = visitorId
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器:P1-7 — 401 时尝试用 refreshToken 续期,失败再清登录
let refreshing: Promise<any> | null = null

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status

    if (status === 401 && !original?._retried) {
      // 没有 refreshToken 字段(老登录)或正在刷新 → 走原流程
      const auth = useAuthStore.getState()
      if (!auth.refreshToken) {
        return handleLogout(error)
      }
      // 防止多个请求同时触发刷新
      if (!refreshing) {
        refreshing = axios
          .post(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken: auth.refreshToken },
            { headers: { 'Content-Type': 'application/json' } },
          )
          .then((r) => {
            const data = r.data?.data ?? r.data
            if (data?.token) {
              localStorage.setItem('auth-token', data.token)
              if (data.refreshToken) {
                localStorage.setItem('auth-refresh-token', data.refreshToken)
              }
              useAuthStore.setState({ token: data.token, refreshToken: data.refreshToken })
            }
            return data
          })
          .catch((e) => {
            handleLogout(e)
            throw e
          })
          .finally(() => {
            refreshing = null
          })
      }

      try {
        const newAuth: any = await refreshing
        original._retried = true
        original.headers.Authorization = `Bearer ${newAuth?.token ?? localStorage.getItem('auth-token')}`
        return apiClient(original)
      } catch {
        return Promise.reject(error)
      }
    }

    if (status === 401) {
      return handleLogout(error)
    }
    return Promise.reject(error)
  },
)

function handleLogout(error: any) {
  localStorage.removeItem('auth-token')
  localStorage.removeItem('auth-refresh-token')
  useAuthStore.getState().logout()
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
  return Promise.reject(error)
}

export default apiClient
