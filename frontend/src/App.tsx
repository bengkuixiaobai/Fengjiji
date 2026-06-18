import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Login from './pages/Login/Login'
import Register from './pages/Login/Register'
import Home from './pages/Home'
import BlogManage from './pages/BlogManage'
import BlogEditor from './pages/BlogEditor'

// 受保护的路由组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/blog"
        element={
          <ProtectedRoute>
            <BlogManage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/blog/create"
        element={
          <ProtectedRoute>
            <BlogEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/blog/edit/:id"
        element={
          <ProtectedRoute>
            <BlogEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
