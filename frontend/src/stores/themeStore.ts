import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
  isDarkMode: boolean
  toggleTheme: () => void
  setDarkMode: (dark: boolean) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: true,
      toggleTheme: () =>
        set((state) => {
          const next = !state.isDarkMode
          document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
          return { isDarkMode: next }
        }),
      setDarkMode: (dark: boolean) => {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
        set({ isDarkMode: dark })
      },
    }),
    {
      name: 'theme-storage',
    }
  )
)

// 初始化时同步 data-theme 属性
const stored = localStorage.getItem('theme-storage')
if (stored) {
  try {
    const parsed = JSON.parse(stored)
    const dark = parsed?.state?.isDarkMode ?? true
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  } catch {
    document.documentElement.setAttribute('data-theme', 'dark')
  }
} else {
  document.documentElement.setAttribute('data-theme', 'dark')
}
