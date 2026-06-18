import apiClient from './auth'

export interface DashboardStats {
  postsCount: number
  projectsCount: number
  checkinsCount: number
  totalViews: number
}

export interface DashboardStatsResponse {
  success: boolean
  data?: DashboardStats
}

// 获取仪表盘统计数据
export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  const response = await apiClient.get<DashboardStatsResponse>('/stats/dashboard')
  return response.data
}