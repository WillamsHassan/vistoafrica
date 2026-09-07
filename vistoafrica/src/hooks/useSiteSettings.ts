import { useEffect, useState } from 'react'

export type SiteSettings = Record<string, string>

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>({})

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/settings`)
        const result = (await response.json()) as { data?: SiteSettings }
        if (response.ok && result.data) setSettings(result.data)
      } catch {
        setSettings({})
      }
    }
    void loadSettings()
  }, [])

  return settings
}
