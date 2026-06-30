// 分类徽章 — 点击跳到该分类的文章列表
import { Tag } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { Category } from '../../services/category'

interface CategoryBadgeProps {
  category?: Category | { id: number; name: string; slug: string }
  size?: 'small' | 'default'
}

export default function CategoryBadge({ category, size = 'default' }: CategoryBadgeProps) {
  const navigate = useNavigate()
  if (!category) return null

  return (
    <Tag
      style={{
        cursor: 'pointer',
        margin: 0,
        borderRadius: '6px',
        padding: size === 'small' ? '0 6px' : '2px 8px',
        fontSize: size === 'small' ? '12px' : '13px',
        lineHeight: size === 'small' ? '20px' : '24px',
        fontWeight: 500,
        background: 'var(--accent-start)',
        color: '#fff',
        border: 'none',
      }}
      onClick={(e) => {
        e.stopPropagation()
        navigate(`/categories/${category.slug}`)
      }}
    >
      📂 {category.name}
    </Tag>
  )
}