// 项目详情查看页 — 完整展示项目元信息、描述、计划任务、技术栈、链接
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Spin, Button, Tag, Progress, message, Tooltip, Input, InputNumber,
} from 'antd'
import {
  ArrowLeftOutlined, EditOutlined, GithubOutlined, GlobalOutlined,
  ClockCircleOutlined, CalendarOutlined, UserOutlined, BookOutlined,
  RocketOutlined, CheckCircleOutlined as DoneIcon,
  CheckOutlined, PlusOutlined,
  AppstoreOutlined, EyeOutlined, FireOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import AppLayout from '../components/AppLayout'
import MarkdownRenderer from '../components/blog/MarkdownRenderer'
import { getProjectById, updateProject, type Project } from '../services/project'
import type { PlanItem } from '../components/blog/PlanSection'

const STATUS_MAP = {
  planning: { label: '规划中', color: '#faad14', icon: <ClockCircleOutlined /> },
  in_progress: { label: '进行中', color: 'var(--accent-start)', icon: <RocketOutlined /> },
  completed: { label: '已完成', color: '#10b981', icon: <DoneIcon /> },
}

function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  // 已完成的任务索引集合(本地 state,刷新会重置)
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set())
  // 状态更新中
  const [statusUpdating, setStatusUpdating] = useState(false)
  // 添加任务表单
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTask, setNewTask] = useState({ what: '', time: '', weight: 0 })
  const [adding, setAdding] = useState(false)

  const toggleTask = (idx: number) => {
    setCompletedTasks(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  // 添加一条计划任务 → 调用 updateProject 保存(plan 字段)
  const handleAddTask = async () => {
    if (!project || !newTask.what.trim() || adding) return
    setAdding(true)
    try {
      const newItem: PlanItem = {
        what: newTask.what.trim(),
        time: newTask.time.trim() || undefined,
        weight: newTask.weight || undefined,
      }
      const newPlan = [...planItems, newItem]

      const res = await updateProject(project.id, { plan: newPlan })
      if (res.success && res.data) {
        setProject({ ...project, plan: res.data.plan || newPlan })
        setNewTask({ what: '', time: '', weight: 0 })
        setShowAddForm(false)
        message.success('任务已添加')
      }
    } catch {
      message.error('添加失败')
    } finally {
      setAdding(false)
    }
  }

  // 点击状态徽章 → 切换到下一阶段
  const handleStatusClick = async () => {
    if (!project || statusUpdating) return
    let nextStatus: Project['status']
    if (project.status === 'planning') nextStatus = 'in_progress'
    else if (project.status === 'in_progress') nextStatus = 'completed'
    else return  // 已完成,不可再切换
    setStatusUpdating(true)
    try {
      const completionRate = nextStatus === 'completed' ? 100 : project.completionRate
      const res = await updateProject(project.id, { status: nextStatus, completionRate })
      if (res.success && res.data) {
        setProject({ ...project, status: res.data.status, completionRate: res.data.completionRate })
        message.success(`项目状态已更新为「${STATUS_MAP[nextStatus].label}」`)
      }
    } catch {
      message.error('状态更新失败')
    } finally {
      setStatusUpdating(false)
    }
  }

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    getProjectById(Number(id)).then(res => {
      if (cancelled) return
      if (res.success && res.data) {
        setProject(res.data)
      } else {
        message.error('项目不存在或已被删除')
        navigate('/projects', { replace: true })
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [id, navigate])

  if (loading || !project) {
    return (
      <AppLayout selectedKey="projects-view">
        <div style={{ textAlign: 'center', padding: '120px 0' }}>
          <Spin size="large" />
        </div>
      </AppLayout>
    )
  }

  // 状态
  const currentStatus = STATUS_MAP[project.status] || STATUS_MAP.planning

  // 拆分 description(不再包含计划区块)
  const mainContent = (project.description || '').trim()
  // 计划项直接从 project.plan 读取
  const planItems: PlanItem[] = project.plan || []

  // 按权重计算完成度
  const totalWeight = planItems.reduce((s, it) => s + (it.weight || 0), 0)
  const completedWeight = planItems.reduce((s, it, i) => {
    return completedTasks.has(i) ? s + (it.weight || 0) : s
  }, 0)
  const calculatedCompletion = totalWeight > 0
    ? Math.round(completedWeight / totalWeight * 100)
    : project.completionRate

  // 日期
  const startDate = project.startDate ? dayjs(project.startDate) : null
  const endDate = project.expectedEndDate ? dayjs(project.expectedEndDate) : null
  const bufferDays = project.bufferDays || 0
  const createdAt = dayjs(project.createdAt)

  // 提取 GitHub owner/repo
  const gh = (() => {
    if (!project.codeUrl) return null
    try {
      const u = new URL(project.codeUrl)
      if (u.hostname !== 'github.com' && u.hostname !== 'www.github.com') return null
      const parts = u.pathname.split('/').filter(Boolean)
      if (parts.length < 2) return null
      return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') }
    } catch { return null }
  })()

  return (
    <AppLayout selectedKey="projects-view">
      <div style={{
        animation: 'fadeIn 0.4s ease-out both',
        maxWidth: 1120, margin: '0 auto',
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
            onClick={() => navigate(-1)}
            className="fjj-btn-text"
            style={{
              color: 'var(--secondary-text)',
              width: 34, height: 34, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 4, minWidth: 0, flex: 1 }}>
            <span style={{
              fontSize: 24, lineHeight: 1,
              filter: 'drop-shadow(0 2px 6px rgba(102, 126, 234, 0.3))',
            }}>🛠️</span>
            <h2 style={{
              margin: 0, color: 'var(--text-color)',
              fontSize: 17, fontWeight: 800,
              letterSpacing: '-0.2px', lineHeight: 1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{project.name}</h2>
          </div>
          <div style={{ flex: 1 }} />
          <Button
            onClick={() => navigate('/projects/manage')}
            icon={<EditOutlined />}
            className="fjj-btn-default"
            style={{
              height: 34, borderRadius: 8,
              border: '1px solid var(--input-border)',
              color: 'var(--secondary-text)',
              fontWeight: 500,
            }}
          >
            管理项目
          </Button>
        </div>

        {/* ===== Hero 区 ===== */}
        <div style={{
          position: 'relative',
          padding: '40px 36px 32px',
          marginBottom: '20px',
          background: 'var(--card-bg)',
          border: 'var(--card-border)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {/* 装饰渐变光晕 */}
          <div style={{
            position: 'absolute', top: '-100px', right: '-100px',
            width: '320px', height: '320px',
            background: 'radial-gradient(circle, var(--accent-start) 0%, transparent 70%)',
            opacity: 0.12, pointerEvents: 'none', filter: 'blur(24px)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-120px', left: '-60px',
            width: '260px', height: '260px',
            background: 'radial-gradient(circle, var(--accent-end) 0%, transparent 70%)',
            opacity: 0.1, pointerEvents: 'none', filter: 'blur(24px)',
          }} />

          <div style={{ position: 'relative' }}>
            {/* 状态徽章(可点击切换)+ 装饰线 + 标签 */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 14, flexWrap: 'wrap',
            }}>
              <Tooltip
                title={project.status === 'completed' ? '项目已完成' : '点击切换到下一阶段'}
              >
                <div
                  onClick={handleStatusClick}
                  className="hover-card"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px',
                    background: `${currentStatus.color}15`,
                    color: currentStatus.color,
                    border: `1px solid ${currentStatus.color}30`,
                    borderRadius: 20,
                    fontSize: 12, fontWeight: 600,
                    cursor: project.status === 'completed' ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {currentStatus.icon}
                  {currentStatus.label}
                  {project.status !== 'completed' && (
                    <span style={{ fontSize: 11, opacity: 0.7 }}>→</span>
                  )}
                </div>
              </Tooltip>
              {/* 装饰线 + 标签 */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                color: 'var(--muted-text)',
                fontSize: 11, fontWeight: 600,
                letterSpacing: '1.5px', textTransform: 'uppercase',
              }}>
                <div style={{ width: 24, height: 2, background: 'var(--accent-gradient)', borderRadius: 1 }} />
                PROJECT
              </div>
            </div>

            <h1 style={{
              margin: 0, color: 'var(--text-color)',
              fontSize: 36, fontWeight: 800,
              letterSpacing: '-0.5px', lineHeight: 1.25,
            }}>{project.name}</h1>

            {/* 完成度 */}
            <div style={{
              marginTop: 24, paddingTop: 24,
              borderTop: 'var(--divider-color)',
            }}>
              {/* 头部:标题 + 大百分比 */}
              <div style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 2,
                }}>
                  <span style={{
                    color: 'var(--muted-text)', fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.5px', textTransform: 'uppercase',
                  }}>完成度 · Completion</span>
                  {totalWeight > 0 && (
                    <span style={{
                      color: 'var(--muted-text)', fontSize: 11, fontWeight: 500,
                    }}>
                      已用权重 {completedWeight} / {totalWeight} · {completedTasks.size} / {planItems.length} 项已完成
                    </span>
                  )}
                </div>
                <div style={{
                  color: 'var(--text-color)',
                  fontSize: 32, fontWeight: 800,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  background: 'var(--accent-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {calculatedCompletion}<span style={{ fontSize: 18, opacity: 0.7 }}>%</span>
                </div>
              </div>

              {/* 进度条 */}
              <Progress
                percent={calculatedCompletion}
                strokeColor={{ '0%': 'var(--accent-start)', '100%': 'var(--accent-end)' }}
                showInfo={false}
                size={{ height: 8 }}
              />

              {/* 任务权重分布 */}
              {planItems.length > 0 && (
                <div style={{
                  marginTop: 18,
                  padding: '12px 14px',
                  background: 'var(--segmented-bg)',
                  borderRadius: 8,
                  border: '1px solid var(--input-border)',
                }}>
                  <div style={{
                    color: 'var(--muted-text)', fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.5px', textTransform: 'uppercase',
                    marginBottom: 10,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    任务权重分布
                  </div>
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 6,
                  }}>
                    {planItems.map((item, i) => {
                      const isDone = completedTasks.has(i)
                      const weight = item.weight || 0
                      return (
                        <div
                          key={i}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 10px',
                            background: isDone
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'var(--card-bg)',
                            border: `1px solid ${
                              isDone ? 'rgba(16, 185, 129, 0.4)' : 'var(--input-border)'
                            }`,
                            borderRadius: 6,
                            fontSize: 11,
                            color: isDone ? '#10b981' : 'var(--secondary-text)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span style={{
                            fontWeight: 700,
                            fontVariantNumeric: 'tabular-nums',
                            color: isDone ? '#10b981' : 'var(--accent-start)',
                          }}>{weight}%</span>
                          <span style={{
                            maxWidth: 120, overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            textDecoration: isDone ? 'line-through' : 'none',
                          }}>{item.what}</span>
                          {isDone && <CheckOutlined style={{ fontSize: 10 }} />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 元信息 — 标签-值网格(开始/结束/作者/创建),各自分开 */}
            <div style={{
              marginTop: 20, paddingTop: 20,
              borderTop: 'var(--divider-color)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '16px 24px',
            }}>
              {startDate && (
                <div>
                  <div style={{
                    color: 'var(--muted-text)', fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.5px', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: 5,
                    marginBottom: 6,
                  }}>
                    <CalendarOutlined /> 开始时间
                  </div>
                  <div style={{ color: 'var(--text-color)', fontSize: 14, fontWeight: 600 }}>
                    {startDate.format('YYYY-MM-DD')}
                  </div>
                </div>
              )}
              {endDate && (
                <div>
                  <div style={{
                    color: 'var(--muted-text)', fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.5px', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: 5,
                    marginBottom: 6,
                  }}>
                    <CalendarOutlined /> 预期结束
                  </div>
                  <div style={{
                    color: 'var(--text-color)', fontSize: 14, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    {endDate.format('YYYY-MM-DD')}
                    {bufferDays > 0 && (
                      <Tag style={{
                        margin: 0, fontSize: 10, padding: '0 6px',
                        lineHeight: '18px', height: 18,
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: 'var(--accent-start)',
                        border: 'none', borderRadius: 4,
                        fontWeight: 600,
                      }}>+{bufferDays} 天缓冲</Tag>
                    )}
                  </div>
                </div>
              )}
              <div>
                <div style={{
                  color: 'var(--muted-text)', fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.5px', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', gap: 5,
                  marginBottom: 6,
                }}>
                  <UserOutlined /> 作者
                </div>
                <div style={{ color: 'var(--text-color)', fontSize: 14, fontWeight: 600 }}>
                  {project.author.nickname || project.author.username}
                </div>
              </div>
              <div>
                <div style={{
                  color: 'var(--muted-text)', fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.5px', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', gap: 5,
                  marginBottom: 6,
                }}>
                  <ClockCircleOutlined /> 创建时间
                </div>
                <div style={{ color: 'var(--text-color)', fontSize: 14, fontWeight: 600 }}>
                  {createdAt.format('YYYY-MM-DD')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== 主体两栏 ===== */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: 16,
          alignItems: 'start',
        }}>
          {/* ===== 左列:描述 + 计划 ===== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 项目描述(Markdown) */}
            {mainContent && (
              <div style={{
                background: 'var(--card-bg)',
                border: 'var(--card-border)',
                borderRadius: '14px',
                padding: '32px 36px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <SectionHeader icon={<BookOutlined />} title="项目描述" />
                <div style={{ marginTop: 16 }}>
                  <MarkdownRenderer content={mainContent} />
                </div>
              </div>
            )}

            {/* GitHub 仓库(描述下) */}
            {gh && (
              <div style={{
                background: 'var(--card-bg)',
                border: 'var(--card-border)',
                borderRadius: '14px',
                padding: '20px 24px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <SectionHeader icon={<GithubOutlined />} title="GitHub 仓库" />
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{
                    flex: 1, minWidth: 0,
                    fontSize: 16, fontWeight: 700,
                    color: 'var(--text-color)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {gh.owner}/<span style={{ color: 'var(--accent-start)' }}>{gh.repo}</span>
                  </div>
                  <Button
                    type="primary"
                    icon={<GithubOutlined />}
                    href={project.codeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fjj-btn-primary"
                    style={{ borderRadius: 8, fontWeight: 600, flexShrink: 0 }}
                  >
                    打开 GitHub
                  </Button>
                </div>
              </div>
            )}

            {/* 项目计划 — 完整任务列表(可点击完成)+ 添加按钮 */}
            <div style={{
              background: 'var(--card-bg)',
              border: 'var(--card-border)',
              borderRadius: '14px',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <SectionHeader
                icon={<AppstoreOutlined />}
                title="项目计划"
                tag={
                  planItems.length === 0
                    ? '暂无任务'
                    : completedTasks.size > 0
                      ? `${completedTasks.size}/${planItems.length} 已完成`
                      : `${planItems.length} 项`
                }
              />
              {planItems.length > 0 && (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {planItems.map((item, i) => {
                    const isDone = completedTasks.has(i)
                    return (
                      <div
                        key={i}
                        onClick={() => toggleTask(i)}
                        className="hover-card"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px',
                          background: isDone ? 'rgba(16, 185, 129, 0.06)' : 'var(--segmented-bg)',
                          borderRadius: 10,
                          border: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--input-border)',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                        }}
                      >
                        {/* 序号 */}
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: isDone ? '#10b981' : 'var(--accent-gradient)',
                          color: '#fff',
                          fontSize: 12, fontWeight: 700, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: isDone
                            ? '0 2px 6px rgba(16, 185, 129, 0.3)'
                            : '0 2px 6px rgba(102, 126, 234, 0.3)',
                          transition: 'all 0.2s ease',
                        }}>
                          {isDone ? <CheckOutlined /> : i + 1}
                        </div>
                        {/* 任务 */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            color: isDone ? 'var(--muted-text)' : 'var(--text-color)',
                            fontSize: 14, fontWeight: 500,
                            lineHeight: 1.4,
                            textDecoration: isDone ? 'line-through' : 'none',
                            transition: 'all 0.2s ease',
                          }}>{item.what}</div>
                          {item.time && (
                            <div style={{
                              color: 'var(--muted-text)', fontSize: 12,
                              marginTop: 4,
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              opacity: isDone ? 0.6 : 1,
                            }}>
                              <ClockCircleOutlined /> 预计 {item.time}
                            </div>
                          )}
                        </div>
                        {/* 权重徽章 */}
                        {item.weight !== undefined && item.weight > 0 && (
                          <Tag style={{
                            margin: 0, fontSize: 10, padding: '0 8px',
                            background: 'rgba(102, 126, 234, 0.12)',
                            color: 'var(--accent-start)',
                            border: 'none', borderRadius: 4,
                            fontWeight: 600, flexShrink: 0,
                            fontVariantNumeric: 'tabular-nums',
                          }}>权重 {item.weight}%</Tag>
                        )}
                        {/* 完成态:右侧小勾 */}
                        {isDone && (
                          <Tag style={{
                            margin: 0, fontSize: 10, padding: '0 8px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            border: 'none', borderRadius: 10,
                            fontWeight: 600, flexShrink: 0,
                          }}>已完成</Tag>
                        )}
                      </div>
                    )
                  })}
                </div>
                )}

                {/* 添加任务入口(折叠/展开) */}
                {!showAddForm && (
                  <Button
                    type="dashed"
                    onClick={() => setShowAddForm(true)}
                    icon={<PlusOutlined />}
                    block
                    style={{
                      marginTop: 14,
                      height: 42, borderRadius: 8,
                      borderStyle: 'dashed',
                      borderColor: 'var(--input-border)',
                      color: 'var(--secondary-text)',
                      fontWeight: 500,
                      fontSize: 13,
                    }}
                  >
                    添加任务
                  </Button>
                )}

                {showAddForm && (
                  <div style={{
                    marginTop: 14,
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
                      <PlusOutlined /> 添加第 {planItems.length + 1} 项任务
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
                      placeholder="预计时间(如 3 天) — 可选"
                      prefix={<ClockCircleOutlined style={{ color: 'var(--muted-text)' }} />}
                      value={newTask.time}
                      onChange={e => setNewTask({ ...newTask, time: e.target.value })}
                      onPressEnter={handleAddTask}
                      style={{ borderRadius: 6, marginBottom: 8 }}
                      maxLength={20}
                    />
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px',
                      background: 'var(--card-bg)',
                      borderRadius: 6,
                      border: '1px solid var(--input-border)',
                      marginBottom: 12,
                    }}>
                      <span style={{
                        color: 'var(--muted-text)', fontSize: 12, fontWeight: 500,
                        flexShrink: 0,
                      }}>权重</span>
                      <InputNumber
                        min={0} max={100}
                        value={newTask.weight}
                        onChange={v => setNewTask({ ...newTask, weight: v ?? 0 })}
                        size="small"
                        style={{ flex: 1 }}
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
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        className="fjj-btn-primary"
                        onClick={handleAddTask}
                        loading={adding}
                        disabled={!newTask.what.trim()}
                        style={{ flex: 1, height: 36, borderRadius: 8, fontWeight: 600 }}
                      >
                        添加
                      </Button>
                      <Button
                        onClick={() => {
                          setShowAddForm(false)
                          setNewTask({ what: '', time: '', weight: 0 })
                        }}
                        style={{ height: 36, borderRadius: 8, minWidth: 90 }}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                )}
              </div>
          </div>

          {/* ===== 右列:技术栈 / 链接 / 状态信息 ===== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 演示地址 */}
            {project.demoUrl && (
              <div style={{
                background: 'var(--card-bg)',
                border: 'var(--card-border)',
                borderRadius: '14px',
                padding: '18px 20px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <SectionHeader icon={<GlobalOutlined />} title="在线演示" />
                <div style={{ marginTop: 14 }}>
                  <div style={{
                    color: 'var(--secondary-text)', fontSize: 12,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: 10,
                  }}>
                    {project.demoUrl}
                  </div>
                  <Button
                    type="default"
                    icon={<LinkOutlined />}
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    block
                    style={{ borderRadius: 8, fontWeight: 500 }}
                  >
                    访问演示
                  </Button>
                </div>
              </div>
            )}

            {/* 技术栈 */}
            {project.techStack.length > 0 && (
              <div style={{
                background: 'var(--card-bg)',
                border: 'var(--card-border)',
                borderRadius: '14px',
                padding: '18px 20px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <SectionHeader icon={<FireOutlined />} title="技术栈" />
                <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {project.techStack.map(t => (
                    <Tag key={t} style={{
                      margin: 0,
                      padding: '4px 10px',
                      background: 'rgba(102, 126, 234, 0.1)',
                      color: 'var(--accent-start)',
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      fontSize: 12, fontWeight: 500,
                      borderRadius: 6,
                    }}>{t}</Tag>
                  ))}
                </div>
              </div>
            )}

            {/* 项目元信息 */}
            <div style={{
              background: 'var(--card-bg)',
              border: 'var(--card-border)',
              borderRadius: '14px',
              padding: '18px 20px',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <SectionHeader icon={<EyeOutlined />} title="项目信息" />
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <MetaRow label="项目 ID" value={`#${project.id}`} />
                <MetaRow label="状态" value={
                  <span style={{ color: currentStatus.color, fontWeight: 600 }}>
                    {currentStatus.icon} {currentStatus.label}
                  </span>
                } />
                <MetaRow label="完成度" value={`${project.completionRate}%`} />
                {startDate && <MetaRow label="开始时间" value={startDate.format('YYYY-MM-DD')} />}
                {endDate && <MetaRow label="预期结束" value={endDate.format('YYYY-MM-DD')} />}
                {bufferDays > 0 && <MetaRow label="缓冲时间" value={`${bufferDays} 天`} />}
                {project.completedAt && <MetaRow label="完成时间" value={dayjs(project.completedAt).format('YYYY-MM-DD')} />}
                <MetaRow label="可见性" value={project.isPublic ? '公开' : '私有'} />
                <MetaRow label="创建时间" value={createdAt.format('YYYY-MM-DD HH:mm')} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

// ===== 区块小标题 =====
function SectionHeader({ icon, title, tag }: { icon: React.ReactNode; title: string; tag?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      color: 'var(--text-color)',
      fontSize: 14, fontWeight: 700,
      letterSpacing: '0.2px',
    }}>
      <span style={{ color: 'var(--accent-start)', fontSize: 15 }}>{icon}</span>
      {title}
      {tag && (
        <span style={{
          padding: '1px 8px',
          background: 'var(--segmented-bg)',
          color: 'var(--muted-text)',
          fontSize: 11, fontWeight: 600,
          borderRadius: 10,
          letterSpacing: '0.3px',
        }}>{tag}</span>
      )}
    </div>
  )
}

// ===== 元信息行 =====
function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{
        color: 'var(--muted-text)', fontSize: 12, fontWeight: 500,
        flexShrink: 0,
      }}>{label}</span>
      <span style={{
        color: 'var(--text-color)', fontSize: 12, fontWeight: 600,
        textAlign: 'right',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        minWidth: 0,
      }}>{value}</span>
    </div>
  )
}

export default ProjectDetail
