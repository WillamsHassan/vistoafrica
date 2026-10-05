import { Archive, Check, Eye, ExternalLink, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useAdminAuth } from '../../contexts/AdminAuthContext'

type Payment = {
  id: string
  amount: string | number
  method: 'MTN' | 'ORANGE'
  status: 'PENDING' | 'DECLARED' | 'VERIFIED' | 'REJECTED'
  proofUrl: string | null
  declaredAt: string
  registration: { id: string; student: { firstName: string; lastName: string }; course: { name: string }; invoice: { id: string; invoiceNumber: string } | null }
}

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
const formatDate = (value: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const formatAmount = (value: string | number) => `${Number(value).toLocaleString('fr-FR')} FCFA`
const statusLabels: Record<Payment['status'], string> = { PENDING: 'En attente', DECLARED: 'À vérifier', VERIFIED: 'Vérifié', REJECTED: 'Rejeté' }
const statusClasses: Record<Payment['status'], string> = { PENDING: 'bg-slate-100 text-slate-600', DECLARED: 'bg-amber-100 text-amber-800', VERIFIED: 'bg-emerald-100 text-emerald-800', REJECTED: 'bg-rose-100 text-rose-800' }

const AdminPaiementsPage = () => {
  const { token } = useAdminAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null)
  const [archiveCandidate, setArchiveCandidate] = useState<Payment | null>(null)
  const [notice, setNotice] = useState('')

  const loadPayments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${apiUrl}/api/admin/payments`, { headers: { Authorization: `Bearer ${token}` } })
      const result = (await response.json()) as { data?: Payment[]; message?: string }
      if (!response.ok || !result.data) throw new Error(result.message ?? 'Impossible de charger les paiements.')
      setPayments(result.data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erreur de chargement.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadPayments() }, [token])

  const review = async (payment: Payment, action: 'confirm' | 'reject') => {
    const label = action === 'confirm' ? 'confirmer' : 'rejeter'
    if (!window.confirm(`Voulez-vous vraiment ${label} ce paiement ?`)) return
    const comment = window.prompt('Commentaire éventuel (facultatif) :') ?? ''
    setProcessingId(payment.id); setError('')
    try {
      const response = await fetch(`${apiUrl}/api/admin/payments/${payment.id}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action, comment: comment || undefined }) })
      const result = (await response.json()) as { message?: string }
      if (!response.ok) throw new Error(result.message ?? 'Action impossible.')
      await loadPayments()
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Action impossible.')
    } finally { setProcessingId(null) }
  }

  const archivePayment = async () => {
    if (!archiveCandidate) return
    setProcessingId(archiveCandidate.id); setError(''); setNotice('')
    try {
      const response = await fetch(`${apiUrl}/api/admin/payments/${archiveCandidate.id}/archive`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({}) })
      const result = (await response.json()) as { message?: string }
      if (!response.ok) throw new Error(result.message ?? 'Impossible d’archiver le paiement.')
      setNotice(result.message ?? 'Paiement archivé.')
      setArchiveCandidate(null)
      await loadPayments()
    } catch (archiveError) { setError(archiveError instanceof Error ? archiveError.message : 'Impossible d’archiver le paiement.') } finally { setProcessingId(null) }
  }

  const downloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    const response = await fetch(`${apiUrl}/api/invoices/${invoiceId}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
    if (!response.ok) { setError('Impossible de télécharger la facture.'); return }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = `${invoiceNumber}.pdf`; link.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-green">Administration</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Vérification des paiements</h1><p className="mt-2 text-slate-600">Les paiements déclarés restent en attente jusqu’à votre décision.</p></div>
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div>}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1250px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Étudiant</th><th className="px-5 py-4">Formation</th><th className="px-5 py-4">Montant</th><th className="px-5 py-4">Moyen</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Statut</th><th className="px-5 py-4">Reçu</th><th className="px-5 py-4">Facture</th><th className="px-5 py-4">N° inscription</th><th className="px-5 py-4">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">
        {loading ? <tr><td colSpan={10} className="px-5 py-12 text-center text-slate-500">Chargement des paiements...</td></tr> : payments.length === 0 ? <tr><td colSpan={10} className="px-5 py-12 text-center text-slate-500">Aucun paiement enregistré.</td></tr> : payments.map((payment) => <tr key={payment.id} className="hover:bg-slate-50">
          <td className="px-5 py-4 font-semibold text-slate-900">{payment.registration.student.firstName} {payment.registration.student.lastName}</td><td className="px-5 py-4 text-slate-600">{payment.registration.course.name}</td><td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">{formatAmount(payment.amount)}</td><td className="px-5 py-4 text-slate-600">{payment.method}</td><td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDate(payment.declaredAt)}</td><td className="px-5 py-4"><span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[payment.status]}`}>{statusLabels[payment.status]}</span></td>
          <td className="px-5 py-4">{payment.proofUrl ? <a href={payment.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-green hover:underline">Voir <ExternalLink className="h-3.5 w-3.5" /></a> : <span className="text-slate-400">—</span>}</td><td className="px-5 py-4">{payment.registration.invoice ? <button type="button" onClick={() => void downloadInvoice(payment.registration.invoice!.id, payment.registration.invoice!.invoiceNumber)} className="inline-flex items-center gap-1 font-semibold text-brand-green hover:underline">{payment.registration.invoice.invoiceNumber}</button> : <span className="text-slate-400">—</span>}</td><td className="px-5 py-4 font-mono text-xs text-slate-500">{payment.registration.id.slice(0, 12)}</td>
          <td className="px-5 py-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setViewingPayment(payment)} className="inline-flex items-center gap-1 rounded-lg p-2 text-sky-700 hover:bg-sky-50" aria-label="Voir le paiement"><Eye className="h-4 w-4" />Voir</button>{payment.status === 'DECLARED' && <><button type="button" disabled={processingId === payment.id} onClick={() => void review(payment, 'confirm')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 p-2 text-emerald-800 disabled:opacity-50" aria-label="Confirmer"><Check className="h-4 w-4" />Confirmer</button><button type="button" disabled={processingId === payment.id} onClick={() => void review(payment, 'reject')} className="inline-flex items-center gap-1 rounded-lg bg-rose-100 p-2 text-rose-800 disabled:opacity-50" aria-label="Rejeter"><X className="h-4 w-4" />Rejeter</button></>}<button type="button" disabled={processingId === payment.id} onClick={() => setArchiveCandidate(payment)} className="inline-flex items-center gap-1 rounded-lg bg-amber-50 p-2 text-amber-800 disabled:opacity-50" aria-label="Archiver le paiement"><Archive className="h-4 w-4" />Archiver</button></div></td>
        </tr>)}
      </tbody></table></div></section>
      {viewingPayment && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><section role="dialog" aria-modal="true" aria-labelledby="view-payment-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><h2 id="view-payment-title" className="text-xl font-bold text-slate-900">Détail du paiement</h2><button type="button" onClick={() => setViewingPayment(null)} aria-label="Fermer" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><dl className="mt-5 grid grid-cols-[130px_1fr] gap-3 text-sm"><dt className="text-slate-500">Étudiant</dt><dd className="font-medium">{viewingPayment.registration.student.firstName} {viewingPayment.registration.student.lastName}</dd><dt className="text-slate-500">Formation</dt><dd className="font-medium">{viewingPayment.registration.course.name}</dd><dt className="text-slate-500">Montant</dt><dd className="font-medium">{formatAmount(viewingPayment.amount)}</dd><dt className="text-slate-500">Méthode</dt><dd className="font-medium">{viewingPayment.method}</dd><dt className="text-slate-500">Date</dt><dd className="font-medium">{formatDate(viewingPayment.declaredAt)}</dd><dt className="text-slate-500">Statut</dt><dd className="font-medium">{statusLabels[viewingPayment.status]}</dd></dl></section></div>}
      {archiveCandidate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><section role="dialog" aria-modal="true" aria-labelledby="archive-payment-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="archive-payment-title" className="text-xl font-bold text-slate-900">Voulez-vous archiver ce paiement ?</h2><p className="mt-2 text-sm text-slate-600">Le paiement reste conservé pour la traçabilité et sera restaurable depuis la corbeille.</p></div><button type="button" disabled={processingId === archiveCandidate.id} onClick={() => setArchiveCandidate(null)} aria-label="Fermer" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><dl className="mt-5 grid grid-cols-[130px_1fr] gap-3 rounded-xl bg-slate-50 p-4 text-sm"><dt className="text-slate-500">Étudiant</dt><dd className="font-medium">{archiveCandidate.registration.student.firstName} {archiveCandidate.registration.student.lastName}</dd><dt className="text-slate-500">Formation</dt><dd className="font-medium">{archiveCandidate.registration.course.name}</dd><dt className="text-slate-500">Montant</dt><dd className="font-medium">{formatAmount(archiveCandidate.amount)}</dd><dt className="text-slate-500">Méthode</dt><dd className="font-medium">{archiveCandidate.method}</dd><dt className="text-slate-500">Date</dt><dd className="font-medium">{formatDate(archiveCandidate.declaredAt)}</dd><dt className="text-slate-500">Statut</dt><dd className="font-medium">{statusLabels[archiveCandidate.status]}</dd></dl><div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row"><button type="button" disabled={processingId === archiveCandidate.id} onClick={() => setArchiveCandidate(null)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Annuler</button><button type="button" disabled={processingId === archiveCandidate.id} onClick={() => void archivePayment()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Archive className="h-4 w-4" />{processingId === archiveCandidate.id ? 'Archivage...' : 'Archiver'}</button></div></section></div>}
    </div>
  )
}

export default AdminPaiementsPage
