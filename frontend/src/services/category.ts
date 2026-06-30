import apiClient from './apiClient'
import { listCategories as mockListCategories } from './mock/handlers'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  sortOrder: number
  _count?: {
    posts: number
  }
}

export interface Tag {
  id: number
  name: string
  slug: string
  _count?: {
    posts: number
  }
}

export interface CategoriesResponse {
  success: boolean
  data?: Category[]
}

export interface TagsResponse {
  success: boolean
  data?: Tag[]
}

// 获取所有分类
export async function getCategories(): Promise<CategoriesResponse> {
  if (USE_MOCK) return mockListCategories()
  const response = await apiClient.get<CategoriesResponse>('/categories')
  return response.data
}

// 获取所有标签(保留在此文件作为向后兼容 re-export)
export { getTags } from './tag'

// 创建分类
export async function createCategory(name: string): Promise<{ success: boolean; data?: Category }> {
  const response = await apiClient.post('/categories', { name })
  return response.data
}

// 创建标签
export async function createTag(name: string): Promise<{ success: boolean; data?: Tag }> {
  const response = await apiClient.post('/tags', { name })
  return response.data
}