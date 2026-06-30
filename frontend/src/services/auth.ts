// apiClient 实例已抽到 ./apiClient.ts,统一维护
import apiClient from './apiClient'
export { default as apiClient } from './apiClient'

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

/** 更新个人资料 — P0-4:Profile 接入 */
export async function updateMe(data: { nickname?: string; email?: string; bio?: string; avatar?: string }) {
  const response = await apiClient.put('/users/me', data)
  return response.data
}

/** 修改密码 — P0-4:Profile 接入 */
export async function changePassword(data: { oldPassword: string; newPassword: string }) {
  const response = await apiClient.put('/users/me/password', data)
  return response.data
}

export default apiClient
