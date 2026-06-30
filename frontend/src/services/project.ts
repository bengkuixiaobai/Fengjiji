import apiClient from './apiClient'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

// Mock 项目数据(供 Home Dashboard + ProjectShowcase 使用)
const mockProjects = [
  {
    id: 1,
    name: '风迹集博客系统',
    description: '个人博客与项目管理系统,从登录到看板的一站式解决方案。',
    techStack: ['React', 'TypeScript', 'Vite', 'Express', 'PostgreSQL'],
    codeUrl: 'https://github.com/fengjiji/fengjiji',
    status: 'in_progress' as const,
    completionRate: 65,
    isPublic: true,
    createdAt: '2026-04-14T00:00:00Z',
    updatedAt: '2026-06-20T00:00:00Z',
    author: { id: 1, username: 'fengjiji', nickname: '风迹集主' },
  },
  {
    id: 2,
    name: 'Markdown 知识库',
    description: '团队内部的 Markdown 知识沉淀工具,支持全文检索与多人协作。',
    techStack: ['Vue 3', 'Pinia', 'FastAPI'],
    status: 'planning' as const,
    completionRate: 20,
    isPublic: true,
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-06-10T00:00:00Z',
    author: { id: 1, username: 'fengjiji', nickname: '风迹集主' },
  },
  {
    id: 3,
    name: '命令行 Todo 工具',
    description: '一个极简的命令行 Todo 工具,灵感来自 taskwarrior。',
    techStack: ['Rust'],
    codeUrl: 'https://github.com/fengjiji/td',
    status: 'completed' as const,
    completionRate: 100,
    isPublic: true,
    createdAt: '2025-12-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
    completedAt: '2026-02-01T00:00:00Z',
    author: { id: 1, username: 'fengjiji', nickname: '风迹集主' },
  },
  {
    id: 4,
    name: 'RSS 阅读器',
    description: '聚合订阅的轻量级阅读器,支持本地缓存与全文检索。',
    techStack: ['Next.js', 'Tailwind', 'SQLite'],
    status: 'in_progress' as const,
    completionRate: 45,
    isPublic: true,
    createdAt: '2026-03-10T00:00:00Z',
    updatedAt: '2026-06-15T00:00:00Z',
    author: { id: 1, username: 'fengjiji', nickname: '风迹集主' },
  },
  {
    id: 5,
    name: '时间追踪小工具',
    description: '按番茄钟记录每日时间投入,自动生成周报。',
    techStack: ['Tauri', 'React', 'Rust'],
    codeUrl: 'https://github.com/fengjiji/tomato',
    status: 'planning' as const,
    completionRate: 10,
    isPublic: true,
    createdAt: '2026-05-20T00:00:00Z',
    updatedAt: '2026-06-05T00:00:00Z',
    author: { id: 1, username: 'fengjiji', nickname: '风迹集主' },
  },
  {
    id: 6,
    name: '博客图床代理',
    description: '为博客系统提供图片上传与 CDN 加速的轻量代理服务。',
    techStack: ['Cloudflare Workers', 'TypeScript', 'R2'],
    status: 'completed' as const,
    completionRate: 100,
    isPublic: true,
    createdAt: '2025-09-01T00:00:00Z',
    updatedAt: '2025-11-15T00:00:00Z',
    completedAt: '2025-11-15T00:00:00Z',
    author: { id: 1, username: 'fengjiji', nickname: '风迹集主' },
  },
  {
    id: 7,
    name: '个人财务管理',
    description: '本地运行的个人记账工具,导出 CSV 与可视化报表。',
    techStack: ['Electron', 'Vue 3', 'IndexedDB'],
    status: 'planning' as const,
    completionRate: 5,
    isPublic: false,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-22T00:00:00Z',
    author: { id: 1, username: 'fengjiji', nickname: '风迹集主' },
  },
  {
    id: 8,
    name: 'API 调试工具',
    description: '类似 Postman 的轻量 Web 工具,支持 GraphQL 与 WebSocket。',
    techStack: ['Svelte', 'Node.js', 'WebSocket'],
    codeUrl: 'https://github.com/fengjiji/api-debug',
    status: 'in_progress' as const,
    completionRate: 55,
    isPublic: true,
    createdAt: '2026-02-20T00:00:00Z',
    updatedAt: '2026-06-18T00:00:00Z',
    author: { id: 1, username: 'fengjiji', nickname: '风迹集主' },
  },
  {
    id: 9,
    name: '博客数据备份',
    description: '每日自动备份文章与图片到对象存储,支持一键恢复。',
    techStack: ['Python', 'AWS S3', 'Cron'],
    status: 'completed' as const,
    completionRate: 100,
    isPublic: false,
    createdAt: '2025-07-10T00:00:00Z',
    updatedAt: '2025-08-05T00:00:00Z',
    completedAt: '2025-08-05T00:00:00Z',
    author: { id: 1, username: 'fengjiji', nickname: '风迹集主' },
  },
  {
    id: 10,
    name: 'CLI 天气查询',
    description: '在终端里查看全国城市天气,支持多日预报。',
    techStack: ['Go', 'Cobra'],
    codeUrl: 'https://github.com/fengjiji/wttr',
    status: 'completed' as const,
    completionRate: 100,
    isPublic: true,
    createdAt: '2025-06-01T00:00:00Z',
    updatedAt: '2025-06-20T00:00:00Z',
    completedAt: '2025-06-20T00:00:00Z',
    author: { id: 1, username: 'fengjiji', nickname: '风迹集主' },
  },
  {
    id: 11,
    name: '博客评论系统',
    description: '独立于博客的评论组件,支持匿名与登录两种模式。',
    techStack: ['Node.js', 'MongoDB', 'WebSocket'],
    status: 'in_progress' as const,
    completionRate: 40,
    isPublic: true,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-06-12T00:00:00Z',
    author: { id: 1, username: 'fengjiji', nickname: '风迹集主' },
  },
  {
    id: 12,
    name: 'VSCode 主题',
    description: '个人定制版 VSCode 配色,主打低对比度护眼。',
    techStack: ['JSON', 'TextMate'],
    codeUrl: 'https://github.com/fengjiji/vscode-theme',
    status: 'completed' as const,
    completionRate: 100,
    isPublic: true,
    createdAt: '2025-04-01T00:00:00Z',
    updatedAt: '2025-04-15T00:00:00Z',
    completedAt: '2025-04-15T00:00:00Z',
    author: { id: 1, username: 'fengjiji', nickname: '风迹集主' },
  },
]

export interface PlanItem {
  what: string
  time?: string
  weight?: number
}

export interface Project {
  id: number
  name: string
  description?: string
  techStack: string[]
  codeUrl?: string
  demoUrl?: string
  status: 'planning' | 'in_progress' | 'completed'
  completionRate: number
  isPublic: boolean
  createdAt: string
  completedAt?: string
  startDate?: string
  expectedEndDate?: string
  bufferDays?: number
  plan?: PlanItem[]
  author: {
    id: number
    username: string
    nickname?: string
    avatar?: string
  }
  stagesCount?: number
  tasksCompletedCount?: number
  postsCount?: number
}

export interface ProjectsResponse {
  success: boolean
  data?: {
    projects: Project[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

export interface ProjectResponse {
  success: boolean
  data?: Project
}

export interface CreateProjectRequest {
  name: string
  description?: string
  techStack?: string[]
  codeUrl?: string
  demoUrl?: string
  status?: 'planning' | 'in_progress' | 'completed'
  isPublic?: boolean
  completionRate?: number
  startDate?: string
  expectedEndDate?: string
  bufferDays?: number
  plan?: PlanItem[]
}

// 获取项目列表
export async function getProjects(params?: {
  page?: number
  limit?: number
  status?: string
  authorId?: number
  isPublic?: boolean
  search?: string
  orderBy?: string
  order?: 'asc' | 'desc'
}): Promise<ProjectsResponse> {
  if (USE_MOCK) {
    let result = [...mockProjects]
    if (params?.isPublic !== undefined) {
      result = result.filter(p => p.isPublic === params.isPublic)
    }
    if (params?.status) {
      result = result.filter(p => p.status === params.status)
    }
    const total = result.length
    const limit = params?.limit ?? 20
    const page = Math.max(1, params?.page ?? 1)
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const start = (page - 1) * limit
    return {
      success: true,
      data: {
        projects: result.slice(start, start + limit),
        pagination: { page, limit, total, totalPages },
      },
    }
  }
  const response = await apiClient.get<ProjectsResponse>('/projects', { params })
  return response.data
}

// 获取项目详情
export async function getProjectById(id: number): Promise<ProjectResponse> {
  if (USE_MOCK) {
    const found = mockProjects.find(p => p.id === id)
    if (found) {
      return {
        success: true,
        data: {
          ...found,
          createdAt: found.createdAt,
          // mock 数据补全新字段(详情页会用到)
          startDate: '2026-04-15T00:00:00Z',
          expectedEndDate: '2026-09-30T00:00:00Z',
          bufferDays: 7,
          plan: [
            { what: '需求分析', time: '2 天', weight: 20 },
            { what: '核心功能开发', time: '5 天', weight: 40 },
            { what: 'UI 设计', time: '3 天', weight: 20 },
            { what: '测试与部署', time: '2 天', weight: 20 },
          ],
          author: found.author,
        } as Project,
      }
    }
    return { success: false }
  }
  const response = await apiClient.get<ProjectResponse>(`/projects/${id}`)
  return response.data
}

// 创建项目
export async function createProject(data: CreateProjectRequest): Promise<ProjectResponse> {
  const response = await apiClient.post<ProjectResponse>('/projects', data)
  return response.data
}

// 更新项目
export async function updateProject(id: number, data: Partial<CreateProjectRequest>): Promise<ProjectResponse> {
  if (USE_MOCK) {
    const idx = mockProjects.findIndex(p => p.id === id)
    if (idx >= 0) {
      Object.assign(mockProjects[idx], data)
      return { success: true, data: { ...mockProjects[idx] } as Project }
    }
    return { success: false }
  }
  const response = await apiClient.put<ProjectResponse>(`/projects/${id}`, data)
  return response.data
}

// 删除项目
export async function deleteProject(id: number): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ success: boolean }>(`/projects/${id}`)
  return response.data
}