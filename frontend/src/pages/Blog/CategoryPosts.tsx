// 分类文章列表 — 复用 BlogList 的视觉,标题区显示当前分类
import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Row, Col, Card, Empty, Spin, Button } from 'antd'
import { ArrowLeftOutlined, FolderOutlined } from '@ant-design/icons'
import AppLayout from '../../components/AppLayout'
import PostCard from '../../components/blog/PostCard'
import PaginationBar from '../../components/blog/PaginationBar'
import { getPosts, type Post } from '../../services/post'
import { getCategories, type Category } from '../../services/category'

function CategoryPosts() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1') || 1
  const pageSize = Number(searchParams.get('size') ?? '9') || 9

  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)

  // 加载分类信息
  useEffect(() => {
    getCategories().then(res => {
      if (res.success && res.data) {
        const cat = res.data.find(c => c.slug === slug)
        setCategory(cat ?? null)
      }
    })
  }, [slug])

  // 加载文章 — page/size 改变时重新拉
  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setLoading(true)
    getPosts({ page, limit: pageSize, categorySlug: slug }).then(res => {
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
          onClick={() => navigate('/categories')}
          style={{ marginBottom: '12px', color: 'var(--secondary-text)' }}
        >
          返回分类索引
        </Button>

        <div
          style={{
            background: 'var(--card-bg)',
            border: 'var(--card-border)',
            borderRadius: '12px',
            padding: '28px 32px',
            marginBottom: '24px',
            backgroundImage: category ? 'var(--accent-gradient)' : undefined,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {category && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
          )}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#fff' }}>
              <FolderOutlined style={{ marginRight: '8px' }} />
              {category ? `分类 / ${category.name}` : '加载中…'}
            </h1>
            <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>
              {category?.description ?? ''} · 共 {total} 篇文章
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : posts.length === 0 ? (
          <Card style={{ background: 'var(--card-bg)', border: 'var(--card-border)' }}>
            <Empty description={<span style={{ color: 'var(--muted-text)' }}>该分类下暂无文章</span>} />
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
          </>
        )}
      </div>
    </AppLayout>
  )
}

export default CategoryPosts