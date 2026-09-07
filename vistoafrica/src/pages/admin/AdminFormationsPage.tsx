import { Pencil, Plus, Power, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { useAdminAuth } from '../../contexts/AdminAuthContext'
import type { CourseApi } from '../../types/course'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
type FormState = Omit<CourseApi, 'id' | 'isActive' | 'installments'> & { installments: string }
const emptyForm: FormState = { name: '', slug: '', category: '', type: '', description: '', duration: '', frequency: '', sessionDuration: '', price: '', registrationFee: '', hourlyRate: '', examIncluded: false, manualIncluded: false, preparationFees: '', installments: '', image: '' }
const amount = (value: string | number | null) => value === null ? '' : String(value)
const toForm = (course: CourseApi): FormState => ({ ...course, price: amount(course.price), registrationFee: amount(course.registrationFee), hourlyRate: amount(course.hourlyRate), preparationFees: amount(course.preparationFees), image: course.image ?? '', duration: course.duration ?? '', frequency: course.frequency ?? '', sessionDuration: course.sessionDuration ?? '', installments: Array.isArray(course.installments) ? course.installments.join('\n') : '' })

const AdminFormationsPage = () => {
  const { token } = useAdminAuth()
  const [courses, setCourses] = useState<CourseApi[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCourses = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${apiUrl}/api/admin/courses?includeInactive=true`, { headers: { Authorization: `Bearer ${token}` } })
      const result = (await response.json()) as { data?: CourseApi[]; message?: string }
      if (!response.ok || !result.data) throw new Error(result.message ?? 'Impossible de charger les formations.')
      setCourses(result.data)
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Erreur de chargement.') } finally { setLoading(false) }
  }
  useEffect(() => { void loadCourses() }, [token])

  const save = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    const payload = { ...form, price: Number(form.price), registrationFee: Number(form.registrationFee), hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : null, preparationFees: form.preparationFees ? Number(form.preparationFees) : null, installments: form.installments.split('\n').map((item) => item.trim()).filter(Boolean), image: form.image || null }
    const response = await fetch(`${apiUrl}/api/admin/courses${editingId ? `/${editingId}` : ''}`, { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
    const result = (await response.json()) as { message?: string }
    if (!response.ok) { setError(result.message ?? 'Impossible d’enregistrer la formation.'); return }
    setShowForm(false); setEditingId(null); setForm(emptyForm); await loadCourses()
  }

  const toggle = async (course: CourseApi) => {
    const response = await fetch(`${apiUrl}/api/admin/courses/${course.id}/active`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ active: !course.isActive }) })
    if (!response.ok) { const result = (await response.json()) as { message?: string }; setError(result.message ?? 'Impossible de modifier le statut.'); return }
    await loadCourses()
  }

  const field = (key: keyof FormState, label: string, type = 'text') => <label className="block text-sm font-semibold text-slate-700">{label}<input required={['name', 'slug', 'category', 'type', 'description', 'price', 'registrationFee'].includes(key)} type={type} value={String(form[key] ?? '')} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className="input-field mt-2" /></label>

  return <div className="mx-auto max-w-7xl space-y-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-green">Administration</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Formations</h1><p className="mt-2 text-slate-600">Créez et gérez les offres publiées sur le site.</p></div><button type="button" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }} className="btn-primary gap-2"><Plus className="h-4 w-4" />Nouvelle formation</button></div>
    {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {showForm && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900">{editingId ? 'Modifier la formation' : 'Créer une formation'}</h2><button type="button" onClick={() => setShowForm(false)} aria-label="Fermer"><X className="h-5 w-5" /></button></div><form onSubmit={save} className="mt-5 grid gap-4 md:grid-cols-2">{field('name', 'Nom')}{field('slug', 'Slug')}{field('category', 'Catégorie')}{field('type', 'Type')}{field('price', 'Prix', 'number')}{field('registrationFee', 'Frais d’inscription', 'number')}{field('duration', 'Durée')}{field('frequency', 'Fréquence')}{field('sessionDuration', 'Durée séance')}{field('hourlyRate', 'Coût horaire', 'number')}{field('preparationFees', 'Frais de préparation', 'number')}{field('image', 'Image URL', 'url')}<label className="block text-sm font-semibold text-slate-700 md:col-span-2">Description<textarea required value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="input-field mt-2 min-h-24" /></label><label className="block text-sm font-semibold text-slate-700 md:col-span-2">Tranches<textarea value={form.installments} onChange={(event) => setForm((current) => ({ ...current, installments: event.target.value }))} placeholder="Une tranche par ligne" className="input-field mt-2 min-h-20" /></label><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.examIncluded} onChange={(event) => setForm((current) => ({ ...current, examIncluded: event.target.checked }))} />Examen inclus</label><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.manualIncluded} onChange={(event) => setForm((current) => ({ ...current, manualIncluded: event.target.checked }))} />Manuel inclus</label><div className="md:col-span-2"><button type="submit" className="btn-primary">Enregistrer</button></div></form></section>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Nom</th><th className="px-5 py-4">Catégorie</th><th className="px-5 py-4">Type</th><th className="px-5 py-4">Prix</th><th className="px-5 py-4">Statut</th><th className="px-5 py-4">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">Chargement...</td></tr> : courses.map((course) => <tr key={course.id}><td className="px-5 py-4"><p className="font-semibold text-slate-900">{course.name}</p><p className="mt-1 font-mono text-xs text-slate-500">{course.slug}</p></td><td className="px-5 py-4 text-slate-600">{course.category}</td><td className="px-5 py-4 text-slate-600">{course.type}</td><td className="px-5 py-4 font-semibold">{Number(course.price).toLocaleString('fr-FR')} FCFA</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${course.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{course.isActive ? 'Active' : 'Désactivée'}</span></td><td className="px-5 py-4"><div className="flex gap-2"><button type="button" onClick={() => { setForm(toForm(course)); setEditingId(course.id); setShowForm(true) }} className="rounded-lg p-2 text-brand-green hover:bg-brand-greenSoft" aria-label="Modifier"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => void toggle(course)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label={course.isActive ? 'Désactiver' : 'Réactiver'}><Power className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div></section>
  </div>
}

export default AdminFormationsPage
