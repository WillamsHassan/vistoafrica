import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { useAdminAuth } from '../../contexts/AdminAuthContext'

type Settings = {
  payment_mtn_number: string
  payment_mtn_holder: string
  payment_orange_number: string
  payment_orange_holder: string
  payment_whatsapp: string
  contact_email: string
  contact_phone: string
  contact_address: string
}

const emptySettings: Settings = { payment_mtn_number: '', payment_mtn_holder: '', payment_orange_number: '', payment_orange_holder: '', payment_whatsapp: '', contact_email: '', contact_phone: '', contact_address: '' }
const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

const AdminParametresPage = () => {
  const { token } = useAdminAuth()
  const [settings, setSettings] = useState<Settings>(emptySettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/settings`)
        const result = (await response.json()) as { data?: Partial<Settings>; message?: string }
        if (!response.ok || !result.data) throw new Error(result.message ?? 'Impossible de charger les paramètres.')
        setSettings({ ...emptySettings, ...result.data })
      } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Erreur de chargement.') } finally { setLoading(false) }
    }
    void load()
  }, [])

  const update = (key: keyof Settings, value: string) => setSettings((current) => ({ ...current, [key]: value }))

  const save = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setMessage('')
    if (Object.values(settings).some((value) => !value.trim())) { setError('Tous les champs sont obligatoires.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contact_email)) { setError('L’email officiel est invalide.'); return }
    setSaving(true)
    try {
      const response = await fetch(`${apiUrl}/api/admin/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(settings) })
      const result = (await response.json()) as { data?: Settings; message?: string }
      if (!response.ok || !result.data) throw new Error(result.message ?? 'Impossible d’enregistrer les paramètres.')
      setSettings(result.data); setMessage('Paramètres enregistrés avec succès.')
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Erreur d’enregistrement.') } finally { setSaving(false) }
  }

  const input = (key: keyof Settings, label: string, type = 'text') => <label className="block text-sm font-semibold text-slate-700">{label}<input required type={type} value={settings[key]} onChange={(event) => update(key, event.target.value)} className="input-field mt-2" /></label>

  if (loading) return <div className="mx-auto max-w-5xl py-10 text-slate-500">Chargement des paramètres...</div>

  return <div className="mx-auto max-w-5xl space-y-6"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-green">Administration</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Paramètres</h1><p className="mt-2 text-slate-600">Modifiez les coordonnées affichées sur le site et utilisées dans les emails.</p></div>{error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}{message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>}<form onSubmit={save} className="space-y-6"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">MTN Mobile Money</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{input('payment_mtn_number', 'Numéro')}{input('payment_mtn_holder', 'Titulaire')}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Orange Money</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{input('payment_orange_number', 'Numéro')}{input('payment_orange_holder', 'Titulaire')}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Coordonnées</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{input('payment_whatsapp', 'WhatsApp')}{input('contact_email', 'Email officiel', 'email')}{input('contact_phone', 'Téléphone')}{input('contact_address', 'Adresse')}</div></section><button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}</button></form></div>
}

export default AdminParametresPage
