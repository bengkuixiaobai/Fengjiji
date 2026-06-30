// 文章 meta 信息 — 作者头像 + 发布时间 + 阅读/点赞
// 用于列表卡片与详情页头
import { Space } from 'antd'
import { Avatar } from 'antd'
import { CalendarOutlined, EyeOutlined, LikeOutlined, UserOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Post } from '../../services/post'

interface PostMetaProps {
  post: Pick<Post, 'viewCount' | 'likeCount' | 'createdAt' | 'publishedAt' | 'author'>
  showAuthor?: boolean
  fontSize?: number
}

export default function PostMeta({ post, showAuthor = true, fontSize = 12 }: PostMetaProps) {
  const date = post.publishedAt ?? post.createdAt
  const textColor = 'var(--muted-text)'
  return (
    <Space size={showAuthor ? 'middle' : 'small'} wrap style={{ color: textColor, fontSize }}>
      {showAuthor && (
        <Space size={4}>
          <Avatar size={fontSize + 8} icon={<UserOutlined />} src={post.author.avatar} style={{ backgroundColor: 'var(--accent-start)' }} />
          <span style={{ color: 'var(--secondary-text)' }}>{post.author.nickname || post.author.username}</span>
        </Space>
      )}
      <span><CalendarOutlined /> {dayjs(date).format('YYYY-MM-DD')}</span>
      <span><EyeOutlined /> {post.viewCount}</span>
      <span><LikeOutlined /> {post.likeCount}</span>
    </Space>
  )
}