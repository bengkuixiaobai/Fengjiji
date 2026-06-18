import { memo } from 'react'

/** 页面底层动态背景 — 浮动光晕 */
function BackgroundAnimation() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      {/* 光晕 1 — 左上 */}
      <div style={{
        position: 'absolute',
        width: '700px', height: '700px',
        top: '-15%', left: '-15%',
        background: 'radial-gradient(circle, rgba(102,126,234,0.55) 0%, transparent 55%)',
        borderRadius: '50%',
        animation: 'bgFloat1 22s ease-in-out infinite',
      }} />

      {/* 光晕 2 — 右下 */}
      <div style={{
        position: 'absolute',
        width: '800px', height: '800px',
        bottom: '-20%', right: '-15%',
        background: 'radial-gradient(circle, rgba(118,75,162,0.45) 0%, transparent 55%)',
        borderRadius: '50%',
        animation: 'bgFloat2 28s ease-in-out infinite',
      }} />

      {/* 光晕 3 — 中部 */}
      <div style={{
        position: 'absolute',
        width: '450px', height: '450px',
        top: '28%', right: '20%',
        background: 'radial-gradient(circle, rgba(102,126,234,0.35) 0%, transparent 55%)',
        borderRadius: '50%',
        animation: 'bgFloat3 20s ease-in-out infinite',
      }} />

      {/* 光晕 4 — 补充 */}
      <div style={{
        position: 'absolute',
        width: '350px', height: '350px',
        bottom: '18%', left: '8%',
        background: 'radial-gradient(circle, rgba(118,75,162,0.30) 0%, transparent 55%)',
        borderRadius: '50%',
        animation: 'bgFloat4 16s ease-in-out infinite',
      }} />

      <style>{`
        @keyframes bgFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(100px, 80px) scale(1.1); }
          66% { transform: translate(-60px, 120px) scale(0.9); }
        }
        @keyframes bgFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-90px, -100px) scale(1.1); }
          66% { transform: translate(70px, -60px) scale(0.9); }
        }
        @keyframes bgFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          50% { transform: translate(60px, -70px) scale(1.15); opacity: 1; }
        }
        @keyframes bgFloat4 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(-50px, 60px) scale(1.12); opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}

export default memo(BackgroundAnimation)
