// 用户头像 — 覆盖默认头像,持久化到 localStorage
// 优先级:user.avatar > 本地覆盖 > 默认字母
import { useState, useEffect } from 'react'
import { fileToBase64, validateImageFile } from './useGreetingBg'

const STORAGE_KEY = 'user-avatar-override'

export function getStoredAvatar(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function useUserAvatar() {
  const [avatar, setAvatar] = useState<string>(getStoredAvatar)

  useEffect(() => {
    try {
      if (avatar) localStorage.setItem(STORAGE_KEY, avatar)
      else localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.warn('user-avatar 保存失败:', e)
    }
  }, [avatar])

  /** 从 File 上传并保存(校验 + 转 base64) */
  const uploadFromFile = async (file: File): Promise<{ ok: boolean; error?: string }> => {
    const v = validateImageFile(file)
    if (!v.ok) return v
    try {
      const dataUrl = await fileToBase64(file)
      setAvatar(dataUrl)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: '读取图片失败' }
    }
  }

  /** 直接设置 base64/URL(给 input onChange 文本框用) */
  const setFromUrl = (url: string) => {
    if (!url) {
      setAvatar('')
      return
    }
    setAvatar(url)
  }

  const clear = () => setAvatar('')

  return { avatar, setAvatar, uploadFromFile, setFromUrl, clear }
}