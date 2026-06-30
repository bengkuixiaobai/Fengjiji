// 项目展示页 — 整体风格与 BlogList 对齐
import { useEffect, useState, useMemo } from 'react'
import { Row, Col, Card, Input, Empty, Spin, Tag } from 'antd'
import { SearchOutlined, AppstoreOutlined, BarsOutlined, RocketOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import AppLayout from '../../components/AppLayout'
import ProjectCard from '../../components/blog/ProjectCard'
import PaginationBar from '../../components/blog/PaginationBar'
import { getProjects, type Project } from '../../services/project'

type StatusFilter = 'all' | 'planning' | 'in_progress' | 'completed'
type ViewMode = 'grid' | 'list'

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: '全部',
  planning: '规划中',
  in_progress: '进行中',
  completed: '已完成',
}

// 用 CSS 变量跟随主题:深色 = 渐变,浅色 = 单色
const accentGradient = 'var(--btn-primary-bg)'

function ProjectShowcase() {
  const [searchParams, setSearchParams] = useSearchParams()

  const status = (searchParams.get('status') as StatusFilter) ?? 'all'
  const view = (searchParams.get('view') as ViewMode) ?? 'grid'
  const search = searchParams.get('q') ?? ''
  const page = Number(searchParams.get('page') ?? '1') || 1
  const pageSize = Number(searchParams.get('size') ?? '9') || 9

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState(search)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getProjects({ limit: 50 }).then(res => {
      if (cancelled) return
      if (res.success && res.data) setProjects(res.data.projects)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(searchParams)
      if (searchInput) next.set('q', searchInput)
      else next.delete('q')
      next.set('page', '1') // 搜索时回到第一页
      setSearchParams(next, { replace: true })
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(searchParams)
    if (value && value !== 'all') next.set(key, value)
    else next.delete(key)
    if (key !== 'page' && key !== 'size') next.set('page', '1') // 状态/视图切换回到第一页
    setSearchParams(next)
  }

  const filtered = useMemo(() => {
    let result = [...projects]
    if (status !== 'all') {
      result = result.filter(p => p.status === status)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q),
      )
    }
    const order: Record<string, number> = { in_progress: 0, planning: 1, completed: 2 }
    result.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))
    return result
  }, [projects, status, search])

  // 分页后的当前页数据
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: projects.length, planning: 0, in_progress: 0, completed: 0 }
    projects.forEach(p => { c[p.status] += 1 })
    return c
  }, [projects])

  return (
    <AppLayout selectedKey="projects-view">
      {/*
        外层 flex column,占满整个内容区(minHeight 由 AppLayout 提供)
        上半部:标题 + Tab + 搜索栏,自然高度
        下半部:卡片区 flex: 1,撑满剩余
        底部:提示文字沉底
      */}
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
        {/* Hero 区 — 与 BlogList 同款渐变 + coding 符号纹理 + 主题适配蒙层 */}
        <div
          style={{
            background: 'var(--card-bg)',
            border: 'var(--card-border)',
            borderRadius: '12px',
            padding: '40px 32px',
            marginBottom: '24px',
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: 'var(--accent-gradient)',
          }}
        >
          {/* 暗色蒙层保证文字可读 — 与 BlogList 同款 */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
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
              🚀 项目展示
            </h1>
            <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>
              追踪个人项目的开发进度 · 看板式阶段管理
            </p>
          </div>
        </div>

        {/* 状态 Tab — 选中态用 var(--btn-primary-bg) 跟随主题 */}
        <Card
          style={{
            background: 'var(--card-bg)',
            border: 'var(--card-border)',
            borderRadius: '12px',
            marginBottom: '12px',
          }}
          styles={{ body: { padding: '12px 20px' } }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(Object.keys(STATUS_LABELS) as StatusFilter[]).map(s => {
              const active = status === s
              return (
                <Tag
                  key={s}
                  style={{
                    cursor: 'pointer',
                    margin: 0,
                    padding: '4px 14px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    fontWeight: active ? 600 : 400,
                    background: active ? accentGradient : 'var(--tag-bg)',
                    color: active ? '#fff' : 'var(--tag-color)',
                    border: 'none',
                  }}
                  onClick={() => updateParam('status', s)}
                >
                  {STATUS_LABELS[s]} ({counts[s]})
                </Tag>
              )
            })}
          </div>
        </Card>

        {/* 筛选栏 — 搜索 + 视图切换(视图切换同样修复) */}
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
              placeholder="搜索项目名称或描述..."
              prefix={<SearchOutlined style={{ color: 'var(--accent-start)' }} />}
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              allowClear
              style={{ flex: 1, minWidth: 220, borderRadius: '20px' }}
              className="search-input"
            />
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['grid', 'list'] as ViewMode[]).map(v => {
                const active = view === v
                return (
                  <Tag
                    key={v}
                    icon={v === 'grid' ? <AppstoreOutlined /> : <BarsOutlined />}
                    style={{
                      cursor: 'pointer',
                      padding: '4px 12px',
                      margin: 0,
                      fontSize: '13px',
                      borderRadius: '8px',
                      fontWeight: active ? 600 : 400,
                      background: active ? accentGradient : 'var(--tag-bg)',
                      color: active ? '#fff' : 'var(--tag-color)',
                      border: 'none',
                    }}
                    onClick={() => updateParam('view', v)}
                  >
                    {v === 'grid' ? '网格' : '列表'}
                  </Tag>
                )
              })}
            </div>
          </div>
        </Card>

        {/* 项目卡片区 — flex: 1 占满剩余空间 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" />
            </div>
          ) : filtered.length === 0 ? (
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
                    {search || status !== 'all' ? '没有匹配的项目,试试别的筛选条件' : '暂无项目'}
                  </span>
                }
              >
                {(search || status !== 'all') && (
                  <a onClick={() => { setSearchInput(''); setSearchParams(new URLSearchParams()) }}>
                    清除筛选条件
                  </a>
                )}
              </Empty>
            </Card>
          ) : view === 'grid' ? (
            <Row gutter={[20, 20]} style={{ flex: 1 }}>
              {paged.map(p => (
                <Col xs={24} sm={12} lg={8} key={p.id}>
                  <ProjectCard project={p} variant="grid" />
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
              {paged.map(p => (
                <ProjectCard key={p.id} project={p} variant="list" />
              ))}
            </Card>
          )}

        {/* 分页栏 */}
        {!loading && filtered.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <PaginationBar
              current={page}
              pageSize={pageSize}
              total={filtered.length}
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
        </div>

        {/* 底部提示 */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '24px',
            color: 'var(--muted-text)',
            fontSize: '12px',
          }}
        >
          <RocketOutlined /> Stage 3 看板完成后,卡片点击将进入项目详情
        </div>
      </div>
    </AppLayout>
  )
}

export default ProjectShowcase
