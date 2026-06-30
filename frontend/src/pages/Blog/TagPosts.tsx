// 标签文章列表 — 复用 CategoryPosts 模式
import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Row, Col, Card, Empty, Spin, Button, Tag } from 'antd'
import { ArrowLeftOutlined, TagsOutlined } from '@ant-design/icons'
import AppLayout from '../../components/AppLayout'
import PostCard from '../../components/blog/PostCard'
import PaginationBar from '../../components/blog/PaginationBar'
import { getPosts, type Post } from '../../services/post'
import { getTags } from '../../services/tag'

function TagPosts() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1') || 1
  const pageSize = Number(searchParams.get('size') ?? '9') || 9

  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [tag, setTag] = useState<{ id: number; name: string; slug: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTags().then(res => {
      if (res.success && res.data) {
        const t = res.data.find(x => x.slug === slug)
        setTag(t ?? null)
      }
    })
  }, [slug])

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setLoading(true)
    getPosts({ page, limit: pageSize, tagSlug: slug }).then(res => {
      if (cancelled) return
      if (res.success && res.data) {
        setPosts(res.data.posts)
        setTotal(res.data.pagination.total)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [slug, page, pageSize])

  return (
    <AppLayout selectedKey="blogs-view">
      <div
        style={{
          animation: 'fadeIn 0.35s ease-out both',
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 64px - 40px - 48px)',
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/tags')}
          style={{ marginBottom: '12px', color: 'var(--secondary-text)' }}
        >
          返回标签云
        </Button>

        <div
          style={{
            background: 'var(--card-bg)',
            border: 'var(--card-border)',
            borderRadius: '12px',
            padding: '28px 32px',
            marginBottom: '24px',
            backgroundImage: 'var(--accent-gradient)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#fff' }}>
              <TagsOutlined style={{ marginRight: '8px' }} />
              {tag ? `# ${tag.name}` : '加载中…'}
            </h1>
            <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>
              共 {total} 篇相关文章
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : posts.length === 0 ? (
          <Card style={{ background: 'var(--card-bg)', border: 'var(--card-border)' }}>
            <Empty description={<span style={{ color: 'var(--muted-text)' }}>该标签下暂无文章</span>} />
          </Card>
        ) : (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Row gutter={[20, 20]}>
              {posts.map(post => (
                <Col xs={24} sm={12} lg={8} key={post.id}>
                  <PostCard post={post} variant="grid" />
                </Col>
              ))}
            </Row>
            </div>
            {total > 0 && (
              <div style={{ marginTop: '24px' }}>
                <PaginationBar
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  onChange={(p, s) => {
                    const next = new URLSearchParams(searchParams)
                    next.set('page', String(p))
                    next.set('size', String(s))
                    setSearchParams(next)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                />
              </div>
            )}
          </>
        )}

        {tag && (
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Tag
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                background: 'var(--accent-start)',
                color: '#fff',
                border: 'none',
              }}
            >
              # {tag.name}
            </Tag>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default TagPosts