import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import PageLoading from './components/PageLoading'

// P0-2:路由级 lazy + Suspense — 拆 2.67MB 单 bundle,首屏只加载必要的 chunk
const Login = lazy(() => import('./pages/Login/Login'))
const Register = lazy(() => import('./pages/Login/Register'))
const Home = lazy(() => import('./pages/Home'))
const BlogManage = lazy(() => import('./pages/BlogManage'))
const BlogEditor = lazy(() => import('./pages/BlogEditor'))
const BlogList = lazy(() => import('./pages/Blog/BlogList'))
const BlogDetail = lazy(() => import('./pages/Blog/BlogDetail'))
const CategoryIndex = lazy(() => import('./pages/Blog/CategoryIndex'))
const CategoryPosts = lazy(() => import('./pages/Blog/CategoryPosts'))
const TagCloud = lazy(() => import('./pages/Blog/TagCloud'))
const TagPosts = lazy(() => import('./pages/Blog/TagPosts'))
const Archive = lazy(() => import('./pages/Blog/Archive'))
const ProjectShowcase = lazy(() => import('./pages/Blog/ProjectShowcase'))
const ProjectManage = lazy(() => import('./pages/Blog/ProjectManage'))
const ProjectCreate = lazy(() => import('./pages/ProjectCreate'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const Notifications = lazy(() => import('./pages/Notifications'))

// 受保护的路由组件
function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const role = useAuthStore((state) => state.user?.role)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 需要 admin 但用户不是 admin → 跳首页
  if (requireAdmin && role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// 每个 page 套 lazy + Suspense fallback
const lazyPage = (Page: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoading />}>
    <Page />
  </Suspense>
)

function App() {
  return (
    <Routes>
      <Route path="/login" element={lazyPage(Login)} />
      <Route path="/register" element={lazyPage(Register)} />

      {/* 首页 Dashboard */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoading />}>
              <Home />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* 博客前台展示 — PRD Stage 2 */}
      <Route
        path="/blogs"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoading />}>
              <BlogList />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/blogs/:slug"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoading />}>
              <BlogDetail />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoading />}>
              <CategoryIndex />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories/:slug"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoading />}>
              <CategoryPosts />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tags"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoading />}>
              <TagCloud />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tags/:slug"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoading />}>
              <TagPosts />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/archive"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoading />}>
              <Archive />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* 项目展示 */}
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoading />}>
              <ProjectShowcase />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/manage"
        element={
          <ProtectedRoute requireAdmin>
            <Suspense fallback={<PageLoading />}>
              <ProjectManage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/new"
        element={
          <ProtectedRoute requireAdmin>
            <Suspense fallback={<PageLoading />}>
              <ProjectCreate />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoading />}>
              <ProjectDetail />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoading />}>
              <Profile />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoading />}>
              <Settings />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoading />}>
              <Notifications />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* 博客后台管理 */}
      <Route
        path="/blog"
        element={
          <ProtectedRoute requireAdmin>
            <Suspense fallback={<PageLoading />}>
              <BlogManage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/blog/create"
        element={
          <ProtectedRoute requireAdmin>
            <Suspense fallback={<PageLoading />}>
              <BlogEditor />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/blog/edit/:id"
        element={
          <ProtectedRoute requireAdmin>
            <Suspense fallback={<PageLoading />}>
              <BlogEditor />
            </Suspense>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
