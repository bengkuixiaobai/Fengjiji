import React, { useEffect, useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import { useThemeStore } from './stores/themeStore'
import './index.css'

// 预构建 light / dark theme 对象,只在新算法下生成新对象(稳定引用)
const lightTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#667eea',
    colorLink: '#667eea',
    borderRadius: 10,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    controlHeight: 36,
  },
  components: {
    Button: {
      primaryShadow: '0 4px 14px rgba(102,126,234,0.35)',
      borderRadius: 10,
      controlHeight: 36,
    },
    Input: { borderRadius: 10 },
    Card: { borderRadiusLG: 14 },
  },
}
const darkTheme = {
  ...lightTheme,
  algorithm: theme.darkAlgorithm,
}

/** 路由切换后回到顶部 — 不影响历史滚动恢复 */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

function ThemedApp() {
  const isDarkMode = useThemeStore(s => s.isDarkMode)

  // theme 对象稳定,只在算法切换时换 — 避免 antd css-in-js 重建
  const antdTheme = useMemo(
    () => (isDarkMode ? darkTheme : lightTheme),
    [isDarkMode],
  )

  return (
    <ConfigProvider locale={zhCN} theme={antdTheme}>
      <App />
    </ConfigProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ThemedApp />
      <ScrollToTop />
    </BrowserRouter>
  </React.StrictMode>,
)