// 文章卡片 — 列表页/搜索结果用
import { Card } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { Post } from '../../services/post'
import PostMeta from './PostMeta'
import CategoryBadge from './CategoryBadge'
import TagList from './TagList'

interface PostCardProps {
  post: Post
  /** 列表模式:横向紧凑 | 网格模式:更立体的卡片 */
  variant?: 'grid' | 'list'
}

export default function PostCard({ post, variant = 'grid' }: PostCardProps) {
  const navigate = useNavigate()

  if (variant === 'list') {
    // 紧凑行,适合 BlogManage 风格
    return (
      <div
        className="hover-list-item"
        onClick={() => navigate(`/blogs/${post.slug}`)}
        style={{
          padding: '16px 20px',
          borderBottom: 'var(--divider-color)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <CategoryBadge category={post.category} size="small" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-color)', flex: 1 }}>
            {post.title}
          </h3>
        </div>
        {post.summary && (
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-text)', lineHeight: 1.6 }}>
            {post.summary}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <PostMeta post={post} />
          <TagList tags={post.tags.slice(0, 3)} />
        </div>
      </div>
    )
  }

  // grid 模式:立体卡片
  return (
    <Card
      hoverable
      onClick={() => navigate(`/blogs/${post.slug}`)}
      style={{
        background: 'var(--card-bg)',
        border: 'var(--card-border)',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      styles={{
        body: {
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          flex: 1,
        },
      }}
    >
      {/* 顶部:分类 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <CategoryBadge category={post.category} size="small" />
        <PostMeta post={post} showAuthor={false} fontSize={11} />
      </div>

      {/* 标题 */}
      <h3
        style={{
          margin: 0,
          fontSize: '17px',
          fontWeight: 700,
          color: 'var(--text-color)',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minHeight: '48px',
        }}
      >
        {post.title}
      </h3>

      {/* 摘要 */}
      {post.summary && (
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            color: 'var(--muted-text)',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: '60px',
          }}
        >
          {post.summary}
        </p>
      )}

      {/* 底部:作者 + 标签 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', flexWrap: 'wrap', gap: '8px' }}>
        <PostMeta post={post} showAuthor={false} fontSize={11} />
        <TagList tags={post.tags.slice(0, 2)} />
      </div>
    </Card>
  )
}