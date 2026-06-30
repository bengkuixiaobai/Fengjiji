// 标签云页 — 根据文章数量计算字号,展示所有标签
import { useEffect, useState } from 'react'
import { Card, Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import { TagsOutlined } from '@ant-design/icons'
import AppLayout from '../../components/AppLayout'
import { getTags, type Tag } from '../../services/tag'

// 颜色调色板(基于标签 id 稳定选色)
const PALETTE = ['#667eea', '#764ba2', '#36d399', '#f472b6', '#faad14', '#13c2c2']

function pickColor(id: number) {
  return PALETTE[id % PALETTE.length]
}

function TagCloud() {
  const navigate = useNavigate()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTags().then(res => {
      if (res.success && res.data) setTags(res.data)
      setLoading(false)
    })
  }, [])

  // 计算字号:按文章数比例
  const counts = tags.map(t => t._count?.posts ?? 0)
  const max = Math.max(...counts, 1)
  const min = Math.min(...counts, 1)
  const range = Math.max(1, max - min)

  return (
    <AppLayout selectedKey="blogs-view">
      <div style={{ animation: 'fadeIn 0.35s ease-out both', maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            background: 'var(--card-bg)',
            border: 'var(--card-border)',
            borderRadius: '12px',
            padding: '28px 32px',
            marginBottom: '24px',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-color)' }}>
            <TagsOutlined style={{ color: 'var(--accent-start)', marginRight: '8px' }} />
            标签云
          </h1>
          <p style={{ margin: '8px 0 0', color: 'var(--muted-text)', fontSize: '14px' }}>
            点击标签查看相关文章 · 共 {tags.length} 个标签
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Card
            style={{
              background: 'var(--card-bg)',
              border: 'var(--card-border)',
              borderRadius: '12px',
            }}
            styles={{ body: { padding: '36px 32px' } }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 22px', alignItems: 'center', justifyContent: 'center' }}>
              {tags.map(tag => {
                const count = tag._count?.posts ?? 0
                const ratio = range > 0 ? (count - min) / range : 0.5
                const fontSize = 14 + Math.round(ratio * 18) // 14-32 px
                const opacity = 0.7 + ratio * 0.3
                return (
                  <span
                    key={tag.id}
                    onClick={() => navigate(`/tags/${tag.slug}`)}
                    style={{
                      cursor: 'pointer',
                      fontSize,
                      fontWeight: 500 + Math.round(ratio * 300),
                      color: pickColor(tag.id),
                      opacity,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      ;(e.target as HTMLSpanElement).style.background = 'rgba(102,126,234,0.1)'
                    }}
                    onMouseLeave={e => {
                      ;(e.target as HTMLSpanElement).style.background = 'transparent'
                    }}
                  >
                    # {tag.name}
                    <span style={{ fontSize: fontSize * 0.55, marginLeft: '4px', color: 'var(--muted-text)' }}>
                      {count}
                    </span>
                  </span>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}

export default TagCloud