import { useEffect, useState } from 'react'

export const useTheme = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system')
  const getSystemTheme = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  const applyTheme = (selectedTheme) => {
    const root = document.documentElement
    const applied = selectedTheme === 'system' ? getSystemTheme() : selectedTheme
    if (applied === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', selectedTheme)
  }
  useEffect(() => {
    applyTheme(theme)
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [theme])

  return { theme, setTheme }
};