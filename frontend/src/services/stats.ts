import apiClient from './apiClient'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

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
  if (USE_MOCK) {
    return {
      success: true,
      data: {
        postsCount: 12,
        projectsCount: 3,
        checkinsCount: 42,
        totalViews: 6023,
      },
    }
  }
  const response = await apiClient.get<DashboardStatsResponse>('/stats/dashboard')
  return response.data
}