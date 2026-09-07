import { ChevronLeft, ChevronRight, Eye, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { useAdminAuth } from '../../contexts/AdminAuthContext'

type Course = { id: string; name: string }
type Registration = { id: string; status: string; amount: string | number; createdAt: string; student: { firstName: string; lastName: string; email: string }; course: Course }
type ResponseData = { items: Registration[]; pagination: { page: number; total: number; totalPages: number } }

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
const statuses = ['', 'PENDING', 'PAYMENT_PENDING', 'PAYMENT_DECLARED', 'PAYMENT_VERIFIED', 'CONFIRMED', 'REJECTED', 'CANCELLED']
const labels: Record<string, string> = { '': 'Toutes', PENDING: 'En attente', PAYMENT_PENDING: 'Paiement en attente', PAYMENT_DECLARED: 'Paiement déclaré', PAYMENT_VERIFIED: 'Paiement vérifié', CONFIRMED: 'Confirmée', REJECTED: 'Rejetée', CANCELLED: 'Annulée' }
const formatDate = (value: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
const formatAmount = (value: string | number) => `${Number(value).toLocaleString('fr-FR')} FCFA`

const AdminInscriptionsPage = () => {
  const { token } = useAdminAuth()
  const [data, setData] = useState<ResponseData>({ items: [], pagination: { page: 1, total: 0, totalPages: 0 } })
  const [courses, setCourses] = useState<Course[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [courseId, setCourseId] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCourses = async () => {
      const response = await fetch(`${apiUrl}/api/courses`)
      if (response.ok) { const result = (await response.json()) as { data: Course[] }; setCourses(result.data) }
    }
    void loadCourses()
  }, [])

  useEffect(() => {
    const loadRegistrations = async () => {
      setLoading(true); setError('')
      const params = new URLSearchParams({ page: String(page), pageSize: '10' })
      if (search.trim()) params.set('search', search.trim())
      if (status) params.set('status', status)
      if (courseId) params.set('courseId', courseId)
      try {
        const response = await fetch(`${apiUrl}/api/admin/registrations?${params}`, { headers: { Authorization: `Bearer ${token}` } })
        const result = (await response.json()) as { data?: ResponseData; message?: string }
        if (!response.ok || !result.data) throw new Error(result.message ?? 'Impossible de charger les inscriptions.')
        setData(result.data)
      } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Erreur de chargement.') } finally { setLoading(false) }
    }
    void loadRegistrations()
  }, [token, page, search, status, courseId])

  const changeFilter = (setter: (value: string) => void, value: string) => { setter(value); setPage(1) }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-green">Administration</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Inscriptions</h1><p className="mt-2 text-slate-600">Suivi des dossiers et des statuts de paiement.</p></div><p className="text-sm text-slate-500">{data.pagination.total} inscription{data.pagination.total > 1 ? 's' : ''}</p></div>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_220px_240px]"><label className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => changeFilter(setSearch, event.target.value)} placeholder="Rechercher une inscription, un étudiant..." className="input-field pl-10" /></label><select value={status} onChange={(event) => changeFilter(setStatus, event.target.value)} className="input-field">{statuses.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select><select value={courseId} onChange={(event) => changeFilter(setCourseId, event.target.value)} className="input-field"><option value="">Toutes les formations</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></div></section>
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">N° inscription</th><th className="px-5 py-4">Étudiant</th><th className="px-5 py-4">Formation</th><th className="px-5 py-4">Montant</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Statut</th><th className="px-5 py-4">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-500">Chargement des inscriptions...</td></tr> : data.items.length === 0 ? <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-500">Aucune inscription trouvée.</td></tr> : data.items.map((registration) => <tr key={registration.id} className="hover:bg-slate-50"><td className="px-5 py-4 font-mono text-xs text-slate-500">{registration.id.slice(0, 10)}</td><td className="px-5 py-4"><p className="font-semibold text-slate-900">{registration.student.firstName} {registration.student.lastName}</p><p className="mt-1 text-xs text-slate-500">{registration.student.email}</p></td><td className="px-5 py-4 text-slate-600">{registration.course.name}</td><td className="px-5 py-4 whitespace-nowrap font-semibold text-slate-900">{formatAmount(registration.amount)}</td><td className="px-5 py-4 whitespace-nowrap text-slate-600">{formatDate(registration.createdAt)}</td><td className="px-5 py-4"><span className="whitespace-nowrap rounded-full bg-brand-greenSoft px-3 py-1 text-xs font-semibold text-brand-green">{labels[registration.status] ?? registration.status}</span></td><td className="px-5 py-4"><Link to={`/admin/inscriptions/${registration.id}`} className="inline-flex items-center gap-1 rounded-lg p-2 font-semibold text-brand-green hover:bg-brand-greenSoft" aria-label={`Consulter l'inscription ${registration.id}`}><Eye className="h-4 w-4" />Consulter</Link></td></tr>)}</tbody></table></div><div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>Page {data.pagination.page} sur {Math.max(data.pagination.totalPages, 1)}</span><div className="flex gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 p-2 hover:border-brand-green disabled:opacity-40" aria-label="Page précédente"><ChevronLeft className="h-4 w-4" /></button><button type="button" disabled={page >= data.pagination.totalPages || loading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 p-2 hover:border-brand-green disabled:opacity-40" aria-label="Page suivante"><ChevronRight className="h-4 w-4" /></button></div></div></section>
+    </div>
  )
}

export default AdminInscriptionsPage
