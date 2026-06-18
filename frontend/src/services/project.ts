import apiClient from './auth'

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
  const response = await apiClient.get<ProjectsResponse>('/projects', { params })
  return response.data
}

// 获取项目详情
export async function getProjectById(id: number): Promise<ProjectResponse> {
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
  const response = await apiClient.put<ProjectResponse>(`/projects/${id}`, data)
  return response.data
}

// 删除项目
export async function deleteProject(id: number): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ success: boolean }>(`/projects/${id}`)
  return response.data
}