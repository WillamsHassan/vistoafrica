import { useEffect, useState } from 'react'

export type SiteSettings = Record<string, string>

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
const fallbackSettings: SiteSettings = {
  payment_mtn_number: '653215578',
  payment_mtn_holder: 'M. Tchinda Pascal',
  payment_orange_number: '656040010',
  payment_orange_holder: 'Mafouo Tchinda',
  payment_whatsapp: '658818863',
  contact_email: 'adminvistoafrica@gmail.com',
  contact_phone: '658818863',
  contact_address: 'Douala, Cameroun',
}

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(fallbackSettings)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/settings`)
        const result = (await response.json()) as { data?: SiteSettings }
        if (response.ok && result.data) {
          setSettings({ ...fallbackSettings, ...Object.fromEntries(Object.entries(result.data).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')) })
        }
      } catch {
        setSettings(fallbackSettings)
      }
    }
    void loadSettings()
  }, [])

  return settings
}
