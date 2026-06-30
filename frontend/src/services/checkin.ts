import apiClient from './apiClient'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

// Mock: 在内存中累积已签到的日期
const mockCheckedDates = new Set<string>()

// 用一些"历史签到日期"让日历看起来有内容
function seedHistory() {
  if (mockCheckedDates.size > 0) return
  const today = new Date()
  // 过去 30 天里随机签到 18 天
  for (let i = 1; i <= 30; i++) {
    if (Math.random() < 0.6) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      mockCheckedDates.add(d.toISOString().slice(0, 10))
    }
  }
}

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
  if (USE_MOCK) {
    seedHistory()
    let dates = Array.from(mockCheckedDates)
    if (params?.year && params?.month) {
      const prefix = `${params.year}-${String(params.month).padStart(2, '0')}`
      dates = dates.filter(d => d.startsWith(prefix))
    }
    return { success: true, data: { dates, total: dates.length } }
  }
  const response = await apiClient.get<CheckInResponse>('/checkins', { params })
  return response.data
}

// 签到
export async function checkIn(date: string): Promise<CheckInCreateResponse> {
  if (USE_MOCK) {
    mockCheckedDates.add(date)
    return { success: true, data: { date } }
  }
  const response = await apiClient.post<CheckInCreateResponse>('/checkins', { date })
  return response.data
}

// 获取签到统计
export async function getCheckInStats(): Promise<CheckInStatsResponse> {
  if (USE_MOCK) {
    seedHistory()
    const dates = Array.from(mockCheckedDates)
    const thisMonth = new Date().toISOString().slice(0, 7)
    return {
      success: true,
      data: {
        totalDays: dates.length,
        thisMonthDays: dates.filter(d => d.startsWith(thisMonth)).length,
      },
    }
  }
  const response = await apiClient.get<CheckInStatsResponse>('/checkins/stats')
  return response.data
}