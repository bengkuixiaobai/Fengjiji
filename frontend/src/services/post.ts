import apiClient from './apiClient'
import {
  listPosts as mockListPosts,
  getPost as mockGetPost,
  recordView as mockRecordView,
  toggleLike as mockToggleLike,
  getLikeStatus as mockGetLikeStatus,
  getAdjacentPosts as mockGetAdjacentPosts,
} from './mock/handlers'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export interface Post {
  id: number
  title: string
  slug: string
  summary?: string
  content: string
  coverImage?: string
  viewCount: number
  likeCount: number
  status: string
  createdAt: string
  publishedAt?: string
  author: {
    id: number
    username: string
    nickname?: string
    avatar?: string
  }
  category?: {
    id: number
    name: string
    slug: string
  }
  tags: {
    id: number
    name: string
    slug: string
  }[]
}

export interface PostsResponse {
  success: boolean
  data?: {
    posts: Post[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export interface PostResponse {
  success: boolean
  data?: Post
}

export interface CreatePostRequest {
  title: string
  slug: string
  summary?: string
  content: string
  coverImage?: string
  categoryId?: number
  tagIds?: number[]
  status?: 'draft' | 'published'
  projectId?: number
}

// 获取文章列表
export async function getPosts(params?: {
  page?: number
  limit?: number
  categoryId?: number
  tagId?: number
  categorySlug?: string
  tagSlug?: string
  status?: string
  authorId?: number
  search?: string
  orderBy?: string
  order?: 'asc' | 'desc'
}): Promise<PostsResponse> {
  if (USE_MOCK) {
    return mockListPosts(params ?? {})
  }
  const response = await apiClient.get<PostsResponse>('/posts', { params })
  return response.data
}

// 获取文章详情（接受 id 或 slug）
export async function getPostById(idOrSlug: string | number): Promise<PostResponse> {
  if (USE_MOCK) {
    return mockGetPost(idOrSlug)
  }
  const response = await apiClient.get<PostResponse>(`/posts/${idOrSlug}`)
  return response.data
}

// 记录阅读量
export async function recordView(idOrSlug: string | number): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    return mockRecordView(idOrSlug)
  }
  const response = await apiClient.post(`/posts/${idOrSlug}/view`)
  return response.data
}

// 切换点赞（自动 toggle）
export async function toggleLike(
  idOrSlug: string | number,
): Promise<{ success: boolean; data: { likeCount: number; liked: boolean } }> {
  if (USE_MOCK) {
    return mockToggleLike(idOrSlug)
  }
  const response = await apiClient.post(`/posts/${idOrSlug}/like/toggle`)
  return response.data
}

// 获取点赞状态
export async function getLikeStatus(
  idOrSlug: string | number,
): Promise<{ success: boolean; data: { liked: boolean; likeCount: number } }> {
  if (USE_MOCK) {
    return mockGetLikeStatus(idOrSlug)
  }
  const response = await apiClient.get(`/posts/${idOrSlug}/like/status`)
  return response.data
}

// 上下篇导航
export async function getAdjacentPosts(
  idOrSlug: string | number,
): Promise<{ prev: Post | null; next: Post | null }> {
  if (USE_MOCK) {
    return mockGetAdjacentPosts(idOrSlug)
  }
  const response = await apiClient.get<{ success: boolean; data: { prev: Post | null; next: Post | null } }>(
    `/posts/${idOrSlug}/adjacent`,
  )
  return response.data.data ?? { prev: null, next: null }
}

// 创建文章
export async function createPost(data: CreatePostRequest): Promise<PostResponse> {
  const response = await apiClient.post<PostResponse>('/posts', data)
  return response.data
}

// 更新文章
export async function updatePost(id: number, data: Partial<CreatePostRequest>): Promise<PostResponse> {
  const response = await apiClient.put<PostResponse>(`/posts/${id}`, data)
  return response.data
}

// 删除文章
export async function deletePost(id: number): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ success: boolean }>(`/posts/${id}`)
  return response.data
}