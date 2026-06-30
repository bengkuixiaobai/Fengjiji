// 新建项目页面 — 双栏布局,左侧主表单 + 右侧元信息/预览
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Row, Col, Form, Input, Button, Select, Switch, message, Space,
  InputNumber, Tag, DatePicker,
} from 'antd'
import {
  CheckCircleOutlined, ArrowLeftOutlined, GithubOutlined, LinkOutlined,
  RocketOutlined, ClockCircleOutlined, CheckCircleOutlined as DoneIcon,
  BookOutlined, GlobalOutlined, EyeOutlined,
  FileTextOutlined, TagsOutlined, StarOutlined, CalendarOutlined,
  DeleteOutlined, PlusOutlined,
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import AppLayout from '../components/AppLayout'
import { createProject, type CreateProjectRequest } from '../services/project'

const { TextArea } = Input

// 从 GitHub URL 解析 owner/repo
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.hostname !== 'github.com' && u.hostname !== 'www.github.com') return null
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length < 2) return null
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') }
  } catch {
    return null
  }
}

interface ProjectFormValues {
  name: string
  description: string
  planItems?: Array<{ what: string; time?: string; weight?: number }>
  techStack?: string[]
  codeUrl?: string
  demoUrl?: string
  status: 'planning' | 'in_progress' | 'completed'
  isPublic: boolean
  completionRate: number
  startDate?: Dayjs
  expectedEndDate?: Dayjs
  bufferDays?: number
}

function ProjectCreate() {
  const navigate = useNavigate()
  const [form] = Form.useForm<ProjectFormValues>()
  const [submitting, setSubmitting] = useState(false)
  const [techStacks, setTechStacks] = useState<string[]>([])
  // 项目计划项 — 一项一项保存
  const [planItems, setPlanItems] = useState<Array<{ what: string; time?: string; weight?: number }>>([])
  // 新任务输入
  const [newTask, setNewTask] = useState({ what: '', time: '', weight: 0 })
  // 输入表单是否展开(默认折叠,只显示"添加任务"按钮)
  const [showAddForm, setShowAddForm] = useState(false)
  const [techInput, setTechInput] = useState('')

  // 监听表单字段
  const codeUrl = Form.useWatch('codeUrl', form) || ''
  const status = Form.useWatch('status', form) || 'planning'
  const isPublic = Form.useWatch('isPublic', form) ?? true
  const startDate = Form.useWatch('startDate', form)

  // GitHub 仓库信息
  const gh = parseGitHubUrl(codeUrl)

  // 添加一条计划任务
  const handleAddTask = () => {
    if (!newTask.what.trim()) {
      message.warning('请填写"做什么"')
      return
    }
    setPlanItems([
      ...planItems,
      {
        what: newTask.what.trim(),
        time: newTask.time.trim() || undefined,
        weight: newTask.weight || undefined,
      },
    ])
    setNewTask({ what: '', time: '', weight: 0 })
    setShowAddForm(false)
    message.success('已添加任务')
  }

  // 取消添加(折叠并清空输入)
  const handleCancelAdd = () => {
    setNewTask({ what: '', time: '', weight: 0 })
    setShowAddForm(false)
  }

  // 打开添加表单
  const openAddForm = () => {
    setNewTask({ what: '', time: '', weight: 0 })
    setShowAddForm(true)
  }

  // ===== 操作 =====
  const handleSubmit = async (nextStatus?: 'planning' | 'in_progress' | 'completed') => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      // 拼接描述 — 不再把计划塞进 description,计划单独存到 plan 字段
      const finalDescription = values.description.trim()

      const finalStatus = nextStatus || values.status
      const payload: CreateProjectRequest = {
        name: values.name,
        description: finalDescription,
        techStack: techStacks,
        codeUrl: values.codeUrl || undefined,
        demoUrl: values.demoUrl || undefined,
        status: finalStatus,
        isPublic: values.isPublic,
        startDate: values.startDate?.toISOString(),
        expectedEndDate: values.expectedEndDate?.toISOString(),
        bufferDays: values.bufferDays,
        plan: planItems.length > 0 ? planItems : undefined,
      }
      const res = await createProject(payload)
      if (res.success) {
        message.success('项目已创建')
        navigate('/projects/manage')
      } else {
        message.error('创建失败')
      }
    } catch (e: any) {
      if (e?.errorFields) {
        message.warning('请检查表单填写')
        return
      }
      message.error(e?.message || '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 技术栈增删
  const addTech = () => {
    const t = techInput.trim()
    if (t && !techStacks.includes(t)) {
      setTechStacks([...techStacks, t])
    }
    setTechInput('')
  }
  const removeTech = (t: string) => setTechStacks(techStacks.filter(x => x !== t))

  // 状态配置
  const statusOptions = [
    { value: 'planning', label: '规划中', color: '#faad14', icon: <ClockCircleOutlined /> },
    { value: 'in_progress', label: '进行中', color: 'var(--accent-start)', icon: <RocketOutlined /> },
    { value: 'completed', label: '已完成', color: '#36d399', icon: <DoneIcon /> },
  ]
  const currentStatus = statusOptions.find(s => s.value === status) || statusOptions[0]

  return (
    <AppLayout selectedKey="projects-manage">
      <div style={{
        animation: 'fadeIn 0.4s ease-out both',
        maxWidth: 1280, margin: '0 auto',
      }}>
        {/* ===== 顶部操作栏 ===== */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '8px 12px',
          marginBottom: '20px',
          background: 'var(--card-bg)',
          border: 'var(--card-border)',
          borderRadius: '12px',
          backdropFilter: 'blur(20px)',
          boxShadow: 'var(--shadow-sm)',
          gap: '10px',
        }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/projects/manage')}
            className="fjj-btn-text"
            style={{
              color: 'var(--secondary-text)',
              width: 34, height: 34, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 4 }}>
            <span style={{
              fontSize: 26, lineHeight: 1,
              filter: 'drop-shadow(0 2px 6px rgba(102, 126, 234, 0.3))',
            }}>📁</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <h2 style={{
                margin: 0, color: 'var(--text-color)',
                fontSize: 17, fontWeight: 800,
                letterSpacing: '-0.2px', lineHeight: 1,
              }}>新建项目</h2>
              <span style={{
                color: 'var(--accent-start)',
                fontSize: 11, fontWeight: 500,
                letterSpacing: '0.3px', lineHeight: 1,
                fontStyle: 'italic',
              }}>记录项目灵感 · 制定开发计划 · 链接代码仓库</span>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <Button
            onClick={() => handleSubmit('planning')}
            loading={submitting}
            className="fjj-btn-default"
            style={{
              borderRadius: 8, height: 34, padding: '0 16px',
              background: 'transparent',
              border: '1px solid var(--input-border)',
              color: 'var(--secondary-text)',
              fontWeight: 500,
            }}
          >
            保存草稿
          </Button>
          <Button
            type="primary" icon={<CheckCircleOutlined />}
            className="fjj-btn-primary"
            onClick={() => handleSubmit('in_progress')}
            loading={submitting}
            style={{ borderRadius: 8, height: 34, padding: '0 18px', fontWeight: 600 }}
          >
            创建项目
          </Button>
        </div>

        {/* ===== 主体两栏布局 ===== */}
        <Row gutter={16}>
          {/* 左侧:表单 */}
          <Col xs={24} lg={16}>
            <Form
              form={form}
              layout="vertical"
              initialValues={{ status: 'planning', isPublic: true, completionRate: 0 }}
              requiredMark="optional"
            >
              {/* Card 1: 基本信息 */}
              <FormSection icon={<FileTextOutlined />} title="基本信息" subtitle="项目的核心信息">
                <Form.Item
                  name="name" label="项目标题"
                  rules={[
                    { required: true, message: '请输入项目标题' },
                    { max: 50, message: '标题不能超过 50 字' },
                  ]}
                >
                  <Input
                    placeholder="给项目起个名字,例如:博客评论系统"
                    size="large"
                    maxLength={50}
                    showCount
                    style={{ borderRadius: 8, fontSize: 16, fontWeight: 500 }}
                  />
                </Form.Item>
                <Form.Item
                  name="description" label="项目描述"
                  rules={[
                    { required: true, message: '请输入项目描述' },
                    { max: 200, message: '描述不能超过 200 字' },
                  ]}
                >
                  <TextArea
                    placeholder="一句话说清楚项目要做什么,目标用户是谁"
                    rows={3}
                    maxLength={200}
                    showCount
                    style={{ borderRadius: 8, lineHeight: 1.6 }}
                  />
                </Form.Item>
              </FormSection>

              {/* Card 2: 项目计划 — 表格样式 + 行下方按钮 */}
              <FormSection
                icon={<BookOutlined />}
                title="项目计划"
                subtitle="逐项添加,表格中每行展示一项;下方按钮可添加 / 清空当前输入"
                tag="选填"
              >
                {/* 已保存的任务列表 — 表格样式(类似 BlogManage) */}
                {planItems.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{
                      color: 'var(--muted-text)', fontSize: 12, fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: 6,
                      letterSpacing: '0.3px', marginBottom: 8,
                    }}>
                      <CheckCircleOutlined style={{ color: '#10b981', fontSize: 12 }} />
                      已添加 {planItems.length} 项任务
                    </div>
                    {/* 表头 */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '50px 1fr 120px 70px',
                      padding: '8px 12px',
                      background: 'var(--segmented-bg)',
                      border: '1px solid var(--input-border)',
                      borderRadius: '8px 8px 0 0',
                      borderBottom: 'none',
                      color: 'var(--muted-text)',
                      fontSize: 11, fontWeight: 600,
                      letterSpacing: '0.3px',
                    }}>
                      <span>#</span>
                      <span>任务</span>
                      <span>预计时间</span>
                      <span style={{ textAlign: 'center' }}>操作</span>
                    </div>
                    {/* 数据行 */}
                    <div style={{
                      border: '1px solid var(--input-border)',
                      borderTop: 'none',
                      borderRadius: '0 0 8px 8px',
                      overflow: 'hidden',
                    }}>
                      {planItems.map((item, i) => (
                        <div
                          key={i}
                          className="hover-list-item"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '50px 1fr 120px 70px',
                            padding: '10px 12px',
                            borderBottom: i < planItems.length - 1
                              ? '1px solid var(--divider-color)' : 'none',
                            alignItems: 'center',
                            fontSize: 13,
                            animation: 'planItemAdd 0.3s ease-out',
                          }}
                        >
                          <span style={{
                            color: 'var(--accent-start)',
                            fontWeight: 700, fontSize: 12,
                          }}>{i + 1}</span>
                          <span style={{
                            color: 'var(--text-color)',
                            fontWeight: 500,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>{item.what}</span>
                          <span style={{
                            color: item.time ? 'var(--secondary-text)' : 'var(--muted-text)',
                            fontSize: 12,
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}>
                            {item.time && <ClockCircleOutlined style={{ fontSize: 11 }} />}
                            {item.time || '—'}
                          </span>
                          <span style={{ textAlign: 'center' }}>
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => setPlanItems(planItems.filter((_, idx) => idx !== i))}
                            />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 折叠态:添加任务按钮 */}
                {!showAddForm && (
                  <Button
                    type="dashed"
                    onClick={openAddForm}
                    icon={<PlusOutlined />}
                    block
                    style={{
                      height: 42, borderRadius: 8,
                      borderStyle: 'dashed',
                      borderColor: 'var(--input-border)',
                      color: 'var(--secondary-text)',
                      fontWeight: 500,
                      fontSize: 13,
                    }}
                  >
                    {planItems.length === 0 ? '添加任务' : `继续添加第 ${planItems.length + 1} 项`}
                  </Button>
                )}

                {/* 展开态:输入表单 */}
                {showAddForm && (
                  <div style={{
                    padding: 14,
                    background: 'var(--segmented-bg)',
                    border: '1px solid var(--input-border)',
                    borderRadius: 10,
                    animation: 'planItemAdd 0.25s ease-out',
                  }}>
                    <div style={{
                      color: 'var(--accent-start)', fontSize: 12, fontWeight: 600,
                      marginBottom: 10,
                      display: 'flex', alignItems: 'center', gap: 6,
                      letterSpacing: '0.3px',
                    }}>
                      <PlusOutlined />
                      添加第 {planItems.length + 1} 项任务
                    </div>
                    <Input
                      placeholder="做什么 — 这个任务要完成什么?"
                      value={newTask.what}
                      onChange={e => setNewTask({ ...newTask, what: e.target.value })}
                      onPressEnter={handleAddTask}
                      autoFocus
                      style={{ borderRadius: 6, marginBottom: 8 }}
                      maxLength={80}
                    />
                    <Input
                      placeholder="预期时间(如 3 天) — 可选"
                      prefix={<ClockCircleOutlined style={{ color: 'var(--muted-text)' }} />}
                      value={newTask.time}
                      onChange={e => setNewTask({ ...newTask, time: e.target.value })}
                      onPressEnter={handleAddTask}
                      style={{ borderRadius: 6, marginBottom: 8 }}
                      maxLength={20}
                    />
                    {/* 权重输入 */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      marginBottom: 12,
                      padding: '8px 10px',
                      background: 'var(--card-bg)',
                      borderRadius: 6,
                      border: '1px solid var(--input-border)',
                    }}>
                      <span style={{
                        color: 'var(--muted-text)', fontSize: 12,
                        fontWeight: 500, flexShrink: 0,
                      }}>权重</span>
                      <InputNumber
                        min={0} max={100}
                        value={newTask.weight ?? 0}
                        onChange={v => setNewTask({ ...newTask, weight: v ?? 0 })}
                        style={{ flex: 1, borderRadius: 4 }}
                        size="small"
                      />
                      <span style={{ color: 'var(--muted-text)', fontSize: 12 }}>%</span>
                      <span style={{
                        color: 'var(--accent-start)', fontSize: 10,
                        fontWeight: 600,
                        padding: '2px 8px',
                        background: 'rgba(102, 126, 234, 0.1)',
                        borderRadius: 4,
                        flexShrink: 0,
                      }}>影响完成度</span>
                    </div>
                    {/* 行下方按钮 — 添加 / 取消 */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        className="fjj-btn-primary"
                        onClick={handleAddTask}
                        disabled={!newTask.what.trim()}
                        style={{ flex: 1, height: 36, borderRadius: 8, fontWeight: 600 }}
                      >
                        添加
                      </Button>
                      <Button
                        onClick={handleCancelAdd}
                        style={{ height: 36, borderRadius: 8, minWidth: 90 }}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                )}
              </FormSection>

              {/* Card 3: 技术栈 */}
              <FormSection
                icon={<TagsOutlined />}
                title="技术栈"
                subtitle="项目使用的关键技术和框架"
                tag="选填"
              >
                <div style={{
                  padding: '8px 12px',
                  background: 'var(--segmented-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: 8,
                  minHeight: 50,
                }}>
                  <Space wrap size={[6, 6]}>
                    {techStacks.map(t => (
                      <Tag key={t} closable onClose={() => removeTech(t)} color="purple">
                        {t}
                      </Tag>
                    ))}
                    <Input
                      placeholder={techStacks.length === 0 ? '输入技术名后回车添加,如 React' : ''}
                      value={techInput}
                      onChange={e => setTechInput(e.target.value)}
                      onPressEnter={addTech}
                      onBlur={addTech}
                      variant="borderless"
                      style={{ width: techStacks.length === 0 ? 240 : 140, padding: '4px 8px' }}
                    />
                  </Space>
                </div>
                <div style={{
                  marginTop: 10, color: 'var(--muted-text)', fontSize: 12,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  💡 常用:React、TypeScript、Node.js、PostgreSQL、Rust、Go...
                </div>
              </FormSection>

              {/* Card 4: 链接 */}
              <FormSection
                icon={<LinkOutlined />}
                title="项目链接"
                subtitle="代码仓库与在线演示"
                tag="选填"
              >
                <Form.Item
                  name="codeUrl" label={
                    <span>
                      <GithubOutlined style={{ color: 'var(--text-color)', marginRight: 4 }} />
                      GitHub 地址
                    </span>
                  }
                  rules={[{
                    validator: (_, value) => {
                      if (!value) return Promise.resolve()
                      const ok = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+/.test(value)
                      return ok ? Promise.resolve() : Promise.reject(new Error('请输入有效的 GitHub 仓库地址'))
                    },
                  }]}
                >
                  <Input
                    placeholder="https://github.com/owner/repo"
                    prefix={<GithubOutlined style={{ color: gh ? '#10b981' : 'var(--muted-text)' }} />}
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
                <Form.Item
                  name="demoUrl" label={
                    <span>
                      <GlobalOutlined style={{ color: 'var(--text-color)', marginRight: 4 }} />
                      演示地址
                    </span>
                  }
                  rules={[{
                    validator: (_, value) => {
                      if (!value) return Promise.resolve()
                      const ok = /^https?:\/\/.+/.test(value)
                      return ok ? Promise.resolve() : Promise.reject(new Error('请输入以 http(s) 开头的 URL'))
                    },
                  }]}
                >
                  <Input
                    placeholder="https://your-demo.com"
                    prefix={<LinkOutlined style={{ color: 'var(--muted-text)' }} />}
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </FormSection>
            </Form>
          </Col>

          {/* 右侧:元信息/预览 */}
          <Col xs={24} lg={8}>
            {/* 项目元信息 */}
            <div style={{
              position: 'sticky', top: 84,
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              {/* GitHub 仓库预览 */}
              {gh && (
                <div style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: 12,
                  padding: '16px 18px',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                  }}>
                    <GithubOutlined style={{ color: '#24292e', fontSize: 18 }} />
                    <span style={{
                      color: 'var(--muted-text)', fontSize: 11, fontWeight: 600,
                      letterSpacing: '0.5px', textTransform: 'uppercase',
                    }}>GitHub 仓库预览</span>
                  </div>
                  <div style={{
                    fontSize: 15, fontWeight: 700,
                    color: 'var(--text-color)',
                    marginBottom: 4,
                  }}>
                    {gh.owner}/<span style={{ color: 'var(--accent-start)' }}>{gh.repo}</span>
                  </div>
                  <div style={{
                    color: 'var(--muted-text)', fontSize: 12, marginBottom: 12,
                  }}>点击下方按钮在 GitHub 上查看</div>
                  <Button
                    type="primary"
                    icon={<GithubOutlined />}
                    href={codeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    block
                    className="fjj-btn-primary"
                    style={{ borderRadius: 8, fontWeight: 600 }}
                  >
                    打开 GitHub
                  </Button>
                </div>
              )}

              {/* 状态 */}
              <div style={{
                background: 'var(--card-bg)',
                border: 'var(--card-border)',
                borderRadius: 12,
                padding: '16px 18px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <SectionTitle icon={<RocketOutlined />} title="项目状态" />
                <Form.Item name="status" style={{ marginBottom: 0, marginTop: 12 }}>
                  <Select
                    options={statusOptions.map(s => ({
                      value: s.value,
                      label: (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: s.color }}>{s.icon}</span>
                          {s.label}
                        </span>
                      ),
                    }))}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <div style={{
                  marginTop: 10,
                  padding: '8px 10px',
                  background: `${currentStatus.color}10`,
                  border: `1px solid ${currentStatus.color}30`,
                  borderRadius: 8,
                  fontSize: 12,
                  color: currentStatus.color,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {currentStatus.icon} 当前:{currentStatus.label}
                </div>
              </div>

              {/* 完成度 */}
              <div style={{
                background: 'var(--card-bg)',
                border: 'var(--card-border)',
                borderRadius: 12,
                padding: '16px 18px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <SectionTitle icon={<StarOutlined />} title="完成度" />
                <Form.Item name="completionRate" style={{ marginBottom: 0, marginTop: 12 }}>
                  <InputNumber
                    min={0} max={100} step={5}
                    addonAfter="%"
                    style={{ width: '100%', borderRadius: 8 }}
                  />
                </Form.Item>
              </div>

              {/* 时间规划 */}
              <div style={{
                background: 'var(--card-bg)',
                border: 'var(--card-border)',
                borderRadius: 12,
                padding: '16px 18px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <SectionTitle icon={<CalendarOutlined />} title="时间规划" />
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Form.Item
                    name="startDate" label={
                      <span style={{ fontSize: 12, color: 'var(--muted-text)', fontWeight: 500 }}>开始时间</span>
                    } style={{ marginBottom: 0 }}
                  >
                    <DatePicker
                      placeholder="选择开始日期"
                      style={{ width: '100%', borderRadius: 8 }}
                      format="YYYY-MM-DD"
                    />
                  </Form.Item>
                  <Form.Item
                    name="expectedEndDate" label={
                      <span style={{ fontSize: 12, color: 'var(--muted-text)', fontWeight: 500 }}>预期结束时间</span>
                    } style={{ marginBottom: 0 }}
                    dependencies={['startDate']}
                    rules={[{
                      validator: (_, value) => {
                        if (!value) return Promise.resolve()
                        const start = form.getFieldValue('startDate')
                        if (start && value.isBefore(start)) {
                          return Promise.reject(new Error('结束时间不能早于开始时间'))
                        }
                        return Promise.resolve()
                      },
                    }]}
                  >
                    <DatePicker
                      placeholder="选择预期结束日期"
                      style={{ width: '100%', borderRadius: 8 }}
                      format="YYYY-MM-DD"
                    />
                  </Form.Item>
                  <Form.Item
                    name="bufferDays" label={
                      <span style={{ fontSize: 12, color: 'var(--muted-text)', fontWeight: 500 }}>缓冲时间</span>
                    } style={{ marginBottom: 0 }}
                  >
                    <InputNumber
                      min={0} max={365}
                      placeholder="天数"
                      addonAfter="天"
                      style={{ width: '100%', borderRadius: 8 }}
                    />
                  </Form.Item>
                </div>
              </div>

              {/* 可见性 */}
              <div style={{
                background: 'var(--card-bg)',
                border: 'var(--card-border)',
                borderRadius: 12,
                padding: '16px 18px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <SectionTitle icon={<EyeOutlined />} title="可见性" />
                <Form.Item
                  name="isPublic"
                  valuePropName="checked"
                  style={{ marginBottom: 0, marginTop: 12 }}
                >
                  <Switch
                    checkedChildren="公开"
                    unCheckedChildren="私有"
                    style={{ width: 80 }}
                  />
                </Form.Item>
                <div style={{
                  marginTop: 10, color: 'var(--muted-text)', fontSize: 12,
                  lineHeight: 1.5,
                }}>
                  {isPublic
                    ? '✅ 公开:项目展示页可见,所有用户都能浏览'
                    : '🔒 私有:仅自己可见,不会出现在项目展示页'}
                </div>
              </div>

              {/* 项目元信息 */}
              <div style={{
                background: 'var(--card-bg)',
                border: 'var(--card-border)',
                borderRadius: 12,
                padding: '16px 18px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <SectionTitle icon={<CalendarOutlined />} title="项目元信息" />
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <MetaRow
                    label="项目日期"
                    value={startDate ? dayjs(startDate).format('YYYY-MM-DD') : new Date().toLocaleDateString('zh-CN')}
                  />
                  <MetaRow label="作者" value="风迹集主" />
                  <MetaRow label="技术栈" value={techStacks.length > 0 ? `${techStacks.length} 项` : '未填写'} />
                  <MetaRow label="GitHub" value={gh ? `${gh.owner}/${gh.repo}` : '未填写'} />
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </AppLayout>
  )
}

// ===== 表单分组卡片 =====
function FormSection({
  icon, title, subtitle, tag, children,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  tag?: string
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: 'var(--card-bg)',
      border: 'var(--card-border)',
      borderRadius: 14,
      padding: '24px 28px',
      marginBottom: 16,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'var(--accent-gradient)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 15,
          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)',
        }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            color: 'var(--text-color)',
            fontSize: 15, fontWeight: 700,
            letterSpacing: '-0.2px',
          }}>
            {title}
            {tag && (
              <span style={{
                padding: '1px 8px',
                background: 'var(--segmented-bg)',
                color: 'var(--muted-text)',
                fontSize: 10, fontWeight: 600,
                borderRadius: 10,
                letterSpacing: '0.3px',
              }}>{tag}</span>
            )}
          </div>
          <div style={{
            color: 'var(--muted-text)', fontSize: 12,
            marginTop: 2,
          }}>{subtitle}</div>
        </div>
      </div>
      <div style={{ marginTop: 18 }}>{children}</div>
    </div>
  )
}

// ===== 区块小标题 =====
function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      color: 'var(--text-color)',
      fontSize: 13, fontWeight: 700,
      letterSpacing: '0.2px',
    }}>
      <span style={{ color: 'var(--accent-start)', fontSize: 14 }}>{icon}</span>
      {title}
    </div>
  )
}

// ===== 元信息行 =====
function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{
        color: 'var(--muted-text)', fontSize: 12,
        fontWeight: 500,
      }}>{label}</span>
      <span style={{
        color: 'var(--text-color)', fontSize: 12,
        fontWeight: 600,
        textAlign: 'right',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        maxWidth: 160,
      }}>{value}</span>
    </div>
  )
}

export default ProjectCreate
