import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Space, Button, Table, Tag, Input, Select, Card, Statistic,
  Row, Col, message, Popconfirm, Tooltip, Empty, Tree, Modal,
} from 'antd'
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, FileTextOutlined, CalendarOutlined,
  FolderOutlined, MinusOutlined, FileAddOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import AppLayout from '../components/AppLayout'
import PaginationBar from '../components/blog/PaginationBar'
import { getPosts, deletePost, Post } from '../services/post'
import { getCategories, createCategory } from '../services/category'
import { getDashboardStats } from '../services/stats'
import apiClient from '../services/apiClient'

const statusColorMap: Record<string, string> = {
  published: 'green',
  draft: 'orange',
}

const statusLabelMap: Record<string, string> = {
  published: '已发布',
  draft: '草稿',
}

function BlogManage() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({ postsCount: 0, draftCount: 0, totalViews: 0 })
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null)
  const [treePosts, setTreePosts] = useState<{ id: number; title: string; categoryId: number | null }[]>([])
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const fetchPosts = useCallback(async (p: number, ps: number = pageSize) => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page: p, limit: ps, orderBy: 'createdAt', order: 'desc' }
      if (statusFilter !== 'all') params.status = statusFilter
      if (search.trim()) params.search = search.trim()
      if (categoryFilter && categoryFilter > 0) params.categoryId = categoryFilter

      let res = await getPosts(params)
      if (res.success && res.data) {
        let filteredPosts = res.data.posts
        let filteredTotal = res.data.pagination.total
        // 未分类筛选：在结果中过滤
        if (categoryFilter === -1) {
          filteredPosts = filteredPosts.filter(p => !p.category)
          filteredTotal = filteredPosts.length
        }
        setPosts(filteredPosts)
        setTotal(filteredTotal)
      }
    } catch (e) {
      console.error('获取文章列表失败:', e)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, categoryFilter, pageSize])

  const fetchStats = useCallback(async () => {
    try {
      // published + draft counts
      const [publishedRes, draftRes, statsRes] = await Promise.all([
        getPosts({ limit: 1, status: 'published' }),
        getPosts({ limit: 1, status: 'draft' }),
        getDashboardStats(),
      ])

      setStats({
        postsCount: publishedRes.data?.pagination.total ?? 0,
        draftCount: draftRes.data?.pagination.total ?? 0,
        totalViews: statsRes.data?.totalViews ?? 0,
      })
    } catch (e) {
      console.error('获取统计数据失败:', e)
    }
  }, [])

  useEffect(() => {
    fetchPosts(1)
  }, [fetchPosts])

  useEffect(() => {
    fetchStats()
    getCategories().then(res => {
      if (res.success && res.data) setCategories(res.data)
    })
    getPosts({ limit: 100, status: '' }).then(res => {
      if (res.success && res.data) {
        setTreePosts(res.data.posts.map(p => ({ id: p.id, title: p.title, categoryId: p.category?.id ?? null })))
      }
    })
  }, [fetchStats])

  const handleSearch = () => {
    setPage(1)
    fetchPosts(1)
  }

  const handleStatusChange = (val: string) => {
    setStatusFilter(val)
    setPage(1)
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await deletePost(id)
      if (res.success) {
        message.success('文章已删除')
        fetchPosts(page)
        fetchStats()
      }
    } catch {
      message.error('删除失败')
    }
  }

  const handlePageChange = (p: number, ps: number = pageSize) => {
    setPage(p)
    setPageSize(ps)
    fetchPosts(p, ps)
  }

  const totalArticles = stats.postsCount + stats.draftCount

  const columns: ColumnsType<Post> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Post) => (
        <Space>
          <FileTextOutlined style={{ color: 'var(--accent-start)', opacity: 0.7 }} />
          <a
            onClick={() => navigate(`/blogs/${record.slug}`)}
            style={{ color: 'var(--text-color)', fontWeight: 500, cursor: 'pointer' }}
          >
            {title}
          </a>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: Post['category']) =>
        category ? (
          <Tag style={{ color: 'var(--tag-color)', background: 'var(--tag-bg)', border: 'none' }}>
            {category.name}
          </Tag>
        ) : (
          <span style={{ color: 'var(--muted-text)', fontSize: '13px' }}>未分类</span>
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => (
        <Tag color={statusColorMap[status] || 'default'} style={{ borderRadius: '4px' }}>
          {statusLabelMap[status] || status}
        </Tag>
      ),
    },
    {
      title: '阅读',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 70,
      align: 'center' as const,
      render: (count: number) => (
        <span style={{ color: 'var(--secondary-text)', fontSize: '14px' }}>{count}</span>
      ),
    },
    {
      title: '日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (date: string) => (
        <Space size={4}>
          <CalendarOutlined style={{ color: 'var(--muted-text)', fontSize: '12px' }} />
          <span style={{ color: 'var(--secondary-text)', fontSize: '13px' }}>
            {dayjs(date).format('MM/DD')}
          </span>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 110,
      render: (_: unknown, record: Post) => (
        <Space size="small">
          <Tooltip title="预览">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/blogs/${record.slug}`)}
              style={{ color: 'var(--secondary-text)' }}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/blog/edit/${record.id}`)}
              style={{ color: 'var(--secondary-text)' }}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除这篇文章？"
            description="删除后不可恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <AppLayout selectedKey="blogs-manage">
      <div style={{
        animation: 'fadeIn 0.35s ease-out both',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 64px - 40px - 48px)',
      }}>
        {/* 顶部标题栏 */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h2 style={{ color: 'var(--text-color)', margin: 0, fontSize: '22px', fontWeight: 700 }}>
            ✏️ 博客管理
          </h2>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="fjj-btn-primary"
              onClick={() => navigate('/blog/create')}
              style={{ height: '40px', borderRadius: '8px', fontWeight: 500 }}
            >
              新建文章
            </Button>
          </Space>
        </div>
        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
          <Col xs={12} sm={6}>
            <Card className="hover-card" style={{ background: 'var(--card-bg)', border: 'var(--card-border)', borderRadius: '12px' }}>
              <Statistic
                title={<span style={{ color: 'var(--secondary-text)' }}>全部文章</span>}
                value={totalArticles}
                valueStyle={{ color: 'var(--accent-start)' }}
                suffix="篇"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="hover-card" style={{ background: 'var(--card-bg)', border: 'var(--card-border)', borderRadius: '12px' }}>
              <Statistic
                title={<span style={{ color: 'var(--secondary-text)' }}>已发布</span>}
                value={stats.postsCount}
                valueStyle={{ color: 'var(--accent-end)' }}
                suffix="篇"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="hover-card" style={{ background: 'var(--card-bg)', border: 'var(--card-border)', borderRadius: '12px' }}>
              <Statistic
                title={<span style={{ color: 'var(--secondary-text)' }}>草稿</span>}
                value={stats.draftCount}
                valueStyle={{ color: '#36d399' }}
                suffix="篇"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="hover-card" style={{ background: 'var(--card-bg)', border: 'var(--card-border)', borderRadius: '12px' }}>
              <Statistic
                title={<span style={{ color: 'var(--secondary-text)' }}>总阅读量</span>}
                value={stats.totalViews}
                valueStyle={{ color: '#f472b6' }}
                suffix="次"
              />
            </Card>
          </Col>
        </Row>

        {/* 目录 + 内容 */}
        <Row gutter={12} style={{ flex: 1 }}>
          {/* 左侧目录树 */}
          <Col xs={24} sm={6} lg={5}>
            <div style={{
              background: 'var(--card-bg)', border: 'var(--card-border)',
              borderRadius: '12px', padding: '14px',
              height: '100%', display: 'flex', flexDirection: 'column',
            }}>
              {/* 目录标题 + 操作按钮 */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '10px',
              }}>
                <span style={{ color: 'var(--text-color)', fontWeight: 600, fontSize: '14px' }}>📂 目录</span>
                <Space size="small">
                  <Tooltip title="新建子目录">
                    <Button type="text" size="small" icon={<PlusOutlined />}
                      onClick={() => { setNewCategoryName(''); setShowAddCategory(true) }}
                      style={{ color: 'var(--accent-start)', width: '22px', height: '22px', fontSize: '12px' }} />
                  </Tooltip>
                  <Tooltip title="删除当前目录">
                    <Button type="text" size="small" icon={<MinusOutlined />}
                      onClick={async () => {
                        if (!categoryFilter) { message.warning('请先选择一个目录'); return }
                        // 检查目录下是否有文章
                        const res = await getPosts({ categoryId: categoryFilter, limit: 1 })
                        const count = res.data?.pagination.total || 0
                        if (count > 0) {
                          Modal.confirm({
                            title: '删除目录',
                            content: `该目录下有 ${count} 篇文章，删除后文章将变为未分类。确定删除？`,
                            okText: '删除', okButtonProps: { danger: true },
                            cancelText: '取消',
                            onOk: async () => {
                              try {
                                await apiClient.delete(`/categories/${categoryFilter}`)
                                setCategories(prev => prev.filter(c => c.id !== categoryFilter))
                                setCategoryFilter(null)
                                setPage(1)
                                message.success('目录已删除')
                              } catch (e) { console.error('删除目录失败:', e); message.error('删除失败') }
                            },
                          })
                        } else {
                          Modal.confirm({
                            title: '删除目录', content: '确定删除此空目录？',
                            okText: '删除', okButtonProps: { danger: true },
                            cancelText: '取消',
                            onOk: async () => {
                              try {
                                await apiClient.delete(`/categories/${categoryFilter}`)
                                setCategories(prev => prev.filter(c => c.id !== categoryFilter))
                                setCategoryFilter(null)
                                setPage(1)
                                message.success('目录已删除')
                              } catch (e) { console.error('删除目录失败:', e); message.error('删除失败') }
                            },
                          })
                        }
                      }}
                      style={{ color: 'var(--muted-text)', width: '22px', height: '22px', fontSize: '12px' }} />
                  </Tooltip>
                  <Tooltip title="在此目录下新建文章">
                    <Button type="text" size="small" icon={<FileAddOutlined />}
                      onClick={() => navigate(categoryFilter ? `/blog/create?cat=${categoryFilter}` : '/blog/create')}
                      style={{ color: 'var(--accent-start)', width: '22px', height: '22px', fontSize: '12px' }} />
                  </Tooltip>
                </Space>
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
              <Tree
                treeData={[
                  {
                    title: <span style={{ color: 'var(--text-color)' }}>全部文章</span>,
                    key: 'all',
                    icon: <FolderOutlined style={{ color: 'var(--accent-start)' }} />,
                    children: [
                      ...categories.map(cat => ({
                        title: <span style={{ color: 'var(--text-color)' }}>{cat.name}</span>,
                        key: String(cat.id),
                        icon: <FolderOutlined style={{ color: '#faad14' }} />,
                        children: treePosts
                          .filter(p => p.categoryId === cat.id)
                          .map(p => ({
                            title: <span style={{ fontSize: '13px', color: 'var(--secondary-text)' }}>{p.title}</span>,
                            key: `post-${p.id}`,
                            icon: <FileTextOutlined style={{ color: 'var(--muted-text)', fontSize: '12px' }} />,
                            isLeaf: true,
                          })),
                      })),
                      ...(treePosts.filter(p => !p.categoryId).length > 0
                        ? [{
                            title: <span style={{ color: 'var(--muted-text)' }}>未分类</span>,
                            key: 'uncategorized',
                            icon: <FolderOutlined style={{ color: 'var(--muted-text)' }} />,
                            children: treePosts
                              .filter(p => !p.categoryId)
                              .map(p => ({
                                title: <span style={{ fontSize: '13px', color: 'var(--secondary-text)' }}>{p.title}</span>,
                                key: `post-${p.id}`,
                                icon: <FileTextOutlined style={{ color: 'var(--muted-text)', fontSize: '12px' }} />,
                                isLeaf: true,
                              })),
                          }]
                        : []),
                    ],
                  },
                ]}
                defaultExpandAll
                showIcon
                selectedKeys={[categoryFilter ? String(categoryFilter) : 'all']}
                onSelect={(keys) => {
                  const key = keys[0] as string
                  if (!key) return
                  if (key === 'all') {
                    setCategoryFilter(null)
                    setPage(1)
                  } else if (key.startsWith('post-')) {
                    navigate(`/blog/edit/${key.replace('post-', '')}`)
                  } else if (key === 'uncategorized') {
                    // 未分类：显示 categoryId 为 null 的文章
                    setCategoryFilter(-1)
                    setPage(1)
                  } else {
                    setCategoryFilter(Number(key))
                    setPage(1)
                  }
                }}
                style={{ background: 'transparent' }}
              />
              </div>
            </div>
          </Col>

          {/* 右侧列表 */}
          <Col xs={24} sm={18} lg={19} style={{ display: 'flex', flexDirection: 'column' }}>
            {/* 搜索 + 筛选栏 */}
            <Card
              style={{
                background: 'var(--card-bg)', border: 'var(--card-border)',
                borderRadius: '12px', marginBottom: '16px',
              }}
              styles={{ body: { padding: '16px 20px' } }}
            >
              <Space wrap size="middle" style={{ width: '100%' }}>
                <Input
                  placeholder="搜索文章标题..."
                  prefix={<SearchOutlined style={{ color: 'var(--accent-start)' }} />}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onPressEnter={handleSearch}
                  style={{
                    width: 220, borderRadius: '20px',
                    background: 'var(--input-bg)', border: 'none',
                    color: 'var(--text-color)',
                  }}
                />
                <Button onClick={handleSearch} type="default" style={{
                  borderRadius: '20px',
                  transition: 'all 0.2s ease',
                }}>
                  搜索
                </Button>
                <Select
                  value={statusFilter}
                  onChange={handleStatusChange}
                  style={{ width: 120 }}
                  options={[
                    { label: '全部状态', value: 'all' },
                    { label: '已发布', value: 'published' },
                    { label: '草稿', value: 'draft' },
                  ]}
                />
                <span style={{ color: 'var(--muted-text)', fontSize: '13px', marginLeft: 'auto' }}>
                  共 {total} 篇
                </span>
              </Space>
            </Card>

            {/* 文章表格 */}
            <Card
              className="hover-card"
              style={{
                background: 'var(--card-bg)', border: 'var(--card-border)',
                borderRadius: '12px', flex: 1,
              }}
              styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column' } }}
            >
              <Table
                columns={columns}
                dataSource={posts}
                rowKey="id"
                loading={loading}
                pagination={false}
                style={{ background: 'transparent', flex: 1 }}
                className="smooth-transition"
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span style={{ color: 'var(--muted-text)' }}>
                      {search || statusFilter !== 'all'
                        ? '没有匹配的文章'
                        : '还没有文章，写第一篇吧！'}
                    </span>
                  }
                >
                  {!search && statusFilter === 'all' && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      className="fjj-btn-primary"
                      onClick={() => navigate('/blog/create')}
                    >
                      新建文章
                    </Button>
                  )}
                </Empty>
              ),
            }}
            onRow={(record) => ({
              style: { cursor: 'pointer', color: 'var(--text-color)' },
              onDoubleClick: () => navigate(`/blog/${record.id}`),
            })}
          />

          {/* 分页栏 — 共用 PaginationBar */}
          <div style={{
            padding: '12px 20px',
            borderTop: 'var(--divider-color)',
          }}>
            <PaginationBar
              current={page}
              pageSize={pageSize}
              total={total}
              pageSizeOptions={[10, 15, 20]}
              onChange={handlePageChange}
            />
          </div>
            </Card>
          </Col>
        </Row>

        {/* 添加分类弹窗 */}
        <Modal
          open={showAddCategory}
          onCancel={() => setShowAddCategory(false)}
          footer={null}
          width={360}
          centered
          destroyOnClose
        >
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <h3 style={{ margin: '0 0 16px', color: 'var(--text-color)', fontSize: '17px', fontWeight: 600 }}>
              📂 添加分类
            </h3>
            <Input
              placeholder="输入分类名称"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onPressEnter={async () => {
                if (!newCategoryName.trim()) return
                try {
                  const res = await createCategory(newCategoryName.trim())
                  if (res.success && res.data) {
                    setCategories(prev => [...prev, res.data!])
                    message.success('分类已创建')
                    setShowAddCategory(false)
                  }
                } catch { message.error('创建失败') }
              }}
              style={{ borderRadius: '8px', marginBottom: '16px' }}
              autoFocus
            />
            <Space style={{ width: '100%', justifyContent: 'center' }}>
              <Button onClick={() => setShowAddCategory(false)}>取消</Button>
              <Button type="primary" className="fjj-btn-primary"
                onClick={async () => {
                  if (!newCategoryName.trim()) return
                  try {
                    const res = await createCategory(newCategoryName.trim())
                    if (res.success && res.data) {
                      setCategories(prev => [...prev, res.data!])
                      message.success('分类已创建')
                      setShowAddCategory(false)
                    }
                  } catch { message.error('创建失败') }
                }}
              >
                确认创建
              </Button>
            </Space>
          </div>
        </Modal>
      </div>
    </AppLayout>
  )
}

export default BlogManage
