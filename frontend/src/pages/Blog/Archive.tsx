// 时间归档页 — 按年/月分组展示
import { useEffect, useMemo, useState } from 'react'
import { Spin, Collapse } from 'antd'
import { CalendarOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import AppLayout from '../../components/AppLayout'
import { getPosts, type Post } from '../../services/post'

function Archive() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPosts({ limit: 50, status: 'published' }).then(res => {
      if (res.success && res.data) setPosts(res.data.posts)
      setLoading(false)
    })
  }, [])

  // 按年/月分组
  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, Post[]>>()
    for (const p of posts) {
      const d = dayjs(p.publishedAt ?? p.createdAt)
      const year = String(d.year())
      const month = String(d.month() + 1).padStart(2, '0')
      if (!map.has(year)) map.set(year, new Map())
      const ym = map.get(year)!
      if (!ym.has(month)) ym.set(month, [])
      ym.get(month)!.push(p)
    }
    // 排序:年份倒序,月份倒序
    const years = Array.from(map.keys()).sort((a, b) => Number(b) - Number(a))
    return years.map(y => ({
      year: y,
      count: Array.from(map.get(y)!.values()).reduce((s, arr) => s + arr.length, 0),
      months: Array.from(map.get(y)!.entries())
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([m, posts]) => ({ month: m, posts })),
    }))
  }, [posts])

  return (
    <AppLayout selectedKey="blogs-view">
      <div style={{ animation: 'fadeIn 0.35s ease-out both', maxWidth: 900, margin: '0 auto' }}>
        <div
          style={{
            background: 'var(--card-bg)',
            border: 'var(--card-border)',
            borderRadius: '12px',
            padding: '28px 32px',
            marginBottom: '24px',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-color)' }}>
            <CalendarOutlined style={{ color: 'var(--accent-start)', marginRight: '8px' }} />
            时间归档
          </h1>
          <p style={{ margin: '8px 0 0', color: 'var(--muted-text)', fontSize: '14px' }}>
            按发布日期归档 · 共 {posts.length} 篇文章
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Collapse
            accordion
            defaultActiveKey={grouped[0]?.year}
            expandIcon={({ isActive }) => (
              <RightOutlined rotate={isActive ? 90 : 0} style={{ color: 'var(--muted-text)' }} />
            )}
            style={{
              background: 'transparent',
              border: 'none',
            }}
            items={grouped.map(g => ({
              key: g.year,
              label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-color)' }}>{g.year}</span>
                  <span style={{ fontSize: '12px', color: 'var(--muted-text)', fontWeight: 400 }}>
                    {g.count} 篇
                  </span>
                </div>
              ),
              style: {
                marginBottom: '12px',
                background: 'var(--card-bg)',
                border: 'var(--card-border)',
                borderRadius: '12px',
              },
              children: (
                <div style={{ padding: '8px 0' }}>
                  {g.months.map(m => (
                    <div key={m.month} style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--secondary-text)', marginBottom: '8px', paddingLeft: '4px' }}>
                        📅 {g.year} 年 {m.month} 月 <span style={{ fontSize: '12px', color: 'var(--muted-text)', fontWeight: 400 }}>({m.posts.length})</span>
                      </div>
                      {m.posts.map(p => (
                        <div
                          key={p.id}
                          className="hover-list-item"
                          onClick={() => navigate(`/blogs/${p.slug}`)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{ color: 'var(--muted-text)', fontSize: '13px', minWidth: '50px', fontFamily: 'monospace' }}>
                            {dayjs(p.publishedAt ?? p.createdAt).format('MM-DD')}
                          </span>
                          <span style={{ flex: 1, color: 'var(--text-color)', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.title}
                          </span>
                          {p.category && (
                            <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
                              {p.category.name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ),
            }))}
          />
        )}
      </div>
    </AppLayout>
  )
}

export default Archive