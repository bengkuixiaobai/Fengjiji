import apiClient from './auth'

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
  status?: string
  authorId?: number
  search?: string
  orderBy?: string
  order?: 'asc' | 'desc'
}): Promise<PostsResponse> {
  const response = await apiClient.get<PostsResponse>('/posts', { params })
  return response.data
}

// 获取文章详情
export async function getPostById(id: number): Promise<PostResponse> {
  const response = await apiClient.get<PostResponse>(`/posts/${id}`)
  return response.data
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