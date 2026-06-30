// 个人中心 — 头像/简介 + 数据统计 + 最近动态 + 资料编辑 + 关联账号 + 退出
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Row, Col, Tag, Button, Spin, Form, Input, Modal, message,
} from 'antd'
import {
  ArrowLeftOutlined, FileTextOutlined, ProjectOutlined,
  CalendarOutlined, EyeOutlined, CheckCircleOutlined,
  LockOutlined, LogoutOutlined, GithubOutlined, GlobalOutlined,
  EditOutlined, CloseOutlined, CameraOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import AppLayout from '../components/AppLayout'
import { useAuthStore } from '../stores/authStore'
import { getDashboardStats } from '../services/stats'
import { getPosts } from '../services/post'
import { getProjects } from '../services/project'
import { logout as apiLogout, updateMe, changePassword, getCurrentUser } from '../services/auth'
import { useUserAvatar } from '../hooks/useUserAvatar'

interface Stats {
  postsCount: number
  projectsCount: number
  checkinsCount: number
  totalViews: number
}

function Profile() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const { avatar, uploadFromFile, clear } = useUserAvatar()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [stats, setStats] = useState<Stats>({
    postsCount: 0, projectsCount: 0, checkinsCount: 0, totalViews: 0,
  })
  const [recentPosts, setRecentPosts] = useState<any[]>([])
  const [recentProjects, setRecentProjects] = useState<any[]>([])
  const [form] = Form.useForm()
  const [pwdForm] = Form.useForm()
  const [pwdModalOpen, setPwdModalOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const r = await uploadFromFile(file)
    if (r.ok) message.success('头像已更新')
    else message.error(r.error || '上传失败')
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }
  const handleAvatarClear = () => {
    Modal.confirm({
      title: '重置头像',
      content: '将恢复为系统默认头像(用户名首字母),确定吗?',
      okText: '重置', cancelText: '取消',
      onOk: () => { clear(); message.success('已重置') },
    })
  }

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      try {
        const [statsRes, postsRes, projectsRes] = await Promise.all([
          getDashboardStats(),
          getPosts({ authorId: user.id, limit: 5 }),
          getProjects({ authorId: user.id, limit: 5 }),
        ])
        if (cancelled) return
        if (statsRes.success && statsRes.data) {
          setStats({
            postsCount: statsRes.data.postsCount ?? 0,
            projectsCount: statsRes.data.projectsCount ?? 0,
            checkinsCount: statsRes.data.checkinsCount ?? 0,
            totalViews: statsRes.data.totalViews ?? 0,
          })
        }
        if (postsRes.success && postsRes.data) setRecentPosts(postsRes.data.posts || [])
        if (projectsRes.success && projectsRes.data) setRecentProjects(projectsRes.data.projects || [])
      } catch (e) {
        // 静默失败
      }
    })()
    return () => { cancelled = true }
  }, [user])

  if (!user) {
    return (
      <AppLayout selectedKey="profile">
        <Spin size="large" style={{ display: 'block', margin: '120px auto' }} />
      </AppLayout>
    )
  }

  const handleSaveProfile = async () => {
    try {
      const values = await form.validateFields()
      // P0-4:对接 PUT /users/me
      const res = await updateMe({
        nickname: values.nickname,
        email: values.email,
        bio: values.bio,
      })
      if (res?.success) {
        message.success('资料已保存')
        // 重新拉取最新 user 同步到 store
        try {
          const me = await getCurrentUser()
          if (me?.success && me.data) {
            // 用 login 整体刷新(因为 store 只有 login/logout 没 setUser)
            const token = localStorage.getItem('auth-token')
            const refresh = localStorage.getItem('auth-refresh-token')
            if (token) {
              useAuthStore.getState().login(me.data, token, refresh ?? undefined)
            }
          }
        } catch { /* 静默 */ }
        setEditMode(false)
      } else {
        message.error(res?.error?.message || '保存失败')
      }
    } catch (e: any) {
      if (e?.errorFields) message.warning('请检查表单')
      else message.error(e?.message || '保存失败')
    }
  }

  const handleChangePassword = async () => {
    try {
      const values = await pwdForm.validateFields()
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的新密码不一致')
        return
      }
      // P0-4:对接 PUT /users/me/password
      const res = await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      })
      if (res?.success !== false && res?.code !== 'ERROR') {
        message.success('密码已修改')
        pwdForm.resetFields()
        setPwdModalOpen(false)
      } else {
        message.error(res?.error?.message || res?.message || '修改失败')
      }
    } catch (e: any) {
      if (e?.errorFields) message.warning('请检查表单')
      else message.error(e?.message || '修改失败')
    }
  }

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '退出后需要重新登录,确定吗?',
      okText: '退出',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try { await apiLogout() } catch { /* ignore */ }
        logout()
        localStorage.removeItem('auth-token')
        localStorage.removeItem('auth-storage')
        message.success('已退出登录')
        navigate('/login')
      },
    })
  }

  return (
    <AppLayout selectedKey="profile">
      <div style={{
        animation: 'fadeIn 0.4s ease-out both',
        maxWidth: 960, margin: '0 auto',
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
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 4 }}>
            <span style={{
              fontSize: 22, lineHeight: 1,
              filter: 'drop-shadow(0 2px 6px rgba(102, 126, 234, 0.3))',
            }}>👤</span>
            <h2 style={{
              margin: 0, color: 'var(--text-color)',
              fontSize: 16, fontWeight: 600,
              letterSpacing: '0.1px', lineHeight: 1,
            }}>个人中心</h2>
          </div>
          <div style={{ flex: 1 }} />
          {avatar && (
            <Button
              danger
              onClick={handleAvatarClear}
              style={{
                height: 34, borderRadius: 8,
                border: '1px solid var(--input-border)',
                fontWeight: 400,
              }}
            >
              重置头像
            </Button>
          )}
        </div>

        {/* ===== Hero 个人信息 ===== */}
        <div style={{
          position: 'relative',
          padding: '28px 32px 24px',
          marginBottom: '20px',
          background: 'var(--card-bg)',
          border: 'var(--card-border)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{
            position: 'absolute', top: '-100px', right: '-100px',
            width: '320px', height: '320px',
            background: 'radial-gradient(circle, var(--accent-start) 0%, transparent 70%)',
            opacity: 0.10, pointerEvents: 'none', filter: 'blur(24px)',
          }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 22 }}>
            {/* 头像 — 简洁版,点击可换 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
              <div
                onClick={() => avatarInputRef.current?.click()}
                title="点击更换头像"
                style={{
                  width: 84, height: 84, borderRadius: '50%',
                  cursor: 'pointer',
                  background: 'var(--accent-gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 32, fontWeight: 600,
                  overflow: 'hidden',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.28)',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {(avatar || user.avatar) ? (
                  <img
                    src={avatar || user.avatar}
                    alt="avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  (user.nickname || user.username)?.[0]?.toUpperCase()
                )}
              </div>
              <Button
                size="small"
                icon={<CameraOutlined />}
                onClick={() => avatarInputRef.current?.click()}
                style={{ borderRadius: 6, fontSize: 12 }}
              >
                更换头像
              </Button>
            </div>

            {/* 信息 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                <h1 style={{
                  margin: 0,
                  color: 'var(--text-color)',
                  fontSize: 22, fontWeight: 600,
                  letterSpacing: '0px', lineHeight: 1.2,
                }}>
                  {user.nickname || user.username}
                </h1>
                <Tag style={{
                  margin: 0, padding: '1px 8px', borderRadius: 20,
                  background: 'rgba(102, 126, 234, 0.15)',
                  color: 'var(--accent-start)',
                  border: 'none', fontWeight: 500, fontSize: 11,
                }}>
                  @{user.username}
                </Tag>
                {user.role === 'admin' && (
                  <Tag style={{
                    margin: 0, padding: '1px 8px', borderRadius: 20,
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    color: '#fff', border: 'none',
                    fontWeight: 500, fontSize: 11,
                  }}>
                    管理员
                  </Tag>
                )}
              </div>
              <div style={{
                color: 'var(--muted-text)', fontSize: 12, marginTop: 4,
                display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              }}>
                <span>📧 {user.email}</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>🆔 #{user.id}</span>
              </div>
              {user.bio && (
                <p style={{
                  margin: '8px 0 0',
                  color: 'var(--secondary-text)', fontSize: 13, lineHeight: 1.6,
                }}>
                  {user.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ===== 4 张数据统计 ===== */}
        <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
          <Col xs={12} sm={6}>
            <StatCard
              icon={<FileTextOutlined />}
              label="已发布文章"
              value={stats.postsCount}
              color="var(--accent-start)"
            />
          </Col>
          <Col xs={12} sm={6}>
            <StatCard
              icon={<ProjectOutlined />}
              label="项目数"
              value={stats.projectsCount}
              color="#f59e0b"
            />
          </Col>
          <Col xs={12} sm={6}>
            <StatCard
              icon={<CalendarOutlined />}
              label="签到天数"
              value={stats.checkinsCount}
              color="#10b981"
            />
          </Col>
          <Col xs={12} sm={6}>
            <StatCard
              icon={<EyeOutlined />}
              label="总阅读量"
              value={stats.totalViews}
              color="#f472b6"
            />
          </Col>
        </Row>

        {/* ===== 1. 个人资料编辑 ===== */}
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            nickname: user.nickname || '',
            email: user.email || '',
            bio: user.bio || '',
          }}
        >
          <ProfileSection
            icon={<EditOutlined />}
            title="个人资料"
            description="修改昵称、邮箱、简介等信息"
          >
            {!editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <ProfileRow label="昵称" value={user.nickname || user.username} />
                <ProfileRow label="邮箱" value={user.email} />
                <ProfileRow label="简介" value={user.bio || '这个人很懒,什么都没留下~'} />
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    className="fjj-btn-primary"
                    onClick={() => setEditMode(true)}
                    style={{ borderRadius: 8, fontWeight: 500 }}
                  >
                    编辑资料
                  </Button>
                  <Button
                    icon={<LockOutlined />}
                    onClick={() => setPwdModalOpen(true)}
                    style={{ borderRadius: 8, fontWeight: 400 }}
                  >
                    修改密码
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Form.Item name="nickname" label="昵称"
                    rules={[{ max: 30, message: '昵称不超过 30 字' }]}>
                    <Input placeholder="你的昵称" maxLength={30} />
                  </Form.Item>
                  <Form.Item name="email" label="邮箱"
                    rules={[{ type: 'email', message: '邮箱格式不正确' }]}>
                    <Input placeholder="your@email.com" />
                  </Form.Item>
                </div>
                <Form.Item name="bio" label="个人简介"
                  rules={[{ max: 200, message: '简介不超过 200 字' }]}>
                  <Input.TextArea
                    placeholder="一句话介绍一下自己..."
                    rows={3}
                    maxLength={200}
                    showCount
                  />
                </Form.Item>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    className="fjj-btn-primary"
                    onClick={handleSaveProfile}
                    style={{ borderRadius: 8, fontWeight: 500 }}
                  >
                    保存修改
                  </Button>
                  <Button
                    icon={<CloseOutlined />}
                    onClick={() => {
                      form.resetFields()
                      setEditMode(false)
                    }}
                    style={{ borderRadius: 8 }}
                  >
                    取消
                  </Button>
                </div>
              </>
            )}
          </ProfileSection>
        </Form>

        {/* ===== 2. 最近动态(双栏) ===== */}
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <ActivityCard
              icon={<FileTextOutlined />}
              title="最近文章"
              emptyText="还没有发表过文章"
              items={recentPosts.map(p => ({
                id: p.id,
                title: p.title,
                meta: `${p.viewCount || 0} 阅读 · ${p.likeCount || 0} 赞`,
                date: dayjs(p.createdAt).format('MM-DD'),
                color: 'var(--accent-start)',
                onClick: () => navigate(`/blog/edit/${p.id}`),
              }))}
            />
          </Col>
          <Col xs={24} lg={12}>
            <ActivityCard
              icon={<ProjectOutlined />}
              title="最近项目"
              emptyText="还没有创建过项目"
              items={recentProjects.map(p => ({
                id: p.id,
                title: p.name,
                meta: `${p.completionRate || 0}% 完成度`,
                date: dayjs(p.createdAt).format('MM-DD'),
                color: '#f59e0b',
                onClick: () => navigate(`/projects/${p.id}`),
              }))}
            />
          </Col>
        </Row>

        {/* ===== 3. 关联账号 ===== */}
        <ProfileSection
          icon={<GlobalOutlined />}
          title="关联账号"
          description="绑定第三方账号(开发中)"
        >
          <SettingInlineRow label="GitHub">
            <Button icon={<GithubOutlined />} disabled style={{ borderRadius: 8 }}>
              绑定(即将开放)
            </Button>
          </SettingInlineRow>
          <SettingInlineRow label="邮箱">
            <span style={{ color: 'var(--muted-text)', fontSize: 12 }}>
              {user.email || '未绑定'}
            </span>
          </SettingInlineRow>
        </ProfileSection>

        {/* ===== 4. 退出登录 ===== */}
        <div style={{
          background: 'var(--card-bg)',
          border: 'var(--card-border)',
          borderRadius: '14px',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <div>
            <div style={{
              color: 'var(--text-color)', fontSize: 14, fontWeight: 600,
              marginBottom: 2,
            }}>退出登录</div>
            <div style={{ color: 'var(--muted-text)', fontSize: 12 }}>
              退出后需要重新登录账号
            </div>
          </div>
          <Button
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ borderRadius: 8, fontWeight: 500 }}
          >
            退出登录
          </Button>
        </div>

        {/* ===== 修改密码弹窗 ===== */}
        <Modal
          open={pwdModalOpen}
          title="修改密码"
          onCancel={() => { pwdForm.resetFields(); setPwdModalOpen(false) }}
          onOk={handleChangePassword}
          okText="确认修改"
          cancelText="取消"
          destroyOnClose
        >
          <Form form={pwdForm} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item name="oldPassword" label="当前密码"
              rules={[{ required: true, message: '请输入当前密码' }]}>
              <Input.Password placeholder="请输入当前密码" />
            </Form.Item>
            <Form.Item name="newPassword" label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少 6 位' },
              ]}>
              <Input.Password placeholder="至少 6 位" />
            </Form.Item>
            <Form.Item name="confirmPassword" label="确认新密码"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请再次输入新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'))
                  },
                }),
              ]}>
              <Input.Password placeholder="请再次输入" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  )
}

// 统计卡片
function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string
}) {
  return (
    <div style={{
      padding: '16px 18px',
      background: 'var(--card-bg)',
      border: 'var(--card-border)',
      borderRadius: '12px',
      boxShadow: 'var(--shadow-sm)',
      transition: 'all 0.25s ease',
    }}
      className="hover-card"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${color}15`,
          color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17,
        }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: 'var(--muted-text)',
            fontSize: 11, fontWeight: 500,
            letterSpacing: '0.3px',
          }}>{label}</div>
          <div style={{
            color: 'var(--text-color)',
            fontSize: 20, fontWeight: 600,
            lineHeight: 1.2,
            fontVariantNumeric: 'tabular-nums',
          }}>{value.toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}

// 设置区块(复用)
function ProfileSection({ icon, title, description, children }: {
  icon: React.ReactNode; title: string; description: string; children: React.ReactNode
}) {
  return (
    <div style={{
      background: 'var(--card-bg)',
      border: 'var(--card-border)',
      borderRadius: '14px',
      padding: '22px 26px',
      boxShadow: 'var(--shadow-sm)',
      marginBottom: 16,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 14,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'var(--accent-gradient)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 14,
          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)',
        }}>{icon}</div>
        <div>
          <div style={{
            color: 'var(--text-color)', fontSize: 14, fontWeight: 600,
            letterSpacing: '0.1px',
          }}>{title}</div>
          <div style={{ color: 'var(--muted-text)', fontSize: 12, marginTop: 2 }}>
            {description}
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}

// 只读的属性行
function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '8px 0',
      borderBottom: 'var(--divider-color)',
    }}>
      <span style={{
        color: 'var(--muted-text)', fontSize: 12, fontWeight: 500,
        width: 50, flexShrink: 0,
      }}>{label}</span>
      <span style={{
        color: 'var(--text-color)', fontSize: 13,
      }}>{value}</span>
    </div>
  )
}

// 设置行(label + 控件)
function SettingInlineRow({ label, children }: {
  label: string; children: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16,
      padding: '10px 0',
      borderBottom: 'var(--divider-color)',
    }}>
      <span style={{ color: 'var(--text-color)', fontSize: 13, fontWeight: 500 }}>
        {label}
      </span>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

// 动态卡
function ActivityCard({ icon, title, items, emptyText, }: {
  icon: React.ReactNode; title: string; emptyText: string;
  items: { id: number; title: string; meta: string; date: string; color: string; onClick: () => void }[]
}) {
  return (
    <div style={{
      background: 'var(--card-bg)',
      border: 'var(--card-border)',
      borderRadius: '12px',
      padding: '18px 22px',
      boxShadow: 'var(--shadow-sm)',
      marginBottom: 16,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 12,
        color: 'var(--text-color)',
        fontSize: 13, fontWeight: 600,
        letterSpacing: '0.1px',
      }}>
        <span style={{ color: 'var(--accent-start)', fontSize: 14 }}>{icon}</span>
        {title}
      </div>

      {items.length === 0 ? (
        <div style={{
          padding: '32px 12px',
          textAlign: 'center',
          color: 'var(--muted-text)',
          fontSize: 12,
        }}>
          <div style={{ fontSize: 24, marginBottom: 6, opacity: 0.4 }}>📭</div>
          {emptyText}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map(it => (
            <div
              key={it.id}
              onClick={it.onClick}
              className="hover-list-item"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <div style={{
                width: 4, alignSelf: 'stretch', borderRadius: 2,
                background: it.color,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: 'var(--text-color)', fontSize: 13, fontWeight: 500,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{it.title}</div>
                <div style={{
                  color: 'var(--muted-text)', fontSize: 11,
                  marginTop: 2,
                }}>{it.meta}</div>
              </div>
              <span style={{
                color: 'var(--muted-text)', fontSize: 11, fontWeight: 500,
                fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
              }}>{it.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Profile