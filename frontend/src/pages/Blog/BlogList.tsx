// 博客列表页 — 网格视图 + 筛选 + 分页
import { useEffect, useState, useMemo } from 'react'
import { Row, Col, Card, Input, Empty, Spin, Select, Tag } from 'antd'
import { SearchOutlined, AppstoreOutlined, BarsOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import PostCard from '../../components/blog/PostCard'
import PaginationBar from '../../components/blog/PaginationBar'
import { getPosts, type Post } from '../../services/post'
import { getCategories, type Category } from '../../services/category'

function BlogList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // 从 URL 同步状态
  const page = Number(searchParams.get('page') ?? '1') || 1
  const pageSize = Number(searchParams.get('size') ?? '9') || 9
  const search = searchParams.get('q') ?? ''
  const categorySlug = searchParams.get('category') ?? ''
  const view = (searchParams.get('view') as 'grid' | 'list') ?? 'grid'

  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState(search)

  // 同步本地搜索框到 URL(去抖)
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(searchParams)
      if (searchInput) next.set('q', searchInput)
      else next.delete('q')
      next.set('page', '1')
      setSearchParams(next, { replace: true })
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  // 拉取分类
  useEffect(() => {
    getCategories().then(res => {
      if (res.success && res.data) setCategories(res.data)
    })
  }, [])

  // 拉取文章
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getPosts({
      page,
      limit: pageSize,
      categorySlug: categorySlug || undefined,
      search: search || undefined,
    }).then(res => {
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
  }, [page, categorySlug, search, pageSize])

  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.set('page', '1')
    setSearchParams(next)
  }

  const heroTagline = useMemo(() => {
    if (categorySlug) {
      const cat = categories.find(c => c.slug === categorySlug)
      return cat ? `分类 / ${cat.name}` : '分类'
    }
    return '记录技术思考 · 分享项目经验 · 沉淀个人知识'
  }, [categorySlug, categories])

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
        {/* Hero 区 */}
        <div
          style={{
            background: 'var(--card-bg)',
            border: 'var(--card-border)',
            borderRadius: '12px',
            padding: '36px 32px',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: 'var(--accent-gradient)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.25)',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1
              style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 700,
                color: '#fff',
                letterSpacing: '0.5px',
              }}
            >
              📚 风迹集 · 博客
            </h1>
            <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>
              {heroTagline}
            </p>
          </div>
        </div>

        {/* 筛选栏 */}
        <Card
          style={{
            background: 'var(--card-bg)',
            border: 'var(--card-border)',
            borderRadius: '12px',
            marginBottom: '20px',
          }}
          styles={{ body: { padding: '14px 20px' } }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Input
              placeholder="搜索文章标题或摘要..."
              prefix={<SearchOutlined style={{ color: 'var(--accent-start)' }} />}
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              allowClear
              style={{ flex: 1, minWidth: 220, borderRadius: '20px' }}
              className="search-input"
            />
            <Select
              placeholder="全部分类"
              allowClear
              value={categorySlug || undefined}
              onChange={v => updateParam('category', v)}
              style={{ minWidth: 140 }}
              options={categories.map(c => ({ label: c.name, value: c.slug }))}
            />
            <div style={{ display: 'flex', gap: '4px' }}>
              <Tag
                color={view === 'grid' ? 'var(--accent-start)' : undefined}
                icon={<AppstoreOutlined />}
                style={{ cursor: 'pointer', padding: '4px 10px' }}
                onClick={() => updateParam('view', 'grid')}
              >
                网格
              </Tag>
              <Tag
                color={view === 'list' ? 'var(--accent-start)' : undefined}
                icon={<BarsOutlined />}
                style={{ cursor: 'pointer', padding: '4px 10px' }}
                onClick={() => updateParam('view', 'list')}
              >
                列表
              </Tag>
            </div>
          </div>
        </Card>

        {/* 文章列表 — flex: 1 让分页栏在内容不足时沉底 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : posts.length === 0 ? (
          <Card
            style={{
              background: 'var(--card-bg)',
              border: 'var(--card-border)',
              borderRadius: '12px',
            }}
          >
            <Empty
              description={
                <span style={{ color: 'var(--muted-text)' }}>
                  {search || categorySlug ? '没有匹配的文章,试试别的关键词吧' : '暂无文章'}
                </span>
              }
            >
              {(search || categorySlug) && (
                <a onClick={() => { setSearchInput(''); setSearchParams(new URLSearchParams()) }}>
                  清除筛选条件
                </a>
              )}
            </Empty>
          </Card>
        ) : view === 'grid' ? (
          <Row gutter={[20, 20]}>
            {posts.map(post => (
              <Col xs={24} sm={12} lg={8} key={post.id}>
                <PostCard post={post} variant="grid" />
              </Col>
            ))}
          </Row>
        ) : (
          <Card
            style={{
              background: 'var(--card-bg)',
              border: 'var(--card-border)',
              borderRadius: '12px',
              padding: 0,
            }}
            styles={{ body: { padding: 0 } }}
          >
            {posts.map(post => (
              <PostCard key={post.id} post={post} variant="list" />
            ))}
          </Card>
        )}
        </div>

        {/* 分页栏 */}
        {!loading && total > 0 && (
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

        {/* 快捷入口 */}
        <Card
          style={{
            background: 'var(--card-bg)',
            border: 'var(--card-border)',
            borderRadius: '12px',
            marginTop: '32px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Tag style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '13px' }} onClick={() => navigate('/categories')}>📂 浏览分类</Tag>
            <Tag style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '13px' }} onClick={() => navigate('/tags')}>🏷️ 标签云</Tag>
            <Tag style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '13px' }} onClick={() => navigate('/archive')}>📅 时间归档</Tag>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}

export default BlogList
