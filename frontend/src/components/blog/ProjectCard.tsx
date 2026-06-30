// 项目卡片 — 与 PostCard 视觉对齐,支持 grid / list 两种布局
import { Card, Tag, Progress, Space, Button } from 'antd'
import {
  GithubOutlined, LinkOutlined, RocketOutlined, ClockCircleOutlined, CheckCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { Project } from '../../services/project'

interface ProjectCardProps {
  project: Project
  variant?: 'grid' | 'list'
}

// 状态映射
const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  planning: { label: '规划中', color: 'warning', icon: <ClockCircleOutlined /> },
  in_progress: { label: '进行中', color: 'processing', icon: <RocketOutlined /> },
  completed: { label: '已完成', color: 'success', icon: <CheckCircleOutlined /> },
}

function StatusBadge({ status }: { status: Project['status'] }) {
  const info = STATUS_MAP[status]
  if (!info) return null
  return (
    <Tag
      color={info.color}
      icon={info.icon}
      style={{ margin: 0, borderRadius: '6px', fontWeight: 500 }}
    >
      {info.label}
    </Tag>
  )
}

function TechStack({ stack }: { stack: string[] }) {
  if (!stack || stack.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
      {stack.slice(0, 4).map(t => (
        <Tag
          key={t}
          style={{
            margin: 0,
            background: 'var(--tag-bg)',
            color: 'var(--tag-color)',
            border: 'none',
            fontSize: '11px',
            borderRadius: '4px',
            padding: '0 6px',
            lineHeight: '20px',
          }}
        >
          {t}
        </Tag>
      ))}
      {stack.length > 4 && (
        <span style={{ fontSize: '11px', color: 'var(--muted-text)', alignSelf: 'center' }}>
          +{stack.length - 4}
        </span>
      )}
    </div>
  )
}

function ProjectCard({ project, variant = 'grid' }: ProjectCardProps) {
  const navigate = useNavigate()
  const goDetail = () => navigate(`/projects/${project.id}`)

  if (variant === 'list') {
    // 列表行式 — 类似 BlogManage 的紧凑行
    return (
      <div
        className="hover-list-item"
        style={{
          padding: '16px 20px',
          borderBottom: 'var(--divider-color)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
        onClick={goDetail}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <StatusBadge status={project.status} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-color)', flex: 1 }}>
            {project.name}
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--muted-text)', fontWeight: 500 }}>
            {project.completionRate}%
          </span>
        </div>
        {project.description && (
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-text)', lineHeight: 1.6 }}>
            {project.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Progress
              percent={project.completionRate}
              size="small"
              strokeColor={{ '0%': 'var(--accent-start)', '100%': 'var(--accent-end)' }}
              showInfo={false}
            />
          </div>
          <TechStack stack={project.techStack} />
          <Space size={4}>
            {project.codeUrl && (
              <Button
                type="text"
                size="small"
                icon={<GithubOutlined />}
                onClick={(e) => { e.stopPropagation(); window.open(project.codeUrl, '_blank') }}
                style={{ color: 'var(--secondary-text)' }}
              >
                源码
              </Button>
            )}
            {project.demoUrl && (
              <Button
                type="text"
                size="small"
                icon={<LinkOutlined />}
                onClick={(e) => { e.stopPropagation(); window.open(project.demoUrl, '_blank') }}
                style={{ color: 'var(--secondary-text)' }}
              >
                演示
              </Button>
            )}
          </Space>
        </div>
      </div>
    )
  }

  // grid 模式:舒展卡片,留足呼吸空间
  return (
    <Card
      hoverable
      onClick={goDetail}
      style={{
        background: 'var(--card-bg)',
        border: 'var(--card-border)',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      styles={{
        body: {
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        },
      }}
    >
      {/* 顶部:状态 + 完成度 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <StatusBadge status={project.status} />
        <span style={{ fontSize: '12px', color: 'var(--muted-text)', fontWeight: 600 }}>
          {project.completionRate}%
        </span>
      </div>

      {/* 名称 */}
      <h3
        style={{
          margin: 0,
          fontSize: '17px',
          fontWeight: 700,
          color: 'var(--text-color)',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {project.name}
      </h3>

      {/* 描述 — 最多 3 行,自然高度 */}
      {project.description && (
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            color: 'var(--muted-text)',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minHeight: '62px',
          }}
        >
          {project.description}
        </p>
      )}

      {/* 进度条 */}
      <Progress
        percent={project.completionRate}
        size="small"
        strokeColor={{ '0%': 'var(--accent-start)', '100%': 'var(--accent-end)' }}
        showInfo={false}
      />

      {/* 底部:技术栈 + 链接 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <TechStack stack={project.techStack} />
        <Space size={4} onClick={(e) => e.stopPropagation()}>
          {project.codeUrl && (
            <Button
              type="text"
              size="small"
              icon={<GithubOutlined />}
              onClick={(e) => { e.stopPropagation(); window.open(project.codeUrl, '_blank') }}
              style={{ color: 'var(--secondary-text)', padding: '0 4px' }}
            />
          )}
          {project.demoUrl && (
            <Button
              type="text"
              size="small"
              icon={<LinkOutlined />}
              onClick={(e) => { e.stopPropagation(); window.open(project.demoUrl, '_blank') }}
              style={{ color: 'var(--secondary-text)', padding: '0 4px' }}
            />
          )}
        </Space>
      </div>
    </Card>
  )
}

export default ProjectCard