import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Layout, Row, Col, Space, Button, Input, Tooltip, Spin,
  message, Modal, Popover,
} from 'antd'
import {
  CheckCircleOutlined,
  BoldOutlined, ItalicOutlined, LinkOutlined, PictureOutlined,
  OrderedListOutlined, UnorderedListOutlined, ArrowLeftOutlined,
  ClockCircleOutlined, PlusOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../stores/authStore'
import AppLayout from '../components/AppLayout'
import { createPost, updatePost, getPostById } from '../services/post'
import { getCategories, getTags, createCategory } from '../services/category'
import { uploadImage } from '../services/upload'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import MarkdownPreview from '@uiw/react-markdown-preview'

const { TextArea } = Input

function BlogEditor() {
  const navigate = useNavigate()
  const { id } = useParams()  // /blog/edit/:id
  const [searchParams] = useSearchParams()
  const { logout: authLogout } = useAuthStore()
  const isEdit = !!id
  const catParam = searchParams.get('cat')

  const [fontSize, setFontSize] = useState(14)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(catParam ? Number(catParam) : null)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [allTags, setAllTags] = useState<{ id: number; name: string }[]>([])
  const [initLoading, setInitLoading] = useState(true)
  // 分类新建弹窗
  const [showCreateCat, setShowCreateCat] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const hasUnsavedContent = title.trim().length > 0 || content.trim().length > 0

  // 退出确认
  const handleConfirmExit = () => {
    if (hasUnsavedContent) {
      Modal.confirm({
        title: '确认离开',
        content: '您有未保存的内容，确定要离开吗？',
        okText: '保存草稿',
        cancelText: '不保存',
        cancelButtonProps: { danger: true },
        onOk: () => handleSaveDraft(),
        onCancel: () => {
          authLogout()
          localStorage.removeItem('auth-token')
          navigate('/login')
        },
      })
    } else {
      authLogout()
      localStorage.removeItem('auth-token')
      navigate('/login')
    }
  }

  const handleSaveDraft = async () => {
    if (!content.trim()) return
    const t = resolveTitle()
    try {
      setSaving(true)
      const slug = t.toLowerCase()
        .replace(/[^a-z0-9一-龥]+/g, '-')
        .replace(/(^-|-$)/g, '')
      const tagIds = extractTagIds(content)
      if (isEdit) {
        await updatePost(Number(id), { title: t, slug, summary: content.slice(0, 200), content, categoryId: categoryId || undefined, tagIds, status: 'draft' })
      } else {
        await createPost({ title: t, slug, summary: content.slice(0, 200), content, categoryId: categoryId || undefined, tagIds, status: 'draft' })
      }
      message.success('草稿已保存')
      navigate('/blog')
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 初始化：加载分类和标签；如果是编辑模式，加载文章数据
  useEffect(() => {
    const init = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([getCategories(), getTags()])
        if (categoriesRes.success && categoriesRes.data) setCategories(categoriesRes.data)
        if (tagsRes.success && tagsRes.data) setAllTags(tagsRes.data)

        if (isEdit) {
          const res = await getPostById(Number(id))
          if (res.success && res.data) {
            setTitle(res.data.title)
            setContent(res.data.content)
            setCategoryId(res.data.category?.id ?? null)
          }
        }
      } catch (e) {
        console.error('初始化失败:', e)
      } finally {
        setInitLoading(false)
      }
    }
    init()
  }, [id, isEdit])

  // 从 markdown 中提取 #标签 → 返回 tagId 数组
  const extractTagIds = (md: string): number[] => {
    const matches = md.match(/(?<![#\n])#([a-zA-Z0-9一-龥_-]+)/g)
    if (!matches) return []
    const names = [...new Set(matches.map(t => t.slice(1)))]
    return names.map(name => allTags.find(t => t.name === name)?.id).filter(Boolean) as number[]
  }

  // 优先使用标题输入框，其次从 markdown 提取
  const resolveTitle = () => {
    if (title.trim()) return title.trim()
    const heading = content.match(/^#\s+(.+)/m)
    if (heading) return heading[1].trim()
    return ''
  }

  const handlePublish = async () => {
    if (!content.trim()) { message.warning('请输入内容'); return }
    const t = resolveTitle()
    if (!t) { message.warning('请输入标题'); return }
    try {
      setSaving(true)
      const slug = t.toLowerCase()
        .replace(/[^a-z0-9一-龥]+/g, '-')
        .replace(/(^-|-$)/g, '')
      const tagIds = extractTagIds(content)
      if (isEdit) {
        await updatePost(Number(id), { title: t, slug, summary: content.slice(0, 200), content, categoryId: categoryId || undefined, tagIds, status: 'published' })
        message.success('文章已更新')
      } else {
        await createPost({ title: t, slug, summary: content.slice(0, 200), content, categoryId: categoryId || undefined, tagIds, status: 'published' })
        message.success('文章已发布')
      }
      navigate('/blog')
    } catch {
      message.error('操作失败')
    } finally {
      setSaving(false)
    }
  }

  // 创建分类
  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await createCategory(newName.trim())
      if (res.success && res.data) {
        setCategories(prev => [...prev, res.data!])
        setCategoryId(res.data!.id)
        message.success('分类已创建')
      }
      setNewName('')
      setShowCreateCat(false)
    } catch {
      message.error('创建失败')
    } finally {
      setCreating(false)
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      setContent(text)
      message.success(`已导入 ${file.name}`)
    }
    reader.readAsText(file)
    if (importInputRef.current) importInputRef.current.value = ''
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadImage(file)
      if (res.success && res.data) {
        const md = `\n![${file.name}](${res.data.url})\n`
        setContent(c => c + md)
        message.success('图片已插入')
      } else {
        message.error(res.error?.message || '上传失败')
      }
    } catch {
      message.error('上传失败')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const insertText = (before: string, after = '') => {
    setContent(c => c + before + after)
  }

  // 工具栏 — 按功能分组
  const toolbarGroups: { items: { icon: JSX.Element; label: string; action: () => void; loading?: boolean }[] }[] = [
    {
      items: [
        { icon: <BoldOutlined />, label: '粗体 (Ctrl+B)', action: () => insertText('**', '**') },
        { icon: <ItalicOutlined />, label: '斜体 (Ctrl+I)', action: () => insertText('*', '*') },
      ],
    },
    {
      items: [
        { icon: <LinkOutlined />, label: '链接', action: () => insertText('[', '](url)') },
        { icon: <PictureOutlined />, label: '图片', action: () => fileInputRef.current?.click() },
        {
          icon: <ArrowLeftOutlined style={{ transform: 'rotate(315deg)' }} />,
          label: '导入 .md / .txt',
          action: () => importInputRef.current?.click(),
        },
      ],
    },
    {
      items: [
        { icon: <OrderedListOutlined />, label: '有序列表', action: () => insertText('\n1. ', '') },
        { icon: <UnorderedListOutlined />, label: '无序列表', action: () => insertText('\n- ', '') },
      ],
    },
  ]

  const wordCount = content.length
  const readMinutes = Math.max(1, Math.ceil(wordCount / 300))
  const currentCategory = categories.find(c => c.id === categoryId)

  if (initLoading) {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--page-bg)' }}>
        <Spin size="large" />
      </Layout>
    )
  }

  return (
    <AppLayout selectedKey="blogs-manage" onLogout={handleConfirmExit}>
      <div style={{
        animation: 'fadeIn 0.4s ease-out both',
        maxWidth: 1320, margin: '0 auto',
      }}>
        {/* ===== 顶部操作栏(标题上下堆叠) ===== */}
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
          minHeight: '56px',
        }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="fjj-btn-text"
            style={{
              color: 'var(--secondary-text)',
              width: '34px', height: '34px',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          />

          {/* 标题组 — 横向 emoji + 纵向标题/副标 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            paddingLeft: '4px',
          }}>
            {/* 左侧大 emoji,带柔光 */}
            <span style={{
              fontSize: '26px', lineHeight: 1,
              filter: 'drop-shadow(0 2px 6px rgba(102, 126, 234, 0.3))',
            }}>
              {isEdit ? '✏️' : '📝'}
            </span>
            {/* 右侧:主标题 + 副标题(纵向堆叠) */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center',
              gap: '4px',
            }}>
              <h2 style={{
                margin: 0,
                color: 'var(--text-color)',
                fontSize: '17px', fontWeight: 800,
                letterSpacing: '-0.2px',
                lineHeight: 1,
              }}>
                {isEdit ? '编辑文章' : '新建文章'}
              </h2>
              <span style={{
                color: 'var(--accent-start)',
                fontSize: '11px', fontWeight: 500,
                letterSpacing: '0.3px',
                lineHeight: 1,
                fontStyle: 'italic',
              }}>
                {isEdit ? '修改已有文章' : '开始你的创作'}
              </span>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <Button
            onClick={handleSaveDraft}
            loading={saving}
            className="fjj-btn-default"
            style={{
              borderRadius: '8px', height: '34px',
              padding: '0 14px',
              background: 'transparent',
              border: '1px solid var(--input-border)',
              color: 'var(--secondary-text)',
              fontWeight: 500,
            }}
          >
            保存草稿
          </Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            className="fjj-btn-primary"
            onClick={handlePublish}
            loading={saving}
            style={{
              borderRadius: '8px', height: '34px',
              padding: '0 18px', fontWeight: 600,
            }}
          >
            {isEdit ? '更新' : '发布'}
          </Button>
        </div>

        {/* ===== 标题区 — 编辑器级排版 ===== */}
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
          {/* 装饰渐变光晕 — 右上角 */}
          <div style={{
            position: 'absolute',
            top: '-80px', right: '-80px',
            width: '260px', height: '260px',
            background: 'radial-gradient(circle, var(--accent-start) 0%, transparent 70%)',
            opacity: 0.15,
            pointerEvents: 'none',
            filter: 'blur(20px)',
          }} />
          {/* 装饰渐变光晕 — 左下角 */}
          <div style={{
            position: 'absolute',
            bottom: '-100px', left: '-60px',
            width: '200px', height: '200px',
            background: 'radial-gradient(circle, var(--accent-end) 0%, transparent 70%)',
            opacity: 0.1,
            pointerEvents: 'none',
            filter: 'blur(20px)',
          }} />

          <div style={{ position: 'relative' }}>
            {/* 副标题装饰线 */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '12px',
            }}>
              <div style={{
                width: '24px', height: '2px',
                background: 'var(--accent-gradient)',
                borderRadius: '1px',
              }} />
              <span style={{
                color: 'var(--accent-start)',
                fontSize: '11px', fontWeight: 600,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}>
                TITLE
              </span>
            </div>

            <Input
              placeholder="无题文章 — 点这里开始书写..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              size="large"
              variant="borderless"
              style={{
                fontSize: '38px', fontWeight: 700,
                padding: 0, height: 'auto',
                color: 'var(--text-color)',
                letterSpacing: '-0.5px', lineHeight: 1.2,
              }}
            />

            {/* 副信息行:阅读时间 + 字数 + 分类(点击 📁 弹出卡片选择) */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              marginTop: '16px',
              color: 'var(--muted-text)',
              fontSize: '12px',
              fontVariantNumeric: 'tabular-nums',
              flexWrap: 'wrap',
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <ClockCircleOutlined style={{ fontSize: '12px' }} />
                {readMinutes} 分钟阅读
              </span>
              <span style={{
                width: '3px', height: '3px', borderRadius: '50%',
                background: 'var(--muted-text)', opacity: 0.5,
              }} />
              <span>{wordCount.toLocaleString()} 字</span>
              <span style={{
                width: '3px', height: '3px', borderRadius: '50%',
                background: 'var(--muted-text)', opacity: 0.5,
              }} />

              {/* 分类入口 — 点击 📁 弹出卡片 */}
              <Popover
                trigger="click"
                placement="bottomLeft"
                arrow={false}
                overlayClassName="category-popover"
                overlayInnerStyle={{ padding: 0, background: 'transparent', boxShadow: 'none' }}
                content={
                  <div style={{
                    width: '220px',
                    background: 'var(--card-bg)',
                    backdropFilter: 'blur(20px)',
                    border: 'var(--card-border)',
                    borderRadius: '12px',
                    padding: '6px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
                    animation: 'popoverSlideIn 0.2s ease-out',
                    transformOrigin: 'top left',
                  }}>
                    <div style={{
                      padding: '8px 10px 6px',
                      color: 'var(--muted-text)',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                    }}>
                      选择分类
                    </div>
                    {/* 分类列表 */}
                    <div style={{
                      maxHeight: '200px', overflowY: 'auto',
                      display: 'flex', flexDirection: 'column', gap: '2px',
                    }}>
                      {/* 无分类选项 */}
                      <div
                        onClick={() => setCategoryId(null)}
                        className="hover-list-item"
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: 'var(--secondary-text)',
                          display: 'flex', alignItems: 'center', gap: '8px',
                          background: categoryId === null ? 'rgba(102, 126, 234, 0.12)' : 'transparent',
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>📄</span>
                        <span style={{ flex: 1 }}>未分类</span>
                        {categoryId === null && (
                          <span style={{ color: 'var(--accent-start)', fontSize: '14px' }}>✓</span>
                        )}
                      </div>
                      {categories.map(c => (
                        <div
                          key={c.id}
                          onClick={() => setCategoryId(c.id)}
                          className="hover-list-item"
                          style={{
                            padding: '8px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: 'var(--secondary-text)',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: categoryId === c.id ? 'rgba(102, 126, 234, 0.12)' : 'transparent',
                          }}
                        >
                          <span style={{ fontSize: '14px' }}>📁</span>
                          <span style={{ flex: 1 }}>{c.name}</span>
                          {categoryId === c.id && (
                            <span style={{ color: 'var(--accent-start)', fontSize: '14px' }}>✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* 分隔线 */}
                    <div style={{
                      height: '1px', margin: '4px 0',
                      background: 'var(--divider-color)',
                    }} />
                    {/* 新建分类按钮 */}
                    <div
                      onClick={() => setShowCreateCat(true)}
                      className="hover-list-item"
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: 'var(--accent-start)',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontWeight: 500,
                      }}
                    >
                      <PlusOutlined style={{ fontSize: '12px' }} />
                      <span>新建分类</span>
                    </div>
                  </div>
                }
              >
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  cursor: 'pointer',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  color: currentCategory ? 'var(--accent-start)' : 'var(--muted-text)',
                }}
                  className="category-trigger"
                >
                  <span style={{ fontSize: '13px' }}>📁</span>
                  <span style={{ fontWeight: currentCategory ? 500 : 400 }}>
                    {currentCategory ? currentCategory.name : '选择分类'}
                  </span>
                </span>
              </Popover>
            </div>
          </div>
        </div>

        {/* ===== 编辑器工具栏 ===== */}
        <div style={{
          display: 'flex', alignItems: 'center',
          marginBottom: '16px',
          padding: '8px 12px',
          background: 'var(--card-bg)',
          border: 'var(--card-border)',
          borderRadius: '14px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
          <input ref={importInputRef} type="file" accept=".md,.txt,text/plain,text/markdown" style={{ display: 'none' }} onChange={handleImportFile} />

          {/* 工具栏按钮组 */}
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            {toolbarGroups.map((group, gIdx) => (
              <div key={gIdx} style={{ display: 'flex', alignItems: 'center' }}>
                {group.items.map((btn, idx) => (
                  <Tooltip key={idx} title={btn.label}>
                    <Button
                      size="small"
                      icon={btn.icon}
                      onClick={btn.action}
                      loading={btn.label === '图片' ? uploading : false}
                      className="toolbar-btn"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--secondary-text)',
                        width: '32px', height: '32px',
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </Tooltip>
                ))}
                {gIdx < toolbarGroups.length - 1 && (
                  <div style={{
                    width: '1px', height: '20px',
                    background: 'var(--divider-color)',
                    margin: '0 8px',
                    opacity: 0.4,
                  }} />
                )}
              </div>
            ))}

            {/* 字号控制(独立组) */}
            <div style={{
              width: '1px', height: '20px',
              background: 'var(--divider-color)',
              margin: '0 8px', opacity: 0.4,
            }} />
            <Tooltip title="缩小字号">
              <Button
                size="small"
                onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                className="toolbar-btn"
                style={{
                  background: 'transparent', border: 'none',
                  color: 'var(--secondary-text)',
                  width: '32px', height: '32px',
                  fontSize: '12px', padding: 0,
                  borderRadius: '8px',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                }}
              >
                A−
              </Button>
            </Tooltip>
            <div style={{
              padding: '4px 10px',
              background: 'var(--segmented-bg)',
              borderRadius: '6px',
              fontSize: '11px',
              color: 'var(--text-color)',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 600,
              minWidth: '44px', textAlign: 'center',
            }}>
              {fontSize}px
            </div>
            <Tooltip title="放大字号">
              <Button
                size="small"
                onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                className="toolbar-btn"
                style={{
                  background: 'transparent', border: 'none',
                  color: 'var(--secondary-text)',
                  width: '32px', height: '32px',
                  fontSize: '12px', padding: 0,
                  borderRadius: '8px',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                }}
              >
                A+
              </Button>
            </Tooltip>
          </div>

          <div style={{ flex: 1 }} />

          {/* 右侧统计 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            color: 'var(--muted-text)',
            fontSize: '12px',
            fontVariantNumeric: 'tabular-nums',
          }}>
            <span>{wordCount.toLocaleString()} 字</span>
            <div style={{
              width: '3px', height: '3px', borderRadius: '50%',
              background: 'var(--muted-text)', opacity: 0.5,
            }} />
            <span>{readMinutes} 分钟</span>
          </div>
        </div>

        {/* ===== 三栏布局 ===== */}
        <Row gutter={16} style={{ height: 'calc(100vh - 360px)', minHeight: '520px' }}>
          {/* 左侧 — 标题大纲 */}
          <Col xs={0} lg={4}>
            <div className="editor-bg" style={{
              background: 'transparent',
              border: '1px solid var(--input-border)',
              borderRadius: '14px',
              height: '100%', overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{
                padding: '14px 18px',
                borderBottom: 'var(--divider-color)',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ fontSize: '15px' }}>📑</span>
                <span style={{
                  color: 'var(--text-color)',
                  fontSize: '13px', fontWeight: 600,
                  letterSpacing: '0.3px',
                }}>
                  大纲
                </span>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '10px 8px' }}>
                {content.match(/^#{1,6}\s+.+/gm)?.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {content.match(/^#{1,6}\s+.+/gm)!.map((h, i) => {
                      const level = h.match(/^#+/)![0].length
                      const text = h.replace(/^#+\s*/, '')
                      return (
                        <div key={i} className="hover-list-item" style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: level <= 2 ? 600 : 400,
                          color: 'var(--secondary-text)',
                          marginLeft: `${(level - 1) * 8}px`,
                          lineHeight: 1.4,
                          transition: 'all 0.15s ease',
                          borderLeft: level <= 2 ? '2px solid var(--accent-start)' : '2px solid transparent',
                        }}
                          onClick={() => {
                            const els = document.querySelectorAll('h1,h2,h3,h4,h5,h6')
                            for (const el of els) { if (el.textContent?.trim() === text) { el.scrollIntoView({ behavior: 'smooth' }); break } }
                          }}
                        >
                          {text}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{
                    padding: '40px 16px',
                    color: 'var(--muted-text)',
                    fontSize: '12px',
                    textAlign: 'center',
                    lineHeight: 1.7,
                  }}>
                    <div style={{ fontSize: '28px', marginBottom: '12px', opacity: 0.4 }}>📝</div>
                    用 <code style={{
                      background: 'var(--segmented-bg)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: 'var(--accent-start)',
                      fontFamily: 'monospace',
                    }}>#</code><br />添加章节标题
                  </div>
                )}
              </div>
            </div>
          </Col>

          {/* 右侧 — 编辑 + 预览 */}
          <Col xs={24} lg={20}>
            <Row gutter={16} style={{ height: '100%' }}>
              {/* 编辑区 */}
              <Col span={12}>
                <div className="editor-bg" style={{
                  background: 'transparent',
                  border: '1px solid var(--input-border)',
                  borderRadius: '14px',
                  height: '100%',
                  display: 'flex', flexDirection: 'column',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '14px 18px',
                    borderBottom: 'var(--divider-color)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <span style={{ fontSize: '15px' }}>✏️</span>
                    <span style={{
                      color: 'var(--text-color)',
                      fontSize: '13px', fontWeight: 600,
                      letterSpacing: '0.3px',
                    }}>
                      编辑
                    </span>
                    <div style={{ flex: 1 }} />
                    <span style={{
                      fontSize: '10px',
                      color: 'var(--muted-text)',
                      padding: '2px 8px',
                      background: 'var(--segmented-bg)',
                      borderRadius: '4px',
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                    }}>
                      MARKDOWN
                    </span>
                  </div>
                  <TextArea
                    placeholder={'# 你好\n\n开始你的创作...\n\n支持 **Markdown** 语法:\n- 标题 (# ## ###)\n- 列表 (- 1.)\n- 链接 [文字](url)\n- 图片 ![alt](url)\n- 引用 > \n- 代码 ```'}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-color)',
                      fontSize: `${fontSize}px`,
                      flex: 1, resize: 'none',
                      padding: '20px 22px',
                      lineHeight: 1.75,
                      fontFamily: '"SF Mono", Monaco, Menlo, Consolas, "Courier New", monospace',
                    }}
                  />
                </div>
              </Col>

              {/* 预览区 */}
              <Col span={12}>
                <div className="editor-bg" style={{
                  background: 'transparent',
                  border: '1px solid var(--input-border)',
                  borderRadius: '14px',
                  height: '100%',
                  display: 'flex', flexDirection: 'column',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '14px 18px',
                    borderBottom: 'var(--divider-color)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <span style={{ fontSize: '15px' }}>👁️</span>
                    <span style={{
                      color: 'var(--text-color)',
                      fontSize: '13px', fontWeight: 600,
                      letterSpacing: '0.3px',
                    }}>
                      预览
                    </span>
                    <div style={{ flex: 1 }} />
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      fontSize: '10px',
                      color: 'var(--accent-start)',
                      padding: '2px 8px',
                      background: 'rgba(102, 126, 234, 0.1)',
                      borderRadius: '4px',
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                    }}>
                      <div style={{
                        width: '5px', height: '5px', borderRadius: '50%',
                        background: 'var(--accent-start)',
                        animation: 'pulse 2s ease-in-out infinite',
                      }} />
                      LIVE
                    </div>
                  </div>
                  <div style={{
                    flex: 1, overflow: 'auto',
                    padding: '20px 22px',
                    color: 'var(--text-color)',
                  }}>
                    {content.trim() ? (
                      <MarkdownPreview
                        source={content}
                        style={{
                          fontSize: `${fontSize}px`,
                          background: 'transparent',
                        }}
                      />
                    ) : (
                      <div style={{
                        height: '100%',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        color: 'var(--muted-text)',
                        fontSize: '13px',
                        textAlign: 'center',
                        gap: '8px',
                      }}>
                        <div style={{
                          width: '64px', height: '64px',
                          borderRadius: '50%',
                          background: 'var(--segmented-bg)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '28px',
                          opacity: 0.6,
                        }}>
                          ✨
                        </div>
                        <div style={{ fontWeight: 500 }}>开始写作,实时预览</div>
                        <div style={{ fontSize: '11px', opacity: 0.7 }}>
                          支持 Markdown 语法
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* ===== 新建分类弹窗 ===== */}
        <Modal
          open={showCreateCat}
          onCancel={() => setShowCreateCat(false)}
          footer={null}
          width={400}
          destroyOnClose
          closable={false}
          centered
        >
          <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '26px',
              boxShadow: 'var(--btn-primary-shadow)',
            }}>
              📂
            </div>
            <h3 style={{
              margin: '0 0 6px', color: 'var(--text-color)',
              fontSize: '18px', fontWeight: 700,
            }}>
              创建新分类
            </h3>
            <p style={{
              margin: '0 0 24px', color: 'var(--muted-text)',
              fontSize: '13px',
            }}>
              给你的文章归类,方便日后查找
            </p>
            <Input
              placeholder="输入分类名称"
              prefix={
                <span style={{ color: 'var(--accent-start)', fontWeight: 700 }}>#</span>
              }
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onPressEnter={handleCreate}
              style={{
                borderRadius: '10px', marginBottom: '20px',
                background: 'transparent',
                border: '1px solid var(--input-border)',
                color: 'var(--text-color)',
                height: '42px',
              }}
              size="large"
              autoFocus
            />
            <Space style={{ width: '100%', justifyContent: 'center' }} size="middle">
              <Button
                onClick={() => setShowCreateCat(false)}
                style={{
                  borderRadius: '10px',
                  minWidth: '100px', height: '38px',
                  background: 'transparent',
                  border: '1px solid var(--input-border)',
                  color: 'var(--secondary-text)',
                }}
              >
                取消
              </Button>
              <Button
                type="primary"
                className="fjj-btn-primary"
                onClick={handleCreate}
                loading={creating}
                style={{
                  borderRadius: '10px',
                  minWidth: '100px', height: '38px',
                  fontWeight: 600,
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

export default BlogEditor