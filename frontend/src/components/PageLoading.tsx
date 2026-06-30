// 页面加载骨架 — lazy 加载时显示,防止白屏
import { Spin } from 'antd'

export default function PageLoading() {
  return (
    <div
      className="page-fade-in"
      style={{
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Spin size="large" />
    </div>
  )
}
