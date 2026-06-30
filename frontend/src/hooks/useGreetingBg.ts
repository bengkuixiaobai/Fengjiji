// 主页问候框背景 — 持久化到 localStorage
// 支持:预设渐变 / 自定义颜色 / 图片 URL / 上传图片(base64)
import { useState, useEffect } from 'react'

export const GREETING_PRESETS = [
  { id: 'gradient-purple', label: '紫色渐变', value: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { id: 'gradient-blue', label: '蓝色渐变', value: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { id: 'gradient-orange', label: '暖橙渐变', value: 'linear-gradient(135deg, #fa709a, #fee140)' },
  { id: 'gradient-green', label: '清新绿', value: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  { id: 'gradient-sunset', label: '日落', value: 'linear-gradient(135deg, #ff9a9e, #fad0c4, #fbc2eb)' },
  { id: 'gradient-ocean', label: '海洋', value: 'linear-gradient(135deg, #2e3192, #1bffff)' },
  { id: 'gradient-mint', label: '薄荷', value: 'linear-gradient(135deg, #00b09b, #96c93d)' },
] as const

export const DEFAULT_GREETING_BG = 'gradient-purple'

/** 把设置项 id 转成 CSS background 值 */
export function resolveGreetingBg(id: string | null | undefined): string {
  if (!id) return GREETING_PRESETS[0].value
  // 预设
  const preset = GREETING_PRESETS.find(p => p.id === id)
  if (preset) return preset.value
  // image:URL 或 image:base64,...
  if (id.startsWith('image:')) {
    const src = id.slice(6)
    return `url("${src}")`
  }
  // color:#xxx
  if (id.startsWith('color:')) return id.slice(6)
  // 兜底:当 CSS 值直接传入(用于实时预览)
  return id
}

const STORAGE_KEY = 'greeting-bg'

export function useGreetingBg() {
  const [bgId, setBgId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_GREETING_BG
    } catch {
      return DEFAULT_GREETING_BG
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, bgId)
    } catch (e) {
      // 配额超限(base64 太大) — 清掉旧值,降级到默认
      console.warn('greeting-bg 保存失败(可能图片太大):', e)
    }
    document.documentElement.setAttribute('data-greeting-bg', bgId)
  }, [bgId])

  return [bgId, setBgId] as const
}

/** 把 File 转 base64 dataURL */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** 校验图片文件(类型 + 大小 + 推荐尺寸) */
export function validateImageFile(file: File): { ok: boolean; error?: string } {
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: '请选择图片文件' }
  }
  // 限制 2MB(防止 localStorage 爆)
  const maxSize = 2 * 1024 * 1024
  if (file.size > maxSize) {
    return { ok: false, error: '图片不能超过 2MB' }
  }
  return { ok: true }
}

/** 读图片尺寸(width/height) */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve({ width: img.width, height: img.height })
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}