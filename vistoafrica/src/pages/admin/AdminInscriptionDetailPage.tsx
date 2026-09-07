import { ArrowLeft, Download, Save } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { useAdminAuth } from '../../contexts/AdminAuthContext'

type Payment = { id: string; method: string; status: string; amount: string | number; reference: string | null; createdAt: string }
type Registration = { id: string; status: string; amount: string | number; notes: string | null; createdAt: string; student: { firstName: string; lastName: string; email: string; phone: string | null; city: string | null }; course: { name: string }; payments: Payment[]; invoice: { invoiceNumber: string } | null }

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
const labels: Record<string, string> = { PENDING: 'En attente', PAYMENT_PENDING: 'Paiement en attente', PAYMENT_DECLARED: 'Paiement déclaré', PAYMENT_VERIFIED: 'Paiement vérifié', CONFIRMED: 'Confirmée', REJECTED: 'Rejetée', CANCELLED: 'Annulée' }
const formatDate = (value: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const formatAmount = (value: string | number) => `${Number(value).toLocaleString('fr-FR')} FCFA`

const AdminInscriptionDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { token } = useAdminAuth()
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadRegistration = async () => {
    const response = await fetch(`${apiUrl}/api/admin/registrations/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    const result = (await response.json()) as { data?: Registration; message?: string }
    if (!response.ok || !result.data) throw new Error(result.message ?? 'Inscription introuvable.')
    setRegistration(result.data); setAmount(String(Number(result.data.amount))); setNotes(result.data.notes ?? '')
  }

  useEffect(() => { void loadRegistration().catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Erreur de chargement.')).finally(() => setLoading(false)) }, [id, token])

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('')
    try {
      const response = await fetch(`${apiUrl}/api/admin/registrations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ amount: Number(amount), notes: notes || null }) })
      const result = (await response.json()) as { data?: Registration; message?: string }
      if (!response.ok || !result.data) throw new Error(result.message ?? 'Impossible de modifier cette inscription.')
      setRegistration(result.data); setMessage('Inscription mise à jour.')
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Erreur de sauvegarde.') } finally { setSaving(false) }
  }

  const changeStatus = async (action: 'confirm' | 'cancel') => {
    const text = action === 'confirm' ? 'Confirmer cette inscription ?' : 'Annuler cette inscription ? Cette action est sensible.'
    if (!window.confirm(text)) return
    setError(''); setMessage('')
    const response = await fetch(`${apiUrl}/api/admin/registrations/${id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action }) })
    const result = (await response.json()) as { data?: Registration; message?: string }
    if (!response.ok || !result.data) { setError(result.message ?? 'Transition de statut impossible.'); return }
    setRegistration(result.data); setMessage(action === 'confirm' ? 'Inscription confirmée.' : 'Inscription annulée.')
  }

  const downloadPdf = async () => {
    const response = await fetch(`${apiUrl}/api/admin/registrations/${id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
    if (!response.ok) { setError('Impossible de télécharger le PDF.'); return }
    const link = document.createElement('a'); link.href = URL.createObjectURL(await response.blob()); link.download = `inscription-${id}.pdf`; link.click()
  }

  if (loading) return <p className="text-slate-500">Chargement du dossier...</p>
  if (!registration) return <div className="space-y-4"><Link to="/admin/inscriptions" className="inline-flex items-center gap-2 text-brand-green"><ArrowLeft className="h-4 w-4" />Retour</Link><p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p></div>
  const canConfirm = registration.status === 'PAYMENT_VERIFIED'
  const canCancel = !['CONFIRMED', 'CANCELLED', 'REJECTED'].includes(registration.status)

  return <div className="mx-auto max-w-6xl space-y-6"><Link to="/admin/inscriptions" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-green"><ArrowLeft className="h-4 w-4" />Retour aux inscriptions</Link><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-green">Détail inscription</p><h1 className="mt-2 text-3xl font-bold text-slate-900">{registration.id}</h1><p className="mt-2 text-slate-500">Créée le {formatDate(registration.createdAt)}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void downloadPdf()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"><Download className="h-4 w-4" />PDF</button>{canConfirm && <button type="button" onClick={() => void changeStatus('confirm')} className="rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white">Confirmer</button>}{canCancel && <button type="button" onClick={() => void changeStatus('cancel')} className="rounded-xl bg-brand-red px-4 py-3 text-sm font-semibold text-white">Annuler</button>}</div></div>{message && <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{message}</p>}{error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <div className="grid gap-6 lg:grid-cols-2"><form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Informations modifiables</h2><label className="mt-5 block"><span className="mb-1 block text-sm font-medium text-slate-600">Montant</span><input type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} className="input-field" /></label><label className="mt-4 block"><span className="mb-1 block text-sm font-medium text-slate-600">Notes</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} className="input-field" /></label><button disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Enregistrement...' : 'Modifier'}</button></form>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Résumé</h2><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-slate-500">Statut</dt><dd className="mt-1 font-semibold text-brand-green">{labels[registration.status] ?? registration.status}</dd></div><div><dt className="text-slate-500">Étudiant</dt><dd className="mt-1 font-semibold text-slate-900">{registration.student.firstName} {registration.student.lastName}<br /><span className="font-normal text-slate-500">{registration.student.email} · {registration.student.phone ?? 'Téléphone non renseigné'}</span></dd></div><div><dt className="text-slate-500">Formation</dt><dd className="mt-1 font-semibold text-slate-900">{registration.course.name}</dd></div><div><dt className="text-slate-500">Montant</dt><dd className="mt-1 font-semibold text-slate-900">{formatAmount(registration.amount)}</dd></div></dl></section></div>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Paiements</h2>{registration.payments.length === 0 ? <p className="mt-4 text-sm text-slate-500">Aucun paiement enregistré.</p> : <div className="mt-4 divide-y divide-slate-100">{registration.payments.map((payment) => <div key={payment.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm"><span className="font-semibold">{payment.method} · {formatAmount(payment.amount)}</span><span className="text-slate-500">{labels[payment.status] ?? payment.status} · {formatDate(payment.createdAt)}</span></div>)}</div>}</section>
  </div>
}

export default AdminInscriptionDetailPage