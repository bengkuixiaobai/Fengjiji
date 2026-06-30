import { useState, useMemo, useEffect } from 'react'
import { Layout, Space, Button, Card, Row, Col, Statistic, List, Tag, Input, Segmented, Modal, Form, Progress, Spin, Select, Avatar } from 'antd'
import { FileTextOutlined, SearchOutlined, PlusOutlined, CalendarOutlined, EyeOutlined, LikeOutlined, FireOutlined, ClockCircleOutlined, CheckCircleOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { useAuthStore } from '../stores/authStore'
import AppLayout from '../components/AppLayout'
import { getPosts, Post } from '../services/post'
import { getProjects, Project } from '../services/project'
import { getCategories } from '../services/category'
import { getCheckIns, checkIn as apiCheckIn } from '../services/checkin'
import { getDashboardStats } from '../services/stats'

const { TextArea } = Input

// 状态映射
const statusMap: Record<string, string> = {
  'planning': '规划中',
  'in_progress': '进行中',
  'completed': '已完成',
}

function Home() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [searchType, setSearchType] = useState('all')
  const [searchValue, setSearchValue] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedProjectStatuses, setSelectedProjectStatuses] = useState<string[]>(['进行中', '规划中'])
  const [checkInVisible, setCheckInVisible] = useState(false)
  const [editPostVisible, setEditPostVisible] = useState(false)
  const [createProjectVisible, setCreateProjectVisible] = useState(false)
  const [postViewType, setPostViewType] = useState('recent')
  const [miniCalendarDate, setMiniCalendarDate] = useState(dayjs())
  const [form] = Form.useForm()
  const [projectForm] = Form.useForm()

  // API 数据状态
  const [posts, setPosts] = useState<Post[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [checkInRecord, setCheckInRecord] = useState<Record<string, boolean>>({})
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false)
  const [stats, setStats] = useState({ postsCount: 0, projectsCount: 0, checkinsCount: 0, totalViews: 0 })
  const [loading, setLoading] = useState(true)

  // 获取数据 — P2-11:首屏关键接口(文章+项目)先 await 渲染,其余后台拉
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        navigate('/login')
        return
      }

      // 首屏关键:文章 + 项目
      const [postsRes, projectsRes] = await Promise.all([
        getPosts({ limit: 10, status: 'published' }),
        getProjects({ limit: 20, isPublic: true }),
      ])

      if (postsRes.success && postsRes.data) setPosts(postsRes.data.posts)
      if (projectsRes.success && projectsRes.data) setProjects(projectsRes.data.projects)

      // 首屏出来后再后台拉其余
      setTimeout(async () => {
        try {
          const [categoriesRes, checkinsRes, statsRes] = await Promise.all([
            getCategories(),
            getCheckIns({ year: dayjs().year(), month: dayjs().month() + 1 }),
            getDashboardStats(),
          ])
          if (categoriesRes.success && categoriesRes.data) setCategories(categoriesRes.data)
          if (statsRes.success && statsRes.data) setStats(statsRes.data)
          if (checkinsRes.success && checkinsRes.data) {
            const record: Record<string, boolean> = {}
            checkinsRes.data.dates.forEach((date: string) => {
              record[date] = true
            })
            setCheckInRecord(record)
            setHasCheckedInToday(!!record[dayjs().format('YYYY-MM-DD')])

            // 自动签到
            const today = dayjs().format('YYYY-MM-DD')
            const alreadyChecked = checkinsRes.data.dates.includes(today)
            if (!alreadyChecked) {
              try {
                const checkRes = await apiCheckIn(today)
                if (checkRes.success) {
                  setCheckInRecord(prev => ({ ...prev, [today]: true }))
                  setHasCheckedInToday(true)
                }
              } catch {
                setCheckInRecord(prev => ({ ...prev, [today]: true }))
                setHasCheckedInToday(true)
              }
            }
          }
        } catch (e) {
          // 后台接口失败不阻塞首屏
        }
      }, 0)
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 处理签到
  const handleCheckIn = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD')
      const result = await apiCheckIn(today)
      if (result.success) {
        setCheckInRecord(prev => ({ ...prev, [today]: true }))
        setHasCheckedInToday(true)
        // 更新统计数据
        setStats(prev => ({ ...prev, checkinsCount: prev.checkinsCount + 1 }))
      }
    } catch (error) {
      console.error('签到失败:', error)
    }
  }

  // 生成日历数据 - 固定42个格子(6行*7列)
  const getCalendarDays = () => {
    const start = miniCalendarDate.startOf('month')
    const end = miniCalendarDate.endOf('month')
    const startDay = start.day()
    const daysInMonth = end.date()

    const days: { date: dayjs.Dayjs | null; day: number | null; isChecked: boolean; isToday: boolean; isFuture: boolean }[] = []

    for (let i = 0; i < startDay; i++) {
      days.push({ date: null, day: null, isChecked: false, isToday: false, isFuture: false })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = miniCalendarDate.date(d)
      const dateStr = date.format('YYYY-MM-DD')
      days.push({
        date,
        day: d,
        isChecked: !!checkInRecord[dateStr],
        isToday: dateStr === dayjs().format('YYYY-MM-DD'),
        isFuture: date.isAfter(dayjs(), 'day'),
      })
    }

    while (days.length < 42) {
      days.push({ date: null, day: null, isChecked: false, isToday: false, isFuture: false })
    }

    return days
  }

  // 过滤文章
  const filteredPosts = useMemo(() => {
    let result = [...posts]
    if (searchValue && searchType !== 'project') {
      result = result.filter(p => p.title.toLowerCase().includes(searchValue.toLowerCase()))
    }
    if (selectedCategory && searchType !== 'project') {
      result = result.filter(p => p.category?.name === selectedCategory)
    }
    if (postViewType === 'hot') {
      result.sort((a, b) => b.likeCount - a.likeCount)
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return result
  }, [posts, searchValue, searchType, selectedCategory, postViewType])

  // 过滤项目
  const filteredProjects = useMemo(() => {
    let result = [...projects]
    if (searchValue && searchType !== 'post') {
      result = result.filter(p => p.name.toLowerCase().includes(searchValue.toLowerCase()) || p.description?.toLowerCase().includes(searchValue.toLowerCase()))
    }
    if (selectedProjectStatuses.length > 0 && selectedProjectStatuses.length < 3) {
      result = result.filter(p => selectedProjectStatuses.includes(statusMap[p.status]))
    }
    result.sort((a, b) => {
      if (statusMap[a.status] === '进行中' && statusMap[b.status] !== '进行中') return -1
      if (statusMap[b.status] === '进行中' && statusMap[a.status] !== '进行中') return 1
      if (statusMap[a.status] === '规划中' && statusMap[b.status] === '已完成') return -1
      if (statusMap[b.status] === '规划中' && statusMap[a.status] === '已完成') return 1
      return 0
    })
    return result
  }, [projects, searchValue, searchType, selectedProjectStatuses])

  const toggleProjectStatus = (status: string) => {
    setSelectedProjectStatuses(prev => {
      if (prev.includes(status)) {
        if (prev.length === 1) return prev
        return prev.filter(s => s !== status)
      }
      return [...prev, status]
    })
  }

  const textColor = 'var(--text-color)'
  const secondaryTextColor = 'var(--secondary-text)'
  const mutedTextColor = 'var(--muted-text)'
  const cardBg = 'var(--card-bg)'
  const cardBorder = 'var(--card-border)'
  const dividerColor = 'var(--divider-color)'
  const inputBg = 'var(--input-bg)'
  const tagBg = 'var(--tag-bg)'
  const tagColor = 'var(--tag-color)'
  const segmentedBg = 'var(--segmented-bg)'

  const calendarDays = getCalendarDays()

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--page-bg)' }}>
        <Spin size="large" />
      </Layout>
    )
  }

  return (
    <AppLayout selectedKey="home" showSidebar>
      {/* 主内容 */}
      <div style={{ animation: 'fadeIn 0.35s ease-out both' }}>
        {/* 欢迎语 + 迷你日历同一行 */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch', marginBottom: '24px' }}>
          {/* 欢迎语卡片 */}
          <div style={{
            flex: 1,
            padding: '16px 24px 12px',
            borderRadius: '12px',
            border: cardBorder,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '150px',
            position: 'relative',
            overflow: 'hidden',
            background: cardBg,
          }}>
            {/* 背景图片（用户放置 /images/welcome-bg.jpg） */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'url(/images/welcome-bg.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center 30%',
              opacity: 0.45,
            }} />
            {/* 内容 */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ color: 'var(--text-color)', fontSize: '24px', fontWeight: 700 }}>
                👋 {user?.nickname || user?.username}
              </div>
              <div style={{ color: 'var(--secondary-text)', fontSize: '14px', marginTop: '2px' }}>
                欢迎回来
              </div>
            </div>
            <p style={{
              color: 'var(--muted-text)',
              fontSize: '13px',
              margin: 0,
              fontStyle: 'italic',
              position: 'relative',
              zIndex: 1,
              borderTop: 'var(--divider-color)',
              paddingTop: '10px',
            }}>
              🌟 星光不问赶路人，时光不负有心人
            </p>
          </div>

          {/* 迷你日历 */}
          <div style={{
            width: '280px',
            padding: '16px',
            background: cardBg,
            borderRadius: '12px',
            border: cardBorder,
          }}>
            {/* 日历头部 */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '12px',
            }}>
              <Button
                type="text"
                icon={<LeftOutlined />}
                onClick={() => setMiniCalendarDate(miniCalendarDate.subtract(1, 'month'))}
                style={{
                  color: mutedTextColor,
                  width: 28, height: 28, padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              />
              <span style={{ color: textColor, fontSize: '13px', fontWeight: 600 }}>
                {miniCalendarDate.format('YYYY 年 M 月')}
              </span>
              <Button
                type="text"
                icon={<RightOutlined />}
                onClick={() => setMiniCalendarDate(miniCalendarDate.add(1, 'month'))}
                style={{
                  color: mutedTextColor,
                  width: 28, height: 28, padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              />
            </div>
            {/* 星期标题 */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px', marginBottom: '8px',
            }}>
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                <div key={d} style={{
                  textAlign: 'center', color: mutedTextColor,
                  fontSize: '11px', fontWeight: 500,
                }}>{d}</div>
              ))}
            </div>
            {/* 日期网格 — 更大、更舒展 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gridTemplateRows: 'repeat(6, 1fr)',
              gap: '4px',
              height: '210px',
            }}>
              {calendarDays.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: item.isChecked
                    ? '#36d399'
                    : item.isToday
                      ? 'rgba(102, 126, 234, 0.3)'
                      : 'transparent',
                  color: item.isFuture
                    ? mutedTextColor
                    : item.isChecked || item.isToday
                      ? '#fff'
                      : textColor,
                  fontSize: '12px',
                  fontWeight: item.isToday || item.isChecked ? 600 : 400,
                  cursor: item.isFuture ? 'not-allowed' : 'pointer',
                  opacity: item.isFuture ? 0.4 : 1,
                  transition: 'all 0.15s ease',
                }} onClick={() => {
                  if (!item.isFuture && !item.isChecked && item.date) {
                    handleCheckIn()
                  }
                }}>
                  {item.day}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 搜索框 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: cardBg,
          borderRadius: '12px',
          border: cardBorder,
          marginBottom: '24px',
        }}>
          <Segmented
            options={[
              { label: '全部', value: 'all' },
              { label: '文章', value: 'post' },
              { label: '项目', value: 'project' },
            ]}
            value={searchType}
            onChange={val => setSearchType(val as string)}
            style={{ background: segmentedBg }}
          />
          <Input
            placeholder="搜索文章或项目..."
            prefix={<SearchOutlined style={{ color: 'var(--accent-start)' }} />}
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            style={{ flex: 1, borderRadius: '20px', background: inputBg, border: 'none' }}
            className="search-input"
          />
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={12} sm={6}>
            <Card className="hover-card" style={{ background: cardBg, border: cardBorder, borderRadius: '12px' }}>
              <Statistic title={<span style={{ color: secondaryTextColor }}>文章总数</span>} value={stats.postsCount} valueStyle={{ color: 'var(--accent-start)' }} suffix="篇" />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="hover-card" style={{ background: cardBg, border: cardBorder, borderRadius: '12px' }}>
              <Statistic title={<span style={{ color: secondaryTextColor }}>项目总数</span>} value={stats.projectsCount} valueStyle={{ color: 'var(--accent-end)' }} suffix="个" />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="hover-card" style={{ background: cardBg, border: cardBorder, borderRadius: '12px' }}>
              <Statistic title={<span style={{ color: secondaryTextColor }}>累计签到</span>} value={stats.checkinsCount} valueStyle={{ color: '#36d399' }} suffix="天" />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="hover-card" style={{ background: cardBg, border: cardBorder, borderRadius: '12px' }}>
              <Statistic title={<span style={{ color: secondaryTextColor }}>访问量</span>} value={stats.totalViews} valueStyle={{ color: '#f472b6' }} suffix="次" />
            </Card>
          </Col>
        </Row>

        {/* 文章和项目 */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={14} style={{ display: 'flex' }}>
            <Card
              className="hover-card"
              style={{ flex: 1, background: cardBg, border: cardBorder, borderRadius: '12px' }}
              title={<span>📝 文章</span>}
              extra={
                <Space>
                  <Segmented size="small" options={[
                    { label: <span><ClockCircleOutlined /> 最近</span>, value: 'recent' },
                    { label: <span><FireOutlined /> 热门</span>, value: 'hot' },
                  ]} value={postViewType} onChange={val => setPostViewType(val as string)} style={{ background: segmentedBg }} />
                  <Button type="primary" size="small" icon={<PlusOutlined />} className="fjj-btn-primary" onClick={() => navigate('/blog/create')}>新建文章</Button>
                </Space>
              }
              styles={{ header: { color: textColor }, body: { padding: 0 } }}
            >
              <div style={{ padding: '8px 16px', borderBottom: dividerColor, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <Tag key={cat.id} color={selectedCategory === cat.name ? '#667eea' : 'default'} style={{ cursor: 'pointer', margin: 0, color: selectedCategory === cat.name ? '#fff' : tagColor, background: selectedCategory === cat.name ? '#667eea' : tagBg, border: 'none' }} onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}>{cat.name}</Tag>
                ))}
              </div>
              <List dataSource={filteredPosts.slice(0, 5)} renderItem={item => (
                <List.Item className="hover-list-item" style={{ padding: '14px 20px', borderBottom: cardBorder, cursor: 'pointer' }} onClick={() => navigate(`/blogs/${item.slug}`)}>
                  <List.Item.Meta avatar={<Avatar icon={<FileTextOutlined />} style={{ backgroundColor: 'var(--accent-start)' }} />}
                    title={<span style={{ color: textColor, fontWeight: 500 }}>{item.title}</span>}
                    description={<Space size="middle">
                      <Tag style={{ color: tagColor, background: tagBg, border: 'none' }}>{item.category?.name || '未分类'}</Tag>
                      <span style={{ color: mutedTextColor, fontSize: '12px' }}><CalendarOutlined /> {dayjs(item.createdAt).format('YYYY-MM-DD')}</span>
                      <span style={{ color: mutedTextColor, fontSize: '12px' }}><EyeOutlined /> {item.viewCount}</span>
                      <span style={{ color: mutedTextColor, fontSize: '12px' }}><LikeOutlined /> {item.likeCount}</span>
                    </Space>}
                  />
                </List.Item>
              )} />
            </Card>
          </Col>

          <Col xs={24} lg={10} style={{ display: 'flex' }}>
            <Card
              className="hover-card"
              style={{ flex: 1, background: cardBg, border: cardBorder, borderRadius: '12px' }}
              title={<span>🚀 项目</span>}
              extra={<Button type="primary" size="small" icon={<PlusOutlined />} className="fjj-btn-primary" onClick={() => setCreateProjectVisible(true)}>新建项目</Button>}
              styles={{ header: { color: textColor }, body: { padding: 0 } }}
            >
              <div style={{ padding: '8px 16px', borderBottom: dividerColor, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['进行中', '规划中', '已完成'].map(status => (
                  <Tag key={status} color={selectedProjectStatuses.includes(status) ? (status === '进行中' ? 'processing' : status === '规划中' ? 'warning' : 'success') : 'default'} style={{ cursor: 'pointer', margin: 0, color: selectedProjectStatuses.includes(status) ? undefined : tagColor, background: selectedProjectStatuses.includes(status) ? undefined : tagBg, border: 'none' }} onClick={() => toggleProjectStatus(status)}>{status}</Tag>
                ))}
              </div>
              {filteredProjects.slice(0, 4).map(project => (
                <div key={project.id} className="hover-list-item" style={{ padding: '14px 20px', borderBottom: cardBorder, cursor: 'pointer' }} onClick={() => navigate(`/project/${project.id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: textColor, fontWeight: 500 }}>{project.name}</span>
                    <Tag color={project.status === 'completed' ? 'success' : project.status === 'in_progress' ? 'processing' : 'default'} style={{ color: project.status === 'completed' || project.status === 'in_progress' ? undefined : tagColor, background: project.status === 'completed' || project.status === 'in_progress' ? undefined : tagBg, border: 'none' }}>{statusMap[project.status]}</Tag>
                  </div>
                  <div style={{ color: mutedTextColor, fontSize: '13px', marginBottom: '10px' }}>{project.description}</div>
                  <Progress percent={project.completionRate} size="small" strokeColor="var(--accent-start)" />
                </div>
              ))}
            </Card>
          </Col>
        </Row>
      </div>

      {/* 签到弹窗 */}
      <Modal title="📅 签到打卡" open={checkInVisible} onCancel={() => setCheckInVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setCheckInVisible(false)}>关闭</Button>,
          hasCheckedInToday ? <Button key="ok" type="primary" disabled icon={<CheckCircleOutlined />}>已签到</Button>
            : <Button key="ok" type="primary" icon={<CheckCircleOutlined />} className="fjj-btn-primary" onClick={handleCheckIn}>签到</Button>,
        ]}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
          <div style={{ color: mutedTextColor, marginBottom: '16px' }}>{dayjs().format('YYYY年MM月DD日')}</div>
          {hasCheckedInToday ? (
            <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: '16px', padding: '4px 16px' }}>今日已签到</Tag>
          ) : (
            <Button type="primary" size="large" icon={<CheckCircleOutlined />} onClick={handleCheckIn}>点击签到</Button>
          )}
        </div>
      </Modal>

      {/* 写文章弹窗 */}
      <Modal title="✍️ 写文章" open={editPostVisible} onCancel={() => setEditPostVisible(false)} width={800} footer={null}>
        <Form form={form} layout="vertical">
          <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入文章标题' }]}>
            <Input placeholder="请输入文章标题" />
          </Form.Item>
          <Form.Item label="分类" name="category">
            <Select placeholder="选择分类">
              {categories.map(cat => (
                <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="内容" name="content" rules={[{ required: true, message: '请输入文章内容' }]}>
            <TextArea rows={10} placeholder="请输入文章内容（支持 Markdown）" />
          </Form.Item>
          <Space>
            <Button type="primary" className="fjj-btn-primary">保存草稿</Button>
            <Button className="fjj-btn-default">发布文章</Button>
          </Space>
        </Form>
      </Modal>

      {/* 新建项目弹窗 */}
      <Modal title="🚀 新建项目" open={createProjectVisible} onCancel={() => setCreateProjectVisible(false)} footer={null}>
        <Form form={projectForm} layout="vertical">
          <Form.Item label="项目名称" name="name" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item label="项目描述" name="description">
            <TextArea rows={3} placeholder="请输入项目描述" />
          </Form.Item>
          <Form.Item label="技术栈" name="tech">
            <Select mode="tags" placeholder="输入技术栈并回车">
              <Select.Option value="React">React</Select.Option>
              <Select.Option value="Vue">Vue</Select.Option>
              <Select.Option value="Node.js">Node.js</Select.Option>
            </Select>
          </Form.Item>
          <Button type="primary" block className="fjj-btn-primary">创建项目</Button>
        </Form>
      </Modal>
    </AppLayout>
  )
}

export default Home