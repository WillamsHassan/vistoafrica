import { ArrowLeft, ChevronLeft, ChevronRight, Eye, LoaderCircle, Search, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAdminAuth } from '../../contexts/AdminAuthContext'

type Visitor = { id: string; visitorId: string; firstSeenAt: string; lastSeenAt: string; duration: number; pageViews: number; entryPage: string; lastPage: string; deviceType: string | null; browser: string | null; status: string }
type Overview = { visitorsToday: number; visitorsThisWeek: number; visitorsThisMonth: number; uniqueVisitors: number; pageViews: number; averageDuration: number; returningVisitors: number; registrations: number; payments: number; visitorsByDay: { date: string; visitors: number; pageViews: number }[]; topPages: { path: string; views: number }[]; devices: { label: string; count: number }[]; sources: { label: string; count: number }[]; courses: { label: string; count: number }[] }
type Detail = Visitor & { pageViewRecords: { path: string; title: string | null; timestamp: string; duration: number }[]; analyticsEvents: { type: string; path: string; createdAt: string }[] }

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
const formatDate = (value: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const statusLabels: Record<string, string> = { VISITOR: 'Visiteur', REGISTRATION_STARTED: 'Inscription commencée', REGISTRATION_COMPLETED: 'Inscription terminée', PAYMENT_DECLARED: 'Paiement déclaré' }

const Stat = ({ label, value }: { label: string; value: number }) => <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value.toLocaleString('fr-FR')}</p></div>
const BarList = ({ title, items }: { title: string; items: { label: string; count: number }[] }) => <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-slate-900">{title}</h2><div className="mt-4 space-y-3">{items.length === 0 ? <p className="text-sm text-slate-500">Aucune donnée.</p> : items.slice(0, 6).map((item) => <div key={item.label}><div className="flex justify-between gap-3 text-sm"><span className="truncate text-slate-600">{item.label}</span><span className="font-semibold text-slate-900">{item.count}</span></div><div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-green" style={{ width: `${Math.max((item.count / Math.max(...items.map((entry) => entry.count), 1)) * 100, 5)}%` }} /></div></div>)}</div></section>

const AdminVisiteursPage = () => {
  const { id } = useParams<{ id: string }>()
  const { token } = useAdminAuth()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [items, setItems] = useState<Visitor[]>([])
  const [detail, setDetail] = useState<Detail | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [device, setDevice] = useState('')
  const [status, setStatus] = useState('')
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('')
      try {
        const [overviewResponse, visitorsResponse] = await Promise.all([fetch(`${apiUrl}/api/admin/analytics/overview`, { headers: { Authorization: `Bearer ${token}` } }), fetch(`${apiUrl}/api/admin/analytics/visitors?page=${page}&pageSize=15${device ? `&device=${encodeURIComponent(device)}` : ''}${status ? `&status=${status}` : ''}`, { headers: { Authorization: `Bearer ${token}` } })])
        const overviewResult = (await overviewResponse.json()) as { data?: Overview; message?: string }
        const visitorResult = (await visitorsResponse.json()) as { data?: { items: Visitor[]; pagination: { totalPages: number } }; message?: string }
        if (!overviewResponse.ok || !overviewResult.data || !visitorsResponse.ok || !visitorResult.data) throw new Error(overviewResult.message ?? visitorResult.message ?? 'Impossible de charger les analytics.')
        setOverview(overviewResult.data); setItems(visitorResult.data.items); setTotalPages(visitorResult.data.pagination.totalPages)
      } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Erreur de chargement.') } finally { setLoading(false) }
    }
    void load()
  }, [token, page, device, status])

  useEffect(() => {
    if (!id) { setDetail(null); return }
    fetch(`${apiUrl}/api/admin/analytics/visitors/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(async (response) => { const result = (await response.json()) as { data?: Detail; message?: string }; if (!response.ok || !result.data) throw new Error(result.message ?? 'Session introuvable.'); setDetail(result.data) }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Erreur de chargement.'))
  }, [id, token])

  const deleteVisitor = async (visitorId: string) => {
    if (!window.confirm('Supprimer définitivement cette session analytics ?')) return
    const response = await fetch(`${apiUrl}/api/admin/analytics/visitors/${visitorId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    if (response.ok) setItems((current) => current.filter((item) => item.id !== visitorId))
  }

  if (id) return <div className="mx-auto max-w-5xl space-y-6"><Link to="/admin/visiteurs" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-green"><ArrowLeft className="h-4 w-4" />Retour aux visiteurs</Link>{detail ? <><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-green">Session anonyme</p><h1 className="mt-2 text-3xl font-bold text-slate-900">{detail.visitorId.slice(0, 12)}...</h1><p className="mt-2 text-sm text-slate-500">{formatDate(detail.firstSeenAt)} · {statusLabels[detail.status] ?? detail.status}</p></div><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-slate-900">Timeline</h2><div className="mt-5 space-y-4">{[...detail.pageViewRecords.map((item) => ({ time: item.timestamp, label: item.title || item.path })), ...detail.analyticsEvents.map((item) => ({ time: item.createdAt, label: statusLabels[item.type] ?? item.type }))].sort((a, b) => +new Date(a.time) - +new Date(b.time)).map((item, index) => <div key={`${item.time}-${index}`} className="flex gap-4 border-l-2 border-brand-greenSoft pl-4"><p className="w-32 shrink-0 text-xs text-slate-500">{new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.time))}</p><p className="text-sm font-medium text-slate-800">{item.label}</p></div>)}</div></section></> : <LoaderCircle className="animate-spin text-brand-green" />}</div>

  return <div className="mx-auto max-w-7xl space-y-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-green">Administration</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Visiteurs / Analytics</h1><p className="mt-2 text-slate-600">Mesure anonyme des parcours, formations et abandons d’inscription.</p></div><Users className="hidden h-9 w-9 text-brand-green sm:block" /></div>{error && <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}{overview && <><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Visiteurs aujourd’hui" value={overview.visitorsToday} /><Stat label="Cette semaine" value={overview.visitorsThisWeek} /><Stat label="Ce mois" value={overview.visitorsThisMonth} /><Stat label="Pages vues" value={overview.pageViews} /><Stat label="Durée moyenne (secondes)" value={overview.averageDuration} /><Stat label="Visiteurs revenants" value={overview.returningVisitors} /><Stat label="Inscriptions visiteurs" value={overview.registrations} /><Stat label="Paiements déclarés" value={overview.payments} /></section><section className="grid gap-6 lg:grid-cols-3"><BarList title="Top pages" items={overview.topPages.map((item) => ({ label: item.path, count: item.views }))} /><BarList title="Appareils" items={overview.devices} /><BarList title="Formations consultées" items={overview.courses} /></section></>}{loading ? <div className="flex justify-center p-12"><LoaderCircle className="animate-spin text-brand-green" /></div> : <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap gap-3 border-b border-slate-200 p-4"><label className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une session ou une page" className="input-field pl-10" /></label><select value={device} onChange={(event) => { setDevice(event.target.value); setPage(1) }} className="input-field"><option value="">Tous les appareils</option><option>Mobile</option><option>Tablette</option><option>Ordinateur</option></select><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="input-field"><option value="">Tous les statuts</option><option value="REGISTRATION_STARTED">Inscription commencée</option><option value="REGISTRATION_COMPLETED">Inscription terminée</option><option value="PAYMENT_DECLARED">Paiement déclaré</option></select></div><div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Session</th><th className="px-5 py-4">Première visite</th><th className="px-5 py-4">Dernière activité</th><th className="px-5 py-4">Pages</th><th className="px-5 py-4">Parcours</th><th className="px-5 py-4">Appareil</th><th className="px-5 py-4">Statut</th><th className="px-5 py-4">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{items.filter((item) => !search || `${item.visitorId} ${item.entryPage} ${item.lastPage}`.toLowerCase().includes(search.toLowerCase())).map((item) => <tr key={item.id} className="hover:bg-slate-50"><td className="px-5 py-4 font-mono text-xs text-slate-500">{item.visitorId.slice(0, 12)}</td><td className="px-5 py-4 whitespace-nowrap text-slate-600">{formatDate(item.firstSeenAt)}</td><td className="px-5 py-4 whitespace-nowrap text-slate-600">{formatDate(item.lastSeenAt)}</td><td className="px-5 py-4 font-semibold">{item.pageViews}</td><td className="px-5 py-4 text-slate-600">{item.entryPage} → {item.lastPage}</td><td className="px-5 py-4">{item.deviceType ?? 'Inconnu'}<br /><span className="text-xs text-slate-400">{item.browser}</span></td><td className="px-5 py-4"><span className="whitespace-nowrap rounded-full bg-brand-greenSoft px-3 py-1 text-xs font-semibold text-brand-green">{statusLabels[item.status] ?? item.status}</span></td><td className="px-5 py-4"><div className="flex gap-2"><Link to={`/admin/visiteurs/${item.id}`} className="rounded-lg p-2 text-brand-green hover:bg-brand-greenSoft" aria-label="Voir la session"><Eye className="h-4 w-4" /></Link><button type="button" onClick={() => void deleteVisitor(item.id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" aria-label="Supprimer la session"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}{items.length === 0 && <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-500">Aucune session enregistrée.</td></tr>}</tbody></table></div><div className="flex justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-500"><span>Page {page} sur {Math.max(totalPages, 1)}</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border p-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border p-2 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div></div></section>}</div>
}

export default AdminVisiteursPage
