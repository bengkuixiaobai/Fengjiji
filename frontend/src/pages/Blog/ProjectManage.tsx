// 项目管理 — Stage 3 看板(与 BlogManage 视觉一致)
import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button, Card, Row, Col, Statistic, Input, Modal, Form, Select, message, Spin,
  Tooltip, Popconfirm, Switch, Space, Progress,
} from 'antd'
import {
  PlusOutlined, SearchOutlined, RocketOutlined, ClockCircleOutlined, CheckCircleOutlined,
  EditOutlined, DeleteOutlined, GithubOutlined, LinkOutlined, DragOutlined,
} from '@ant-design/icons'
import AppLayout from '../../components/AppLayout'
import {
  getProjects, createProject, updateProject, deleteProject,
  type Project, type CreateProjectRequest,
} from '../../services/project'

type Status = 'planning' | 'in_progress' | 'completed'

interface Column {
  key: Status
  title: string
  icon: JSX.Element
  color: string
  description: string
}

const COLUMNS: Column[] = [
  {
    key: 'planning',
    title: '规划中',
    icon: <ClockCircleOutlined />,
    color: '#faad14',
    description: '已构思,等待启动',
  },
  {
    key: 'in_progress',
    title: '进行中',
    icon: <RocketOutlined />,
    color: 'var(--accent-start)',
    description: '正在开发与迭代',
  },
  {
    key: 'completed',
    title: '已完成',
    icon: <CheckCircleOutlined />,
    color: '#36d399',
    description: '已上线或封版',
  },
]

function ProjectManage() {
  const navigate = useNavigate()
  // ===== 状态 =====
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')

  // 编辑/创建弹窗
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<CreateProjectRequest>()

  // 拖拽
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragOverCol, setDragOverCol] = useState<Status | null>(null)

  // ===== 拉取数据 =====
  const load = async () => {
    setLoading(true)
    try {
      const res = await getProjects({ limit: 100, isPublic: undefined as any })
      if (res.success && res.data) setProjects(res.data.projects)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ===== 搜索(按下回车触发) =====
  const handleSearch = () => setSearch(searchInput)

  // ===== 过滤 + 分组 =====
  const filtered = useMemo(() => {
    let result = [...projects]
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.techStack.some(t => t.toLowerCase().includes(q)),
      )
    }
    return result
  }, [projects, search, statusFilter])

  const grouped = useMemo(() => {
    const map: Record<Status, Project[]> = { planning: [], in_progress: [], completed: [] }
    filtered.forEach(p => map[p.status].push(p))
    return map
  }, [filtered])

  const counts = useMemo(() => {
    const c = { planning: 0, in_progress: 0, completed: 0, total: projects.length }
    projects.forEach(p => { c[p.status] += 1 })
    return c
  }, [projects])

  // ===== 弹窗 =====
  const openEdit = (p: Project) => {
    setEditing(p)
    form.setFieldsValue({
      name: p.name,
      description: p.description,
      techStack: p.techStack,
      codeUrl: p.codeUrl,
      demoUrl: p.demoUrl,
      status: p.status,
      isPublic: p.isPublic,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const techStackRaw: unknown = values.techStack
      const techStack = typeof techStackRaw === 'string'
        ? (techStackRaw as string).split(/[,，\s]+/).filter(Boolean)
        : (techStackRaw as string[] | undefined) ?? []
      const payload: CreateProjectRequest = { ...values, techStack }
      const res = editing
        ? await updateProject(editing.id, payload)
        : await createProject(payload)
      if (res.success) {
        message.success(editing ? '项目已更新' : '项目已创建')
        setModalOpen(false)
        load()
      }
    } catch (e: any) {
      if (e?.errorFields) return
      message.error(e?.message || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (p: Project) => {
    const res = await deleteProject(p.id)
    if (res.success) {
      message.success('项目已删除')
      load()
    } else {
      message.error('删除失败')
    }
  }

  // ===== 拖拽 =====
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragEnd = () => { setDraggingId(null); setDragOverCol(null) }
  const handleDragOver = (e: React.DragEvent, col: Status) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(col)
  }
  const handleDrop = async (e: React.DragEvent, col: Status) => {
    e.preventDefault()
    setDragOverCol(null)
    if (draggingId == null) return
    const p = projects.find(x => x.id === draggingId)
    if (!p || p.status === col) { setDraggingId(null); return }
    setProjects(prev => prev.map(x => x.id === draggingId ? { ...x, status: col } : x))
    setDraggingId(null)
    const res = await updateProject(p.id, { status: col })
    if (!res.success) {
      message.error('状态更新失败')
      load()
    } else {
      message.success(`已移至 ${COLUMNS.find(c => c.key === col)?.title}`)
    }
  }

  return (
    <AppLayout selectedKey="projects-manage">
      <div style={{
        animation: 'fadeIn 0.35s ease-out both',
        display: 'flex', flexDirection: 'column',
        minHeight: 'calc(100vh - 64px - 40px - 48px)',
      }}>
        {/* 顶部标题栏 — 与 BlogManage 一致 */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '20px',
        }}>
          <h2 style={{ color: 'var(--text-color)', margin: 0, fontSize: '22px', fontWeight: 700 }}>
            🛠️ 项目管理
          </h2>
          <Space>
            <Button
              type="primary" icon={<PlusOutlined />} className="fjj-btn-primary"
              onClick={() => navigate('/projects/new')}
              style={{ height: '40px', borderRadius: '8px', fontWeight: 500 }}
            >
              新建项目
            </Button>
          </Space>
        </div>

        {/* 统计卡片 — 4 张 Ant Statistic,风格与 BlogManage 一致 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
          <Col xs={12} sm={6}>
            <Card className="hover-card" style={{ background: 'var(--card-bg)', border: 'var(--card-border)', borderRadius: '12px' }}>
              <Statistic
                title={<span style={{ color: 'var(--secondary-text)' }}>全部项目</span>}
                value={counts.total}
                valueStyle={{ color: 'var(--accent-start)' }}
                suffix="个"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="hover-card" style={{ background: 'var(--card-bg)', border: 'var(--card-border)', borderRadius: '12px' }}>
              <Statistic
                title={<span style={{ color: 'var(--secondary-text)' }}>规划中</span>}
                value={counts.planning}
                valueStyle={{ color: '#faad14' }}
                suffix="个"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="hover-card" style={{ background: 'var(--card-bg)', border: 'var(--card-border)', borderRadius: '12px' }}>
              <Statistic
                title={<span style={{ color: 'var(--secondary-text)' }}>进行中</span>}
                value={counts.in_progress}
                valueStyle={{ color: 'var(--accent-end)' }}
                suffix="个"
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="hover-card" style={{ background: 'var(--card-bg)', border: 'var(--card-border)', borderRadius: '12px' }}>
              <Statistic
                title={<span style={{ color: 'var(--secondary-text)' }}>已完成</span>}
                value={counts.completed}
                valueStyle={{ color: '#36d399' }}
                suffix="个"
              />
            </Card>
          </Col>
        </Row>

        {/* 搜索 + 状态筛选 — 风格与 BlogManage 一致 */}
        <Card
          style={{
            background: 'var(--card-bg)', border: 'var(--card-border)',
            borderRadius: '12px', marginBottom: '16px',
          }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <Space wrap size="middle" style={{ width: '100%' }}>
            <Input
              placeholder="搜索项目名称、描述或技术栈..."
              prefix={<SearchOutlined style={{ color: 'var(--accent-start)' }} />}
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onPressEnter={handleSearch}
              style={{
                width: 260, borderRadius: '20px',
                background: 'var(--input-bg)', border: 'none',
                color: 'var(--text-color)',
              }}
            />
            <Button onClick={handleSearch} type="default" style={{ borderRadius: '20px' }}>搜索</Button>
            <Select
              value={statusFilter}
              onChange={v => setStatusFilter(v)}
              style={{ minWidth: 120 }}
              options={[
                { value: 'all', label: '全部状态' },
                ...COLUMNS.map(c => ({ value: c.key, label: c.title })),
              ]}
            />
            <span style={{ color: 'var(--muted-text)', fontSize: 13, marginLeft: 'auto' }}>
              💡 提示:拖拽卡片可改变项目状态
            </span>
          </Space>
        </Card>

        {/* 看板三列 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Spin size="large" />
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Row gutter={12} style={{ flex: 1 }}>
              {COLUMNS.map(col => (
                <Col xs={24} md={8} key={col.key}>
                  <KanbanColumn
                    column={col}
                    projects={grouped[col.key]}
                    isDragOver={dragOverCol === col.key}
                    onDragOver={e => handleDragOver(e, col.key)}
                    onDragLeave={() => setDragOverCol(null)}
                    onDrop={e => handleDrop(e, col.key)}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    draggingId={draggingId}
                  />
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* 创建/编辑弹窗 */}
        <Modal
          open={modalOpen}
          title={editing ? '编辑项目' : '新建项目'}
          onCancel={() => setModalOpen(false)}
          onOk={handleSubmit}
          confirmLoading={submitting}
          okText={editing ? '保存' : '创建'}
          cancelText="取消"
          width={560}
          destroyOnClose
          centered
        >
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="name" label="项目名称"
              rules={[{ required: true, message: '请输入项目名称' }]}
            >
              <Input placeholder="例如:博客评论系统" maxLength={50} showCount />
            </Form.Item>
            <Form.Item name="description" label="项目描述">
              <Input.TextArea placeholder="简要描述项目目标与核心功能" rows={3} maxLength={200} showCount />
            </Form.Item>
            <Form.Item name="techStack" label="技术栈">
              <Input placeholder="React, TypeScript, Node.js(逗号或空格分隔)" />
            </Form.Item>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="codeUrl" label="源码地址">
                <Input placeholder="https://github.com/..." />
              </Form.Item>
              <Form.Item name="demoUrl" label="演示地址">
                <Input placeholder="https://..." />
              </Form.Item>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select options={COLUMNS.map(c => ({ value: c.key, label: c.title }))} />
              </Form.Item>
              <Form.Item name="isPublic" label="公开" valuePropName="checked">
                <Switch checkedChildren="公开" unCheckedChildren="私有" />
              </Form.Item>
            </div>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  )
}

// ===== 看板列 =====
function KanbanColumn({
  column, projects, isDragOver,
  onDragOver, onDragLeave, onDrop,
  onEdit, onDelete, onDragStart, onDragEnd, draggingId,
}: {
  column: Column
  projects: Project[]
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onEdit: (p: Project) => void
  onDelete: (p: Project) => void
  onDragStart: (e: React.DragEvent, id: number) => void
  onDragEnd: () => void
  draggingId: number | null
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        background: 'var(--card-bg)',
        border: 'var(--card-border)',
        borderRadius: '12px',
        padding: '12px',
        minHeight: 400,
        height: '100%',
        transition: 'all 0.2s ease',
        outline: isDragOver ? `2px dashed ${column.color}` : 'none',
        outlineOffset: -2,
      }}
    >
      {/* 列头 — 与 BlogManage 风格一致 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        paddingBottom: 10,
        borderBottom: 'var(--divider-color)',
        marginBottom: 12,
      }}>
        <span style={{
          color: column.color, fontSize: 16,
        }}>{column.icon}</span>
        <span style={{ color: 'var(--text-color)', fontSize: 14, fontWeight: 600 }}>
          {column.title}
        </span>
        <span style={{
          padding: '0 8px',
          background: 'var(--segmented-bg)',
          color: 'var(--secondary-text)',
          borderRadius: 10,
          fontSize: 11, fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
        }}>{projects.length}</span>
        <span style={{
          marginLeft: 'auto',
          color: 'var(--muted-text)',
          fontSize: 11,
        }}>{column.description}</span>
      </div>

      {/* 卡片列表 */}
      {projects.length === 0 ? (
        <div style={{
          padding: '40px 12px',
          textAlign: 'center',
          color: 'var(--muted-text)',
          fontSize: 12,
        }}>
          <div style={{ fontSize: 24, marginBottom: 6, opacity: 0.4 }}>📭</div>
          暂无项目
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {projects.map(p => (
            <KanbanCard
              key={p.id}
              project={p}
              isDragging={draggingId === p.id}
              onEdit={onEdit}
              onDelete={onDelete}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ===== 看板卡片(风格与 BlogManage 表格行一致) =====
function KanbanCard({
  project, isDragging, onEdit, onDelete, onDragStart, onDragEnd,
}: {
  project: Project
  isDragging: boolean
  onEdit: (p: Project) => void
  onDelete: (p: Project) => void
  onDragStart: (e: React.DragEvent, id: number) => void
  onDragEnd: () => void
}) {
  const navigate = useNavigate()
  const goDetail = () => navigate(`/projects/${project.id}`)
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, project.id)}
      onDragEnd={onDragEnd}
      onClick={goDetail}
      className="hover-card"
      style={{
        padding: '12px 14px',
        background: 'var(--card-bg)',
        border: 'var(--card-border)',
        borderRadius: '8px',
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        transition: 'all 0.25s ease',
      }}
    >
      {/* 头部:名称 + 拖拽手柄 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 8 }}>
        <div style={{
          color: 'var(--text-color)',
          fontSize: 14, fontWeight: 500,
          lineHeight: 1.4, flex: 1,
        }}>{project.name}</div>
        <DragOutlined style={{
          color: 'var(--muted-text)',
          fontSize: 12,
          cursor: 'grab',
          flexShrink: 0,
          marginTop: 2,
        }} />
      </div>

      {/* 描述 */}
      {project.description && (
        <div style={{
          color: 'var(--muted-text)',
          fontSize: 12, lineHeight: 1.5,
          marginBottom: 10,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>{project.description}</div>
      )}

      {/* 技术栈 */}
      {project.techStack.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
          {project.techStack.slice(0, 3).map(t => (
            <span key={t} style={{
              padding: '0 6px',
              background: 'var(--tag-bg)',
              color: 'var(--tag-color)',
              fontSize: 11,
              borderRadius: '4px',
              lineHeight: '20px',
            }}>{t}</span>
          ))}
          {project.techStack.length > 3 && (
            <span style={{
              color: 'var(--muted-text)',
              fontSize: 11,
              alignSelf: 'center',
            }}>+{project.techStack.length - 3}</span>
          )}
        </div>
      )}

      {/* 进度条 — 与 BlogManage 风格一致 */}
      <Progress
        percent={project.completionRate}
        size="small"
        strokeColor={{ '0%': 'var(--accent-start)', '100%': 'var(--accent-end)' }}
        format={p => <span style={{ color: 'var(--secondary-text)', fontSize: 11 }}>{p}%</span>}
      />

      {/* 底部:链接 + 操作 — 与 BlogManage 表格行风格一致 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 4,
      }}>
        <Space size={4}>
          {project.codeUrl && (
            <Tooltip title="查看源码">
              <Button
                type="text" size="small" icon={<GithubOutlined />}
                onClick={e => { e.stopPropagation(); window.open(project.codeUrl, '_blank') }}
                style={{ color: 'var(--secondary-text)' }}
              />
            </Tooltip>
          )}
          {project.demoUrl && (
            <Tooltip title="查看演示">
              <Button
                type="text" size="small" icon={<LinkOutlined />}
                onClick={e => { e.stopPropagation(); window.open(project.demoUrl, '_blank') }}
                style={{ color: 'var(--secondary-text)' }}
              />
            </Tooltip>
          )}
        </Space>
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text" size="small" icon={<EditOutlined />}
              onClick={e => { e.stopPropagation(); onEdit(project) }}
              style={{ color: 'var(--secondary-text)' }}
            />
          </Tooltip>
          <Popconfirm
            title="删除项目"
            description={`确定删除「${project.name}」?`}
            onConfirm={e => { e?.stopPropagation(); onDelete(project) }}
            onCancel={e => e?.stopPropagation()}
            okType="danger" okText="删除" cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text" size="small" danger icon={<DeleteOutlined />}
                onClick={e => e.stopPropagation()}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      </div>
    </div>
  )
}

export default ProjectManage