// 共用分页栏 — 博客列表 / 项目展示 / 分类标签统一使用
// 左:共 X 条 | 中:分页器 | 右:每页 [10/15/20] 条
import { Pagination, Select, Space } from 'antd'
import type { SelectProps } from 'antd'

interface PaginationBarProps {
  current: number
  pageSize: number
  total: number
  onChange: (page: number, pageSize: number) => void
  /** 每页条数选项,默认 [6, 9, 12, 15] — 都是 3 的倍数,刚好对齐网格(3 列布局) */
  pageSizeOptions?: number[]
  /** 是否显示"共 X 条" */
  showTotal?: boolean
  /** 自定义最小宽度(用于窄布局换行) */
  compact?: boolean
}

const DEFAULT_PAGE_SIZES = [6, 9, 12, 15]

function PaginationBar({
  current,
  pageSize,
  total,
  onChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  showTotal = true,
  compact = false,
}: PaginationBarProps) {
  const sizeOptions: SelectProps['options'] = pageSizeOptions.map(n => ({
    label: `${n} 条/页`,
    value: n,
  }))

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        padding: compact ? '12px 0' : '14px 20px',
        background: compact ? 'transparent' : 'var(--card-bg)',
        borderRadius: compact ? 0 : '12px',
        border: compact ? 'none' : 'var(--card-border)',
      }}
    >
      {/* 左侧:总数 */}
      {showTotal && (
        <span style={{ color: 'var(--muted-text)', fontSize: '13px' }}>
          共 <span style={{ color: 'var(--text-color)', fontWeight: 600 }}>{total}</span> 条
        </span>
      )}

      {/* 中间:分页 */}
      <Pagination
        current={current}
        pageSize={pageSize}
        total={total}
        showSizeChanger={false}
        showQuickJumper={total > pageSize * 5}
        size={compact ? 'small' : 'default'}
        onChange={onChange}
      />

      {/* 右侧:每页条数 */}
      <Space size={6}>
        <span style={{ color: 'var(--muted-text)', fontSize: '13px' }}>每页</span>
        <Select
          value={pageSize}
          options={sizeOptions}
          onChange={(v) => onChange(1, v)}
          style={{ minWidth: 110 }}
          size={compact ? 'small' : 'middle'}
        />
      </Space>
    </div>
  )
}

export default PaginationBar