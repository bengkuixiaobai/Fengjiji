// Mock 路由分发器 — 模拟后端 API
// 维护内存态 viewCount / likeCount / likedSlugs
import { mockPosts as seedPosts } from './posts'
import { mockCategories } from './categories'
import { mockTags } from './tags'
import type { Post, PostResponse, PostsResponse } from '../post'

// ===== 内存态(模拟数据库) =====
const postsState: Post[] = seedPosts.map(p => ({ ...p }))
const likedSlugs = new Set<string>()

// 模拟网络延迟 — P1-7:dev 模式给少量延迟测试骨架,prod 模式 0ms 砍掉人造延迟
const isDevEnv = import.meta.env.DEV
const delay = (ms: number) => new Promise<void>(r => setTimeout(r, isDevEnv ? ms : 0))

// 取一个稳定的"访客 ID"(实际生产中由后端基于 cookie/IP 计算)
const getVisitorId = (): string => {
  let vid = localStorage.getItem('mock-visitor-id')
  if (!vid) {
    vid = `visitor-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem('mock-visitor-id', vid)
  }
  return vid
}

// ===== Posts =====
interface ListParams {
  page?: number
  limit?: number
  categoryId?: number
  tagId?: number
  categorySlug?: string
  tagSlug?: string
  status?: string
  search?: string
}

export async function listPosts(params: ListParams = {}): Promise<PostsResponse> {
  await delay(150)

  const page = Math.max(1, params.page ?? 1)
  const limit = Math.min(50, Math.max(1, params.limit ?? 10))
  const status = params.status ?? 'published'

  let result = postsState.filter(p => !status || p.status === status)

  if (params.categorySlug) {
    result = result.filter(p => p.category?.slug === params.categorySlug)
  } else if (params.categoryId) {
    result = result.filter(p => p.category?.id === params.categoryId)
  }

  if (params.tagSlug) {
    result = result.filter(p => p.tags.some(t => t.slug === params.tagSlug))
  } else if (params.tagId) {
    result = result.filter(p => p.tags.some(t => t.id === params.tagId))
  }

  if (params.search) {
    const q = params.search.toLowerCase()
    result = result.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.summary?.toLowerCase().includes(q),
    )
  }

  // 按发布时间倒序
  result.sort((a, b) => {
    const ta = new Date(a.publishedAt ?? a.createdAt).getTime()
    const tb = new Date(b.publishedAt ?? b.createdAt).getTime()
    return tb - ta
  })

  const total = result.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const start = (page - 1) * limit
  const posts = result.slice(start, start + limit)

  return {
    success: true,
    data: {
      posts,
      pagination: { page, limit, total, totalPages },
    },
  }
}

export async function getPost(idOrSlug: string | number): Promise<PostResponse> {
  await delay(120)
  const key = String(idOrSlug)
  const post = postsState.find(
    p => String(p.id) === key || p.slug === key,
  )
  if (!post) return { success: false, data: undefined }

  return {
    success: true,
    data: post,
  }
}

export async function recordView(idOrSlug: string | number): Promise<{ success: boolean }> {
  const key = String(idOrSlug)
  const post = postsState.find(p => String(p.id) === key || p.slug === key)
  if (post) post.viewCount += 1
  return { success: true }
}

export async function toggleLike(
  idOrSlug: string | number,
): Promise<{ success: boolean; data: { likeCount: number; liked: boolean } }> {
  await delay(80)
  const key = String(idOrSlug)
  const post = postsState.find(p => String(p.id) === key || p.slug === key)
  if (!post) return { success: false, data: { likeCount: 0, liked: false } }

  const vid = getVisitorId()
  const likeKey = `${key}:${vid}`

  if (likedSlugs.has(likeKey)) {
    likedSlugs.delete(likeKey)
    post.likeCount = Math.max(0, post.likeCount - 1)
    return { success: true, data: { likeCount: post.likeCount, liked: false } }
  } else {
    likedSlugs.add(likeKey)
    post.likeCount += 1
    return { success: true, data: { likeCount: post.likeCount, liked: true } }
  }
}

export async function getLikeStatus(
  idOrSlug: string | number,
): Promise<{ success: boolean; data: { liked: boolean; likeCount: number } }> {
  const key = String(idOrSlug)
  const post = postsState.find(p => String(p.id) === key || p.slug === key)
  if (!post) return { success: false, data: { liked: false, likeCount: 0 } }
  const vid = getVisitorId()
  const liked = likedSlugs.has(`${key}:${vid}`)
  return { success: true, data: { liked, likeCount: post.likeCount } }
}

export async function getAdjacentPosts(idOrSlug: string | number): Promise<{
  prev: Post | null
  next: Post | null
}> {
  await delay(60)
  const key = String(idOrSlug)
  const sorted = [...postsState]
    .filter(p => p.status === 'published')
    .sort((a, b) => {
      const ta = new Date(a.publishedAt ?? a.createdAt).getTime()
      const tb = new Date(b.publishedAt ?? b.createdAt).getTime()
      return ta - tb // 升序:时间更早的在前
    })
  const idx = sorted.findIndex(p => String(p.id) === key || p.slug === key)
  return {
    prev: idx > 0 ? sorted[idx - 1] : null,
    next: idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null,
  }
}

// ===== Categories =====
export async function listCategories() {
  await delay(100)
  // 动态计算 postCount
  const result = mockCategories.map(c => ({
    ...c,
    _count: { posts: postsState.filter(p => p.category?.id === c.id).length },
  }))
  return { success: true, data: result }
}

// ===== Tags =====
export async function listTags() {
  await delay(100)
  const result = mockTags.map(t => ({
    ...t,
    _count: { posts: postsState.filter(p => p.tags.some(pt => pt.id === t.id)).length },
  }))
  return { success: true, data: result }
}