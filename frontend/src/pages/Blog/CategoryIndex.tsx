// 分类索引页 — 网格展示所有分类
import { useEffect, useState } from 'react'
import { Row, Col, Card, Spin, Empty } from 'antd'
import { useNavigate } from 'react-router-dom'
import { FolderOutlined, FileTextOutlined } from '@ant-design/icons'
import AppLayout from '../../components/AppLayout'
import { getCategories, type Category } from '../../services/category'

// 分类的 emoji 配色映射
const CATEGORY_ICONS: Record<string, string> = {
  技术: '💻',
  生活: '🌿',
  项目: '🚀',
  随笔: '✨',
}

function CategoryIndex() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCategories().then(res => {
      if (res.success && res.data) setCategories(res.data)
      setLoading(false)
    })
  }, [])

  return (
    <AppLayout selectedKey="blogs-view">
      <div style={{ animation: 'fadeIn 0.35s ease-out both', maxWidth: 1200, margin: '0 auto' }}>
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
            <FolderOutlined style={{ color: 'var(--accent-start)', marginRight: '8px' }} />
            分类索引
          </h1>
          <p style={{ margin: '8px 0 0', color: 'var(--muted-text)', fontSize: '14px' }}>
            按主题浏览所有文章 · 共 {categories.length} 个分类
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : categories.length === 0 ? (
          <Card style={{ background: 'var(--card-bg)', border: 'var(--card-border)' }}>
            <Empty description={<span style={{ color: 'var(--muted-text)' }}>暂无分类</span>} />
          </Card>
        ) : (
          <Row gutter={[20, 20]}>
            {categories.map(cat => (
              <Col xs={24} sm={12} md={8} lg={6} key={cat.id}>
                <Card
                  hoverable
                  onClick={() => navigate(`/categories/${cat.slug}`)}
                  className="hover-card"
                  style={{
                    background: 'var(--card-bg)',
                    border: 'var(--card-border)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    height: '100%',
                  }}
                  styles={{ body: { padding: '24px 22px' } }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div
                      style={{
                        fontSize: '32px',
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        background: 'var(--accent-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {CATEGORY_ICONS[cat.name] ?? '📂'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-color)' }}>
                        {cat.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted-text)', marginTop: '2px' }}>
                        <FileTextOutlined /> {cat._count?.posts ?? 0} 篇文章
                      </div>
                    </div>
                  </div>
                  {cat.description && (
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--secondary-text)', lineHeight: 1.6 }}>
                      {cat.description}
                    </p>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </AppLayout>
  )
}

export default CategoryIndex