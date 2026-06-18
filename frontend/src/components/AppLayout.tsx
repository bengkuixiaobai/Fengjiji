import { ReactNode, useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Space, Button, Switch, Tooltip, Badge } from 'antd'
import {
  UserOutlined, LogoutOutlined, SettingOutlined,
  HomeOutlined, FileTextOutlined, ProjectOutlined,
  SunOutlined, MoonOutlined, BellOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'
import { logout } from '../services/auth'
import BackgroundAnimation from './BackgroundAnimation'

interface AppLayoutProps {
  children: ReactNode
  selectedKey: string
  /** 是否显示侧边栏（仅首页显示） */
  showSidebar?: boolean
  /** 侧边栏是否折叠（受控），不传则内部管理 */
  collapsed?: boolean
  onCollapsedChange?: (v: boolean) => void
  /** 签到按钮额外渲染（例如未签到的红点） */
  checkinExtra?: ReactNode
  /** 自定义退出逻辑（例如编辑器有未保存内容时确认） */
  onLogout?: () => void
}

const userMenuItems = [
  { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
  { key: 'settings', icon: <SettingOutlined />, label: '设置' },
  { type: 'divider' as const },
  { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
]

function AppLayout({
  children,
  selectedKey,
  showSidebar = false,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  checkinExtra,
  onLogout,
}: AppLayoutProps) {
  const navigate = useNavigate()
  const { user, logout: authLogout } = useAuthStore()
  const { isDarkMode, toggleTheme } = useThemeStore()
  const [internalCollapsed, setInternalCollapsed] = useState(true)

  const dark = isDarkMode
  const collapsed = controlledCollapsed ?? internalCollapsed
  const sidebarWidth = collapsed ? 0 : 200

  const textColor = 'var(--text-color)'
  const mutedTextColor = 'var(--muted-text)'
  const secondaryTextColor = 'var(--secondary-text)'
  const cardBorder = 'var(--card-border)'
  const headerBg = 'var(--header-bg)'
  const siderBg = 'var(--sider-bg)'

  const toggleSidebar = () => {
    const next = !collapsed
    if (onCollapsedChange) onCollapsedChange(next)
    else setInternalCollapsed(next)
  }

  const handleNavClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'home':
        navigate('/')
        break
      case 'blogs':
        navigate('/blog')
        break
    }
  }

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
      return
    }
    logout().catch(() => {})
    authLogout()
    localStorage.removeItem('auth-token')
    navigate('/login')
  }

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') handleLogout()
  }

  return (
    <Layout className={dark ? 'dark-menu' : 'light-menu'}
      data-theme={dark ? 'dark' : 'light'}
      style={{ minHeight: '100vh', background: 'var(--page-bg)', position: 'relative' }}
    >
      {/* 背景动画 — 最底层 */}
      <BackgroundAnimation />

      {/* ===== 顶部导航栏 ===== */}
      <div style={{
        background: headerBg,
        backdropFilter: 'blur(12px)',
        borderBottom: cardBorder,
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        height: '64px',
        padding: '0 24px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '40px' }}>
          <span style={{ fontSize: '22px' }}>🌌</span>
          <span style={{ color: textColor, fontWeight: 700, fontSize: '18px' }}>风迹集</span>
        </div>

        {/* 导航菜单 — 所有页面统一显示 */}
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          style={{ background: 'transparent', border: 'none', flex: 1 }}
          onClick={handleNavClick}
          items={[
            { key: 'home', icon: <HomeOutlined />, label: '首页' },
            { key: 'blogs', icon: <FileTextOutlined />, label: '博客' },
            { key: 'projects', icon: <ProjectOutlined />, label: '项目' },
          ]}
        />

        {/* 右侧操作区 */}
        <Space size="middle">
          <Tooltip title={dark ? '切换浅色模式' : '切换深色模式'}>
            <Switch
              checked={dark}
              onChange={toggleTheme}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
            />
          </Tooltip>
          {checkinExtra}
          <Badge count={3}>
            <Button type="text" icon={<BellOutlined />} style={{ color: secondaryTextColor }} />
          </Badge>
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                src={user?.avatar}
                style={{ backgroundColor: '#667eea' }}
              />
              <span style={{ color: textColor }}>{user?.nickname || user?.username}</span>
            </Space>
          </Dropdown>
        </Space>
      </div>

      {/* ===== 侧边栏（仅首页显示） ===== */}
      {showSidebar && (
        <>
          {/* 伸缩按钮 */}
          <div
            onClick={toggleSidebar}
            style={{
              position: 'fixed',
              top: 'calc(50vh - 24px)',
              left: sidebarWidth,
              width: '24px',
              height: '48px',
              background: 'var(--btn-primary-bg)',
              borderRadius: '0 12px 12px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 99,
              transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease',
              boxShadow: 'var(--btn-primary-shadow)',
            }}
          >
            {collapsed
              ? <MenuUnfoldOutlined style={{ color: '#fff', fontSize: '12px' }} />
              : <MenuFoldOutlined style={{ color: '#fff', fontSize: '12px' }} />
            }
          </div>

          {/* 侧边栏结构（保留备用，内容为空） */}
          <div style={{
            width: sidebarWidth,
            background: siderBg,
            borderRight: collapsed ? 'none' : cardBorder,
            position: 'fixed',
            left: 0,
            top: '64px',
            bottom: '40px',
            overflow: 'hidden',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 98,
          }} />
        </>
      )}

      {/* ===== 主内容区 ===== */}
      <div style={{
        marginLeft: showSidebar ? sidebarWidth : 0,
        marginTop: '64px',
        marginBottom: '40px',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '24px 32px',
        minHeight: 'calc(100vh - 104px)',
      }}>
        {children}
      </div>

      {/* ===== 页脚 ===== */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        textAlign: 'center',
        padding: '10px',
        color: mutedTextColor,
        fontSize: '12px',
        background: dark ? 'rgba(15, 15, 35, 0.95)' : 'rgba(240, 242, 245, 0.95)',
        backdropFilter: 'blur(8px)',
        zIndex: 50,
      }}>
        🌌 风迹集 © 2026 - 风过留痕，迹存于心
      </div>
    </Layout>
  )
}

export default AppLayout
