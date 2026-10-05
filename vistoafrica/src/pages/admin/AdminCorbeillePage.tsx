import { Archive, LoaderCircle, RotateCcw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { useAdminAuth } from '../../contexts/AdminAuthContext'

type TrashData = {
  students: { id: string; firstName: string; lastName: string; email: string; phone: string | null; deletedAt: string; registrationCount: number; canDeletePermanently: boolean }[]
  courses: { id: string; name: string; slug: string; archivedAt: string; registrationCount: number; canDeletePermanently: boolean }[]
  payments: { id: string; amount: number; method: string; status: string; declaredAt: string; archivedAt: string; registration: { student: { firstName: string; lastName: string }; course: { name: string } } }[]
}
type AuditLog = { id: string; adminId: string; action: string; entityType: string; entityId: string; description: string | null; createdAt: string; admin: { fullName: string; email: string; role: string } }

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
const dateLabel = (date: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
const money = (value: number) => `${Number(value).toLocaleString('fr-FR')} FCFA`

const AdminCorbeillePage = () => {
  const { token } = useAdminAuth()
  const [trash, setTrash] = useState<TrashData>({ students: [], courses: [], payments: [] })
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [trashResponse, logsResponse] = await Promise.all([fetch(`${apiUrl}/api/admin/recycle-bin`, { headers }), fetch(`${apiUrl}/api/admin/audit-logs?page=1&pageSize=50`, { headers })])
      const [trashResult, logsResult] = await Promise.all([trashResponse.json(), logsResponse.json()]) as [{ data?: TrashData; message?: string }, { data?: { items: AuditLog[] }; message?: string }]
      if (!trashResponse.ok || !trashResult.data) throw new Error(trashResult.message ?? 'Impossible de charger la corbeille.')
      setTrash(trashResult.data); setLogs(logsResponse.ok ? logsResult.data?.items ?? [] : [])
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Impossible de charger la corbeille.') } finally { setLoading(false) }
  }, [token])

  useEffect(() => { void load() }, [load])

  const restore = async (type: 'students' | 'courses' | 'payments', id: string) => {
    setProcessing(`${type}:${id}`); setError(''); setNotice('')
    try {
      const singular = type === 'students' ? 'students' : type === 'courses' ? 'courses' : 'payments'
      const response = await fetch(`${apiUrl}/api/admin/${singular}/${id}/restore`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({}) })
      const result = (await response.json()) as { message?: string }
      if (!response.ok) throw new Error(result.message ?? 'Impossible de restaurer cet élément.')
      setNotice(result.message ?? 'Élément restauré.')
      await load()
    } catch (restoreError) { setError(restoreError instanceof Error ? restoreError.message : 'Impossible de restaurer cet élément.') } finally { setProcessing('') }
  }

  const permanentlyDelete = async (type: 'students' | 'courses', id: string, label: string) => {
    if (!window.confirm(`${label}\n\nCette action est irréversible.`)) return
    if (window.prompt('Pour confirmer définitivement, saisissez SUPPRIMER :') !== 'SUPPRIMER') return
    setProcessing(`${type}:${id}`); setError(''); setNotice('')
    try {
      const response = await fetch(`${apiUrl}/api/admin/recycle-bin/${type}/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ comment: 'Suppression définitive confirmée dans la corbeille.' }) })
      const result = (await response.json()) as { message?: string }
      if (!response.ok) throw new Error(result.message ?? 'Suppression définitive impossible.')
      setNotice(result.message ?? 'Suppression définitive effectuée.')
      await load()
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Suppression définitive impossible.') } finally { setProcessing('') }
  }

  const actionButtons = (type: 'students' | 'courses' | 'payments', id: string, allowPermanent: boolean, canDelete: boolean, label: string) => <div className="flex flex-wrap gap-2"><button type="button" disabled={Boolean(processing)} onClick={() => void restore(type, id)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"><RotateCcw className="h-4 w-4" />{processing === `${type}:${id}` ? 'Restauration...' : 'Restaurer'}</button>{allowPermanent && <button type="button" disabled={Boolean(processing) || !canDelete} onClick={() => void permanentlyDelete(type as 'students' | 'courses', id, label)} title={!canDelete ? 'Impossible : des inscriptions et documents historiques sont liés.' : 'Suppression définitive après double confirmation'} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" />Supprimer définitivement</button>}</div>

  return <div className="mx-auto max-w-7xl space-y-8"><header><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-green">Administration</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Corbeille et journal d’audit</h1><p className="mt-2 text-slate-600">Les paiements sont archivés uniquement et ne peuvent pas être supprimés depuis cette interface.</p></header>{error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}{notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</p>}{loading ? <div className="flex justify-center p-10"><LoaderCircle className="animate-spin text-brand-green" /></div> : <div className="space-y-6">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-xl font-bold"><Archive className="h-5 w-5 text-brand-green" />Étudiants archivés</h2>{trash.students.length ? <div className="mt-4 divide-y divide-slate-100">{trash.students.map((student) => <article key={student.id} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center"><div><p className="font-semibold">{student.firstName} {student.lastName}</p><p className="text-sm text-slate-600">{student.email} · {student.phone ?? 'Téléphone non renseigné'}</p><p className="text-xs text-slate-500">Archivé le {dateLabel(student.deletedAt)} · {student.registrationCount} inscription(s)</p></div>{actionButtons('students', student.id, true, student.canDeletePermanently, `Supprimer définitivement ${student.firstName} ${student.lastName} ?`)}</article>)}</div> : <p className="mt-4 text-sm text-slate-500">Aucun étudiant archivé.</p>}</section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-xl font-bold"><Archive className="h-5 w-5 text-brand-green" />Formations archivées</h2>{trash.courses.length ? <div className="mt-4 divide-y divide-slate-100">{trash.courses.map((course) => <article key={course.id} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center"><div><p className="font-semibold">{course.name}</p><p className="text-sm text-slate-600">{course.registrationCount} inscription(s) associée(s)</p><p className="text-xs text-slate-500">Archivée le {dateLabel(course.archivedAt)}</p></div>{actionButtons('courses', course.id, true, course.canDeletePermanently, `Supprimer définitivement la formation ${course.name} ?`)}</article>)}</div> : <p className="mt-4 text-sm text-slate-500">Aucune formation archivée.</p>}</section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-xl font-bold"><Archive className="h-5 w-5 text-brand-green" />Paiements archivés</h2>{trash.payments.length ? <div className="mt-4 divide-y divide-slate-100">{trash.payments.map((payment) => <article key={payment.id} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center"><div><p className="font-semibold">{payment.registration.student.firstName} {payment.registration.student.lastName} · {payment.registration.course.name}</p><p className="text-sm text-slate-600">{money(payment.amount)} · {payment.method} · {payment.status}</p><p className="text-xs text-slate-500">Paiement du {dateLabel(payment.declaredAt)} · archivé le {dateLabel(payment.archivedAt)}</p></div>{actionButtons('payments', payment.id, false, false, 'Paiement')}</article>)}</div> : <p className="mt-4 text-sm text-slate-500">Aucun paiement archivé.</p>}</section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="text-xl font-bold">Journal des actions administratives</h2><p className="mt-1 text-sm text-slate-500">Qui, quelle ressource, quand et commentaire éventuel.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Administrateur</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Élément</th><th className="px-5 py-3">Détail / motif</th><th className="px-5 py-3">Date</th></tr></thead><tbody className="divide-y divide-slate-100">{logs.map((log) => <tr key={log.id}><td className="px-5 py-3">{log.admin.fullName}<br /><span className="text-xs text-slate-500">{log.admin.email}</span></td><td className="px-5 py-3 font-mono text-xs">{log.action}</td><td className="px-5 py-3">{log.entityType}<br /><span className="font-mono text-xs text-slate-500">{log.entityId}</span></td><td className="max-w-md px-5 py-3 text-slate-600">{log.description ?? '—'}</td><td className="whitespace-nowrap px-5 py-3">{dateLabel(log.createdAt)}</td></tr>)}{logs.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Aucune action auditée.</td></tr>}</tbody></table></div></section>
  </div>}</div>
}

export default AdminCorbeillePage
