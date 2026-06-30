// 设置页面 — 偏好(主题/主页/博客/头像) + 通知 + 关于
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button, Switch, Select, Input, Avatar, message, Modal,
} from 'antd'
import ImgCrop from 'antd-img-crop'
import {
  ArrowLeftOutlined, BgColorsOutlined,
  BellOutlined, InfoCircleOutlined,
  HomeOutlined, FileTextOutlined, CheckOutlined,
  UserOutlined, CloudUploadOutlined, DeleteOutlined, ScissorOutlined,
} from '@ant-design/icons'
import AppLayout from '../components/AppLayout'
import { useThemeStore } from '../stores/themeStore'
import { useAuthStore } from '../stores/authStore'
import { useGreetingBg, GREETING_PRESETS } from '../hooks/useGreetingBg'
import { useUserAvatar } from '../hooks/useUserAvatar'

const MAX_BG_SIZE = 2 * 1024 * 1024 // 2MB

function Settings() {
  const navigate = useNavigate()
  const isDarkMode = useThemeStore(s => s.isDarkMode)
  const toggleTheme = useThemeStore(s => s.toggleTheme)
  const user = useAuthStore(s => s.user)
  const [greetingBgId, setGreetingBgId] = useGreetingBg()
  const { avatar, uploadFromFile, clear } = useUserAvatar()
  const [autoSave, setAutoSave] = useState(true)
  const [emailNotif, setEmailNotif] = useState(false)
  const [commentNotif, setCommentNotif] = useState(true)

  // 博客设置(localStorage 持久化)
  const [blogSort, setBlogSort] = useState<string>(() => localStorage.getItem('blog-sort') || 'latest')
  const [blogCover, setBlogCover] = useState<string>(() => localStorage.getItem('blog-cover') || '')
  const [markdownFontSize, setMarkdownFontSize] = useState<number>(
    () => Number(localStorage.getItem('md-fontsize')) || 14
  )

  const saveBlogSort = (v: string) => { setBlogSort(v); localStorage.setItem('blog-sort', v) }
  const saveBlogCover = (v: string) => { setBlogCover(v); localStorage.setItem('blog-cover', v) }
  const saveMarkdownFontSize = (v: number) => {
    setMarkdownFontSize(v); localStorage.setItem('md-fontsize', String(v))
  }

  // 头像上传
  const avatarInputRef = useRef<HTMLInputElement>(null)
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

  // 背景上传(用 antd-img-crop 裁剪 — 宽高比约 5:1 适配问候框)
  const handleBgCropped = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.error('请选择图片文件')
      return false
    }
    if (file.size > MAX_BG_SIZE) {
      message.error('图片不能超过 2MB')
      return false
    }
    const reader = new FileReader()
    return new Promise<boolean>((resolve) => {
      reader.onload = () => {
        const dataUrl = reader.result as string
        try {
          localStorage.setItem('greeting-bg', `image:${dataUrl}`)
          setGreetingBgId(`image:${dataUrl}`)
          message.success('背景已上传并裁剪')
          resolve(true)
        } catch {
          message.error('图片太大无法保存,请尝试裁剪后重新上传')
          resolve(false)
        }
      }
      reader.onerror = () => { message.error('读取失败'); resolve(false) }
      reader.readAsDataURL(file)
    })
  }

  return (
    <AppLayout selectedKey="settings">
      <div style={{
        animation: 'fadeIn 0.4s ease-out both',
        maxWidth: 800, margin: '0 auto',
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
            }}>⚙️</span>
            <h2 style={{
              margin: 0, color: 'var(--text-color)',
              fontSize: 16, fontWeight: 600,
              letterSpacing: '0.1px', lineHeight: 1,
            }}>偏好设置</h2>
          </div>
        </div>

        {/* ===== 1. 外观主题 ===== */}
        <SettingsSection
          icon={<BgColorsOutlined />}
          title="外观主题"
          description="个性化你的使用体验"
        >
          <SettingRow label="深色模式" description="切换浅色 / 深色主题">
            <Switch
              checked={isDarkMode}
              onChange={toggleTheme}
              checkedChildren="深色"
              unCheckedChildren="浅色"
              style={{ width: 80 }}
            />
          </SettingRow>
          <SettingRow label="语言" description="界面显示语言">
            <Select
              value="zh-CN"
              style={{ width: 140 }}
              options={[
                { value: 'zh-CN', label: '简体中文' },
                { value: 'en-US', label: 'English' },
              ]}
              disabled
            />
          </SettingRow>
        </SettingsSection>

        {/* ===== 2. 主页问候框背景 ===== */}
        <SettingsSection
          icon={<HomeOutlined />}
          title="主页问候框背景"
          description="自定义主页顶部欢迎框的背景样式"
        >
          <div style={{ marginBottom: 12 }}>
            <div style={{
              color: 'var(--muted-text)', fontSize: 12, fontWeight: 500,
              marginBottom: 10, letterSpacing: '0.3px',
            }}>
              预设渐变(点击切换)
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
              gap: 10,
            }}>
              {GREETING_PRESETS.map(p => {
                const active = greetingBgId === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => setGreetingBgId(p.id)}
                    style={{
                      position: 'relative',
                      height: 64,
                      borderRadius: 10,
                      background: p.value,
                      cursor: 'pointer',
                      border: active ? '2px solid var(--accent-start)' : '2px solid transparent',
                      boxShadow: active ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none',
                      transition: 'all 0.2s ease',
                      overflow: 'hidden',
                    }}
                  >
                    {active && (
                      <div style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--accent-start)', fontSize: 11,
                      }}>
                        <CheckOutlined />
                      </div>
                    )}
                    <div style={{
                      position: 'absolute', bottom: 6, left: 8,
                      color: '#fff', fontSize: 11, fontWeight: 500,
                      textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                    }}>
                      {p.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <SettingRow label="自定义图片" description="填 URL,或上传本地图片(≤2MB,可裁剪)">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Input
                placeholder="https://example.com/bg.jpg"
                value={blogCover.startsWith('image:') ? blogCover.slice(6) : (blogCover || '')}
                onChange={e => {
                  const v = e.target.value.trim()
                  saveBlogCover(v ? `image:${v}` : '')
                  if (v) setGreetingBgId(`image:${v}`)
                }}
                style={{ width: 220 }}
                allowClear
              />
              <ImgCrop
                modalTitle="裁剪背景图(适配问候框比例)"
                aspect={5 / 1}
                quality={0.9}
                rotationSlider
                minZoom={0.5}
                maxZoom={3}
                cropShape="rect"
                showGrid
                beforeCrop={(file) => {
                  if (!file.type.startsWith('image/')) {
                    message.error('请选择图片文件')
                    return false
                  }
                  if (file.size > MAX_BG_SIZE) {
                    message.error('图片不能超过 2MB')
                    return false
                  }
                  return true
                }}
                onModalOk={async (croppedFile) => {
                  if (croppedFile instanceof File) {
                    await handleBgCropped(croppedFile)
                  }
                  // 返回原值让 Upload 流程完成
                  return croppedFile as any
                }}
              >
                <Button
                  icon={<ScissorOutlined />}
                  style={{ borderRadius: 8 }}
                >
                  上传并裁剪
                </Button>
              </ImgCrop>
            </div>
          </SettingRow>
        </SettingsSection>

        {/* ===== 3. 用户头像 ===== */}
        <SettingsSection
          icon={<UserOutlined />}
          title="用户头像"
          description="上传本地图片作为你的头像(≤2MB)"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Avatar
              size={64}
              src={avatar || user?.avatar}
              icon={!avatar && !user?.avatar && <UserOutlined />}
              style={{
                background: 'var(--accent-gradient)',
                fontSize: 26, fontWeight: 500,
                flexShrink: 0,
              }}
            >
              {(user?.nickname || user?.username)?.[0]?.toUpperCase()}
            </Avatar>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                className="fjj-btn-primary"
                onClick={() => avatarInputRef.current?.click()}
                style={{ borderRadius: 8, fontWeight: 500 }}
              >
                上传头像
              </Button>
              {avatar && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleAvatarClear}
                  style={{ borderRadius: 8, fontWeight: 500 }}
                >
                  重置
                </Button>
              )}
            </div>
          </div>
        </SettingsSection>

        {/* ===== 4. 博客设置 ===== */}
        <SettingsSection
          icon={<FileTextOutlined />}
          title="博客设置"
          description="文章列表排序 / 编辑器偏好"
        >
          <SettingRow label="文章默认排序" description="文章列表的默认展示顺序">
            <Select
              value={blogSort}
              onChange={saveBlogSort}
              style={{ width: 160 }}
              options={[
                { value: 'latest', label: '最新发布' },
                { value: 'hot', label: '最多阅读' },
                { value: 'liked', label: '最多点赞' },
              ]}
            />
          </SettingRow>
          <SettingRow label="默认封面" description="新建文章时自动填充的封面 URL(可选)">
            <Input
              placeholder="https://example.com/cover.jpg"
              value={blogCover.startsWith('image:') ? '' : blogCover}
              onChange={e => saveBlogCover(e.target.value)}
              style={{ width: 280 }}
              allowClear
            />
          </SettingRow>
          <SettingRow label="编辑器字号" description="Markdown 编辑器正文字号">
            <Select
              value={markdownFontSize}
              onChange={(v) => saveMarkdownFontSize(Number(v))}
              style={{ width: 120 }}
              options={[
                { value: 12, label: '12px 小' },
                { value: 14, label: '14px 标准' },
                { value: 16, label: '16px 大' },
                { value: 18, label: '18px 特大' },
              ]}
            />
          </SettingRow>
          <SettingRow label="自动保存草稿" description="编辑文章时自动保存到本地">
            <Switch
              checked={autoSave}
              onChange={setAutoSave}
              checkedChildren="开"
              unCheckedChildren="关"
            />
          </SettingRow>
        </SettingsSection>

        {/* ===== 5. 通知 ===== */}
        <SettingsSection
          icon={<BellOutlined />}
          title="通知"
          description="管理你的通知偏好"
        >
          <SettingRow label="邮件通知" description="重要事件通过邮件发送">
            <Switch
              checked={emailNotif}
              onChange={setEmailNotif}
              checkedChildren="开"
              unCheckedChildren="关"
            />
          </SettingRow>
          <SettingRow label="评论提醒" description="有人评论你的文章时通知">
            <Switch
              checked={commentNotif}
              onChange={setCommentNotif}
              checkedChildren="开"
              unCheckedChildren="关"
            />
          </SettingRow>
        </SettingsSection>

        {/* ===== 6. 关于 ===== */}
        <SettingsSection
          icon={<InfoCircleOutlined />}
          title="关于"
          description="版本与项目信息"
        >
          <SettingRow label="应用名称">
            <span style={{ color: 'var(--text-color)' }}>🌌 风迹集</span>
          </SettingRow>
          <SettingRow label="版本">
            <span style={{
              color: 'var(--muted-text)',
              fontFamily: 'monospace', fontSize: 12,
            }}>v1.0.0</span>
          </SettingRow>
          <SettingRow label="技术栈">
            <span style={{ color: 'var(--secondary-text)', fontSize: 12 }}>
              React 18 · TypeScript · Ant Design 5
            </span>
          </SettingRow>
          <SettingRow label="开源协议">
            <span style={{ color: 'var(--secondary-text)', fontSize: 12 }}>MIT</span>
          </SettingRow>
        </SettingsSection>
      </div>
    </AppLayout>
  )
}

// 设置区块
function SettingsSection({ icon, title, description, children }: {
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

// 设置行(label + 控件)
function SettingRow({ label, description, children }: {
  label: string; description?: string; children: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16,
      padding: '10px 0',
      borderBottom: 'var(--divider-color)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'var(--text-color)', fontSize: 13, fontWeight: 500 }}>
          {label}
        </div>
        {description && (
          <div style={{ color: 'var(--muted-text)', fontSize: 12, marginTop: 2 }}>
            {description}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

export default Settings