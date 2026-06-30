// 博客详情页 — Markdown 渲染 + 点赞/分享/上下篇
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, Spin, Button, Tag, Space, message, Divider } from 'antd'
import {
  LikeOutlined, LikeFilled,
  ShareAltOutlined, EyeOutlined,
  CalendarOutlined, ArrowLeftOutlined, ArrowRightOutlined,
  ProjectOutlined, GithubOutlined, LinkOutlined, MessageOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import AppLayout from '../../components/AppLayout'
import MarkdownRenderer from '../../components/blog/MarkdownRenderer'
import CategoryBadge from '../../components/blog/CategoryBadge'
import TagList from '../../components/blog/TagList'
import {
  getPostById, recordView, toggleLike, getLikeStatus, getAdjacentPosts,
  type Post,
} from '../../services/post'

function BlogDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [viewCount, setViewCount] = useState(0)
  const [adjacent, setAdjacent] = useState<{ prev: Post | null; next: Post | null }>({ prev: null, next: null })

  // 拉取文章 + 自动 +1 阅读量 + 点赞状态
  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const res = await getPostById(slug)
      if (cancelled) return
      if (!res.success || !res.data) {
        message.error('文章不存在或已被删除')
        navigate('/blogs', { replace: true })
        return
      }
      setPost(res.data)
      setLikeCount(res.data.likeCount)
      setViewCount(res.data.viewCount)
      setLoading(false)

      // 异步:阅读量 +1 + 点赞状态 + 上下篇(不阻塞渲染)
      recordView(slug)
      getLikeStatus(slug).then(s => {
        if (!cancelled && s.success) {
          setLiked(s.data.liked)
          setLikeCount(s.data.likeCount)
        }
      })
      getAdjacentPosts(slug).then(a => {
        if (!cancelled) setAdjacent(a)
      })
    })()
    return () => {
      cancelled = true
    }
  }, [slug, navigate])

  // 监听浏览量变化(因为 recordView 是异步的)
  useEffect(() => {
    if (post) setViewCount(post.viewCount + 1) // 乐观 +1
  }, [post?.id])

  const handleLike = async () => {
    if (!post) return
    // 乐观更新
    const nextLiked = !liked
    setLiked(nextLiked)
    setLikeCount(c => c + (nextLiked ? 1 : -1))
    const res = await toggleLike(slug!)
    if (res.success) {
      setLiked(res.data.liked)
      setLikeCount(res.data.likeCount)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      message.success('链接已复制到剪贴板')
    } catch {
      message.warning('复制失败,请手动复制 URL')
    }
  }

  if (loading || !post) {
    return (
      <AppLayout selectedKey="blogs-view">
        <div style={{ textAlign: 'center', padding: '120px 0' }}>
          <Spin size="large" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout selectedKey="blogs-view">
      <div style={{ animation: 'fadeIn 0.35s ease-out both', maxWidth: 860, margin: '0 auto' }}>
        {/* 返回 + 面包屑 */}
        <div style={{ marginBottom: '16px' }}>
          <Link to="/blogs" style={{ color: 'var(--muted-text)', fontSize: '13px' }}>
            <ArrowLeftOutlined /> 返回博客列表
          </Link>
        </div>

        {/* 文章头 */}
        <header style={{ marginBottom: '24px' }}>
          <Space size={8} wrap style={{ marginBottom: '12px' }}>
            <CategoryBadge category={post.category} />
          </Space>
          <h1
            style={{
              margin: '8px 0 12px',
              fontSize: '36px',
              fontWeight: 700,
              color: 'var(--text-color)',
              lineHeight: 1.3,
            }}
          >
            {post.title}
          </h1>
          {post.summary && (
            <p
              style={{
                margin: '0 0 14px',
                fontSize: '15px',
                color: 'var(--secondary-text)',
                fontStyle: 'italic',
                lineHeight: 1.6,
              }}
            >
              {post.summary}
            </p>
          )}
          <Space size="middle" wrap style={{ color: 'var(--muted-text)', fontSize: '13px' }}>
            <span>
              👤 <span style={{ color: 'var(--secondary-text)' }}>{post.author.nickname || post.author.username}</span>
            </span>
            <span><CalendarOutlined /> {dayjs(post.publishedAt ?? post.createdAt).format('YYYY-MM-DD HH:mm')}</span>
            <span><EyeOutlined /> {viewCount} 阅读</span>
            <span><LikeOutlined /> {likeCount} 点赞</span>
          </Space>
        </header>

        {/* Markdown 正文 */}
        <Card
          style={{
            background: 'var(--card-bg)',
            border: 'var(--card-border)',
            borderRadius: '12px',
          }}
          styles={{ body: { padding: '32px 36px' } }}
        >
          <MarkdownRenderer content={post.content} />

          {/* 底部标签 */}
          {post.tags.length > 0 && (
            <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: 'var(--divider-color)' }}>
              <div style={{ color: 'var(--muted-text)', fontSize: '13px', marginBottom: '8px' }}>🏷️ 标签</div>
              <TagList tags={post.tags} size="default" />
            </div>
          )}
        </Card>

        {/* 互动栏 */}
        <Card
          style={{
            background: 'var(--card-bg)',
            border: 'var(--card-border)',
            borderRadius: '12px',
            marginTop: '20px',
          }}
          styles={{ body: { padding: '14px 20px' } }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <Button
              size="large"
              icon={liked ? <LikeFilled style={{ color: '#f472b6' }} /> : <LikeOutlined />}
              onClick={handleLike}
              className={liked ? 'fjj-btn-primary' : ''}
              type={liked ? 'primary' : 'default'}
            >
              {liked ? '已点赞' : '点赞'} ({likeCount})
            </Button>
            <Button
              size="large"
              icon={<ShareAltOutlined />}
              onClick={handleShare}
            >
              分享
            </Button>
            <Button
              size="large"
              icon={<MessageOutlined />}
              disabled
              title="评论功能开发中"
            >
              评论
            </Button>
          </div>
        </Card>

        {/* 关联项目 */}
        {/* @ts-ignore — Project 字段暂未在 Post 接口中,但 mock 数据可能包含 */}
        {(post as any).project && (
          <Card
            style={{
              background: 'var(--card-bg)',
              border: 'var(--card-border)',
              borderRadius: '12px',
              marginTop: '20px',
            }}
            styles={{ body: { padding: '18px 24px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <ProjectOutlined style={{ color: 'var(--accent-start)', fontSize: '16px' }} />
              <span style={{ fontWeight: 600, color: 'var(--text-color)' }}>关联项目</span>
            </div>
            <div style={{ color: 'var(--secondary-text)', fontSize: '14px', marginBottom: '10px' }}>
              {(post as any).project.name}
            </div>
            <Space>
              {(post as any).project.codeUrl && (
                <a href={(post as any).project.codeUrl} target="_blank" rel="noopener noreferrer">
                  <Tag icon={<GithubOutlined />} color="default" style={{ cursor: 'pointer' }}>源码</Tag>
                </a>
              )}
              {(post as any).project.demoUrl && (
                <a href={(post as any).project.demoUrl} target="_blank" rel="noopener noreferrer">
                  <Tag icon={<LinkOutlined />} color="default" style={{ cursor: 'pointer' }}>演示</Tag>
                </a>
              )}
            </Space>
          </Card>
        )}

        {/* 上下篇导航 */}
        <Card
          style={{
            background: 'var(--card-bg)',
            border: 'var(--card-border)',
            borderRadius: '12px',
            marginTop: '20px',
          }}
          styles={{ body: { padding: '14px 20px' } }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {adjacent.prev ? (
                <div
                  onClick={() => navigate(`/blogs/${adjacent.prev!.slug}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--muted-text)', marginBottom: '4px' }}>
                    <ArrowLeftOutlined /> 上一篇
                  </div>
                  <div style={{ color: 'var(--text-color)', fontSize: '14px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {adjacent.prev.title}
                  </div>
                </div>
              ) : (
                <span style={{ color: 'var(--muted-text)', fontSize: '13px' }}>— 已经是第一篇了 —</span>
              )}
            </div>
            <Divider type="vertical" style={{ height: 'auto' }} />
            <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
              {adjacent.next ? (
                <div
                  onClick={() => navigate(`/blogs/${adjacent.next!.slug}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--muted-text)', marginBottom: '4px' }}>
                    下一篇 <ArrowRightOutlined />
                  </div>
                  <div style={{ color: 'var(--text-color)', fontSize: '14px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {adjacent.next.title}
                  </div>
                </div>
              ) : (
                <span style={{ color: 'var(--muted-text)', fontSize: '13px' }}>— 已经是最后一篇了 —</span>
              )}
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}

export default BlogDetail