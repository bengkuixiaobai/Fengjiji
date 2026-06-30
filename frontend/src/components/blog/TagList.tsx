// 标签列表 — 点击跳到该标签的文章列表
import { Tag } from 'antd'
import { useNavigate } from 'react-router-dom'

interface TagListProps {
  tags: { id: number; name: string; slug: string }[]
  size?: 'small' | 'default'
  wrap?: boolean
}

export default function TagList({ tags, size = 'small', wrap = true }: TagListProps) {
  const navigate = useNavigate()
  if (!tags || tags.length === 0) return null

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: wrap ? 'wrap' : 'nowrap',
        gap: '6px',
        alignItems: 'center',
      }}
    >
      {tags.map(t => (
        <Tag
          key={t.id}
          style={{
            cursor: 'pointer',
            margin: 0,
            borderRadius: '6px',
            background: 'var(--tag-bg)',
            color: 'var(--tag-color)',
            border: 'none',
            fontSize: size === 'small' ? '12px' : '13px',
            lineHeight: size === 'small' ? '20px' : '24px',
            padding: size === 'small' ? '0 6px' : '2px 8px',
            fontWeight: 400,
          }}
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/tags/${t.slug}`)
          }}
        >
          # {t.name}
        </Tag>
      ))}
    </div>
  )
}