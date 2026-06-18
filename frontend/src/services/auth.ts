import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：添加 Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：处理错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface LoginRequest {
  usernameOrEmail: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  inviteCode: string
}

export interface AuthResponse {
  success: boolean
  data?: {
    user: {
      id: number
      username: string
      email: string
      nickname?: string
      avatar?: string
      bio?: string
      role: string
    }
    token: string
    refreshToken: string
  }
  error?: {
    code: string
    message: string
  }
}

export interface UserResponse {
  success: boolean
  data?: {
    id: number
    username: string
    email: string
    nickname?: string
    avatar?: string
    bio?: string
    role: string
  }
}

// 登录
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', data)
  return response.data
}

// 注册
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', data)
  return response.data
}

// 获取当前用户
export async function getCurrentUser(): Promise<UserResponse> {
  const response = await apiClient.get<UserResponse>('/users/me')
  return response.data
}

// 登出
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export default apiClient
