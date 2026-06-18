import apiClient from './auth'

export interface CheckInResponse {
  success: boolean
  data?: {
    dates: string[]
    total: number
  }
}

export interface CheckInStatsResponse {
  success: boolean
  data?: {
    totalDays: number
    thisMonthDays: number
  }
}

export interface CheckInCreateResponse {
  success: boolean
  data?: {
    date: string
  }
}

// 获取签到记录
export async function getCheckIns(params?: {
  year?: number
  month?: number
}): Promise<CheckInResponse> {
  const response = await apiClient.get<CheckInResponse>('/checkins', { params })
  return response.data
}

// 签到
export async function checkIn(date: string): Promise<CheckInCreateResponse> {
  const response = await apiClient.post<CheckInCreateResponse>('/checkins', { date })
  return response.data
}

// 获取签到统计
export async function getCheckInStats(): Promise<CheckInStatsResponse> {
  const response = await apiClient.get<CheckInStatsResponse>('/checkins/stats')
  return response.data
}