// 分类 mock 数据
import type { Category } from '../category'

export const mockCategories: Category[] = [
  {
    id: 1,
    name: '技术',
    slug: 'tech',
    description: '前端、后端、架构等技术思考与实践',
    sortOrder: 0,
    _count: { posts: 7 },
  },
  {
    id: 2,
    name: '生活',
    slug: 'life',
    description: '日常感悟、读书笔记、生活随笔',
    sortOrder: 1,
    _count: { posts: 2 },
  },
  {
    id: 3,
    name: '项目',
    slug: 'projects',
    description: '个人项目的开发记录与复盘',
    sortOrder: 2,
    _count: { posts: 2 },
  },
  {
    id: 4,
    name: '随笔',
    slug: 'essays',
    description: '思绪片段、灵感记录',
    sortOrder: 3,
    _count: { posts: 1 },
  },
]