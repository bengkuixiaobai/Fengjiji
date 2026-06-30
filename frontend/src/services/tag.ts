import apiClient from './apiClient'
import { listTags as mockListTags } from './mock/handlers'
import type { Tag, TagsResponse } from './category'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

// 重新导出类型,保持向后兼容
export type { Tag, TagsResponse }

// 获取所有标签
export async function getTags(): Promise<TagsResponse> {
  if (USE_MOCK) return mockListTags()
  const response = await apiClient.get<TagsResponse>('/tags')
  return response.data
}

// 通过 slug 获取单个标签(mock 模式下从列表中筛)
export async function getTagBySlug(slug: string): Promise<Tag | null> {
  if (USE_MOCK) {
    const res = await mockListTags()
    return res.data?.find(t => t.slug === slug) ?? null
  }
  const response = await apiClient.get<{ success: boolean; data?: Tag }>(`/tags/${slug}`)
  return response.data.data ?? null
}