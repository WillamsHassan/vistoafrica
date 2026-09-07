import { Check, ExternalLink, X } from 'lucide-react'
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
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1250px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Étudiant</th><th className="px-5 py-4">Formation</th><th className="px-5 py-4">Montant</th><th className="px-5 py-4">Moyen</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Statut</th><th className="px-5 py-4">Reçu</th><th className="px-5 py-4">Facture</th><th className="px-5 py-4">N° inscription</th><th className="px-5 py-4">Décision</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={10} className="px-5 py-12 text-center text-slate-500">Chargement des paiements...</td></tr> : payments.length === 0 ? <tr><td colSpan={10} className="px-5 py-12 text-center text-slate-500">Aucun paiement enregistré.</td></tr> : payments.map((payment) => <tr key={payment.id} className="hover:bg-slate-50"><td className="px-5 py-4 font-semibold text-slate-900">{payment.registration.student.firstName} {payment.registration.student.lastName}</td><td className="px-5 py-4 text-slate-600">{payment.registration.course.name}</td><td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">{formatAmount(payment.amount)}</td><td className="px-5 py-4 text-slate-600">{payment.method}</td><td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDate(payment.declaredAt)}</td><td className="px-5 py-4"><span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[payment.status]}`}>{statusLabels[payment.status]}</span></td><td className="px-5 py-4">{payment.proofUrl ? <a href={payment.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-green hover:underline">Voir <ExternalLink className="h-3.5 w-3.5" /></a> : <span className="text-slate-400">Absent</span>}</td><td className="px-5 py-4">{payment.registration.invoice ? <button type="button" onClick={() => void downloadInvoice(payment.registration.invoice!.id, payment.registration.invoice!.invoiceNumber)} className="font-semibold text-brand-green hover:underline">Télécharger</button> : <span className="text-slate-400">Non émise</span>}</td><td className="px-5 py-4 font-mono text-xs text-slate-500">{payment.registration.id.slice(0, 10)}</td><td className="px-5 py-4"><div className="flex gap-2">{payment.status === 'DECLARED' ? <><button type="button" disabled={processingId === payment.id} onClick={() => void review(payment, 'confirm')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><Check className="h-3.5 w-3.5" />Confirmer</button><button type="button" disabled={processingId === payment.id} onClick={() => void review(payment, 'reject')} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"><X className="h-3.5 w-3.5" />Rejeter</button></> : <span className="text-xs text-slate-400">Traitée</span>}</div></td></tr>)}</tbody></table></div></section>
    </div>
  )
}

export default AdminPaiementsPage
