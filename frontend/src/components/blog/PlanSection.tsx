// 项目计划显示组件 — 直接接收 planItems 数组渲染
import { BookOutlined, ClockCircleOutlined } from '@ant-design/icons'

export interface PlanItem {
  what: string
  time?: string
  /** 权重 0-100,影响项目完成度计算 */
  weight?: number
}

interface PlanSectionProps {
  planItems?: PlanItem[]
  /** 最多显示几条 */
  maxItems?: number
  /** 紧凑模式(更小内边距) */
  compact?: boolean
}

export default function PlanSection({
  planItems, maxItems = 2, compact = false,
}: PlanSectionProps) {
  const items = planItems || []
  if (items.length === 0) return null

  return (
    <div style={{
      padding: compact ? '8px 10px' : '10px 12px',
      background: 'rgba(102, 126, 234, 0.06)',
      border: '1px solid rgba(102, 126, 234, 0.15)',
      borderRadius: 8,
    }}>
      {/* 头部 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginBottom: 8,
        color: 'var(--accent-start)',
        fontSize: 11, fontWeight: 600,
        letterSpacing: '0.3px',
      }}>
        <BookOutlined style={{ fontSize: 11 }} />
        <span>项目计划 ({items.length})</span>
      </div>

      {/* 任务列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.slice(0, maxItems).map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'var(--secondary-text)',
            lineHeight: 1.5,
          }}>
            {/* 复选框样式(只展示) */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 13, height: 13, flexShrink: 0,
              border: '1.5px solid var(--input-border)',
              borderRadius: 3,
              background: 'var(--card-bg)',
            }} />
            {/* 任务内容 */}
            <span style={{
              flex: 1, minWidth: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{item.what}</span>
            {/* 时间 */}
            {item.time && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 2,
                color: 'var(--muted-text)', fontSize: 10, flexShrink: 0,
                fontWeight: 500,
              }}>
                <ClockCircleOutlined style={{ fontSize: 10 }} />
                {item.time}
              </span>
            )}
            {/* 权重 */}
            {item.weight !== undefined && item.weight > 0 && (
              <span style={{
                padding: '1px 6px',
                background: 'rgba(102, 126, 234, 0.12)',
                color: 'var(--accent-start)',
                fontSize: 10, fontWeight: 600,
                borderRadius: 4,
                flexShrink: 0,
                fontVariantNumeric: 'tabular-nums',
              }}>权重 {item.weight}%</span>
            )}
          </div>
        ))}

        {/* 更多提示 */}
        {items.length > maxItems && (
          <div style={{
            color: 'var(--accent-start)',
            fontSize: 11, fontWeight: 500,
            marginTop: 2, paddingLeft: 19,
          }}>
            + 还有 {items.length - maxItems} 项任务…
          </div>
        )}
      </div>
    </div>
  )
}
