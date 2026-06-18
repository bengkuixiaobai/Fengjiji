import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Layout, Row, Col, Space, Button, Input, Tooltip, Spin,
  TreeSelect, message, Modal,
} from 'antd'
import {
  CheckCircleOutlined,
  BoldOutlined, ItalicOutlined, LinkOutlined, PictureOutlined,
  OrderedListOutlined, UnorderedListOutlined, ArrowLeftOutlined,
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

  const toolbarButtons = [
    { icon: <BoldOutlined />, label: '粗体', action: () => insertText('**', '**') },
    { icon: <ItalicOutlined />, label: '斜体', action: () => insertText('*', '*') },
    { icon: <LinkOutlined />, label: '链接', action: () => insertText('[', '](url)') },
    { icon: <PictureOutlined />, label: '图片', action: () => fileInputRef.current?.click() },
    { icon: <OrderedListOutlined />, label: '有序列表', action: () => insertText('\n1. ', '') },
    { icon: <UnorderedListOutlined />, label: '无序列表', action: () => insertText('\n- ', '') },
  ]

  if (initLoading) {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--page-bg)' }}>
        <Spin size="large" />
      </Layout>
    )
  }

  return (
    <AppLayout selectedKey="blogs" onLogout={handleConfirmExit}>
      <div style={{ animation: 'fadeIn 0.35s ease-out both' }}>
        {/* 顶部操作栏 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}
              style={{ color: 'var(--secondary-text)', height: '32px', display: 'flex', alignItems: 'center' }} />
            <h2 style={{ color: 'var(--text-color)', margin: 0, fontSize: '20px', fontWeight: 700, lineHeight: '32px' }}>
              {isEdit ? '✏️ 编辑文章' : '📝 新建文章'}
            </h2>
          </div>
          <Space size="small">
            <Button onClick={handleSaveDraft} loading={saving}
              style={{ borderRadius: '8px' }}>
              保存草稿
            </Button>
            <Button type="primary" icon={<CheckCircleOutlined />}
              className="fjj-btn-primary" onClick={handlePublish} loading={saving}
              style={{ borderRadius: '8px' }}>
              {isEdit ? '更新' : '发布'}
            </Button>
          </Space>
        </div>

        {/* 标题输入框 — 最上方 */}
        <Input
          placeholder="输入文章标题..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          size="large"
          variant="borderless"
          style={{
            fontSize: '36px', fontWeight: 700, padding: '8px 0 18px', height: '72px',
            color: 'var(--text-color)',
          }}
        />

        {/* 目录选择器 — 独立框 */}
        <div style={{
          marginBottom: '10px', padding: '8px 12px',
          background: 'var(--card-bg)', border: 'var(--card-border)',
          borderRadius: '8px',
        }}>
          <TreeSelect
            placeholder="📁 选择目录"
            value={categoryId}
            onChange={setCategoryId}
            className="editor-bg"
            style={{ width: '100%' }}
            allowClear
            treeDefaultExpandAll
            treeData={[
              {
                title: '全部文章', value: 'root',
                children: categories.map(c => ({ title: c.name, value: c.id })),
              },
            ]}
            size="small"
            dropdownStyle={{ background: 'var(--card-bg)' }}
          />
        </div>

        {/* 编辑器工具栏 — 左侧功能 + 右侧字数 */}
        <div style={{
          display: 'flex', alignItems: 'center',
          marginBottom: '12px', padding: '6px 12px',
          background: 'var(--card-bg)', border: 'var(--card-border)',
          borderRadius: '8px',
        }}>
          {/* 工具栏按钮 — 最左边 + 字体调整 */}
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            <input ref={importInputRef} type="file" accept=".md,.txt,text/plain,text/markdown" style={{ display: 'none' }} onChange={handleImportFile} />
            <Tooltip title="导入 .md / .txt">
              <Button size="small" icon={<ArrowLeftOutlined style={{ transform: 'rotate(315deg)' }} />}
                onClick={() => importInputRef.current?.click()}
                style={{ background: 'var(--segmented-bg)', border: 'none', color: 'var(--segmented-text)' }} />
            </Tooltip>
            {toolbarButtons.map((btn, idx) => (
              <Tooltip key={idx} title={btn.label}>
                <Button size="small" icon={btn.icon} onClick={btn.action}
                  loading={btn.label === '图片' ? uploading : false}
                  style={{ background: 'var(--segmented-bg)', border: 'none', color: 'var(--segmented-text)' }} />
              </Tooltip>
            ))}
            <div style={{ width: '1px', height: '20px', background: 'var(--divider-color)', margin: '0 6px' }} />
            <Button size="small" onClick={() => setFontSize(Math.max(12, fontSize - 1))}
              style={{ background: 'var(--segmented-bg)', border: 'none', color: 'var(--segmented-text)', width: '24px', height: '24px', fontSize: '11px', padding: 0 }}>
              A-
            </Button>
            <span style={{ color: 'var(--text-color)', fontSize: '12px', minWidth: '28px', textAlign: 'center' }}>{fontSize}px</span>
            <Button size="small" onClick={() => setFontSize(Math.min(24, fontSize + 1))}
              style={{ background: 'var(--segmented-bg)', border: 'none', color: 'var(--segmented-text)', width: '24px', height: '24px', fontSize: '11px', padding: 0 }}>
              A+
            </Button>
          </div>

          {/* 右侧 — 仅字数 */}
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ color: 'var(--muted-text)', fontSize: '12px' }}>
              {content.length} 字
            </span>
          </div>
        </div>

        {/* 三栏布局：TOC + 编辑 + 预览 */}
        <Row gutter={12} style={{ height: 'calc(100vh - 240px)', minHeight: '500px' }}>
          {/* 左侧 — 标题索引 */}
          <Col xs={0} lg={3}>
            <div className="editor-bg" style={{
              background: 'transparent',
              border: '1px solid var(--input-border)',
              borderRadius: '8px',
              height: '100%', overflow: 'auto',
            }}>
              <div style={{ padding: '8px 14px', fontSize: '14px', color: 'var(--muted-text)', borderBottom: 'var(--divider-color)' }}>📑 标题</div>
              {content.match(/^#{1,6}\s+.+/gm)?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {content.match(/^#{1,6}\s+.+/gm)!.map((h, i) => {
                    const level = h.match(/^#+/)![0].length
                    const text = h.replace(/^#+\s*/, '')
                    return (
                      <div key={i} style={{
                        padding: '4px 8px', borderRadius: '4px', cursor: 'pointer',
                        fontSize: '14px', fontWeight: level <= 2 ? 600 : 400,
                        color: 'var(--secondary-text)',
                        marginLeft: `${(level - 1) * 12}px`,
                      }}
                        onClick={() => {
                          const els = document.querySelectorAll('h1,h2,h3,h4,h5,h6')
                          for (const el of els) { if (el.textContent?.trim() === text) { el.scrollIntoView({ behavior: 'smooth' }); break } }
                        }}
                      >{text}</div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ padding: '14px 14px', color: 'var(--muted-text)', fontSize: '14px' }}>用 # 添加标题</div>
              )}
            </div>
          </Col>

          {/* 右侧 — 编辑预览各一半 */}
          <Col xs={24} lg={21}>
            <Row gutter={12} style={{ height: '100%' }}>
            {/* 编辑区 */}
            <Col span={12}>
            <div className="editor-bg" style={{
              background: 'transparent', border: '1px solid var(--input-border)',
              borderRadius: '8px', overflow: 'hidden',
              height: '100%', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ padding: '8px 14px', fontSize: '14px', color: 'var(--muted-text)', borderBottom: 'var(--divider-color)' }}>
                ✏️ 编辑
              </div>
              <TextArea
                placeholder="开始写作..."
                value={content}
                onChange={e => setContent(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', fontSize: `${fontSize}px`, flex: 1, resize: 'none', padding: '14px 14px' }}
              />
            </div>
            </Col>

            {/* 预览区 */}
            <Col span={12}>
            <div className="editor-bg" style={{
              background: 'transparent', border: '1px solid var(--input-border)',
              borderRadius: '8px', overflow: 'auto',
              height: '100%',
            }}>
              <div style={{ padding: '8px 14px', fontSize: '14px', color: 'var(--muted-text)', borderBottom: 'var(--divider-color)' }}>
                👁️ 预览
              </div>
              <div style={{ padding: '14px 14px', color: 'var(--text-color)' }}>
                {content.trim() ? (
                  <MarkdownPreview source={content} style={{ fontSize: `${fontSize}px` }} />
                ) : (
                  <div style={{ color: 'var(--muted-text)', fontSize: '14px' }}>开始写作，实时预览</div>
                )}
              </div>
            </div>
            </Col>
          </Row>
        </Col>
      </Row>

        {/* 新建分类弹窗 */}
        <Modal
          open={showCreateCat}
          onCancel={() => setShowCreateCat(false)}
          footer={null}
          width={380}
          destroyOnClose
          closable={false}
          centered
        >
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', fontSize: '22px',
            }}>
              📂
            </div>
            <h3 style={{ margin: '0 0 4px', color: 'var(--text-color)', fontSize: '17px', fontWeight: 600 }}>
              添加分类
            </h3>
            <p style={{ margin: '0 0 20px', color: 'var(--muted-text)', fontSize: '13px' }}>
              新建一个文章分类
            </p>
            <Input
              placeholder="输入分类名称"
              prefix="#"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onPressEnter={handleCreate}
              style={{
                borderRadius: '8px', marginBottom: '16px',
                background: 'transparent', border: 'none',
                color: 'var(--text-color)',
              }}
              size="middle"
              autoFocus
            />
            <Space style={{ width: '100%', justifyContent: 'center' }} size="middle">
              <Button onClick={() => setShowCreateCat(false)}
                style={{ borderRadius: '8px', minWidth: '90px' }}>
                取消
              </Button>
              <Button type="primary" className="fjj-btn-primary"
                onClick={handleCreate} loading={creating}
                style={{ borderRadius: '8px', minWidth: '90px' }}>
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
