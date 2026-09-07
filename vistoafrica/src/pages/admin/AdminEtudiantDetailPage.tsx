import { ArrowLeft, Download, FileText, Save } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { useAdminAuth } from '../../contexts/AdminAuthContext'

type Payment = { id: string; method: string; status: string; amount: string | number; reference: string | null; proofUrl: string | null; createdAt: string }
type Registration = { id: string; status: string; amount: string | number; createdAt: string; course: { name: string }; payments: Payment[]; invoice: { id: string; invoiceNumber: string; total: string | number; issuedAt: string } | null }
type Student = { id: string; firstName: string; lastName: string; email: string; phone: string | null; city: string | null; createdAt: string; registrations: Registration[] }

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
const statusLabels: Record<string, string> = { PENDING: 'En attente', PAYMENT_PENDING: 'Paiement attendu', PAYMENT_DECLARED: 'Paiement déclaré', PAYMENT_VERIFIED: 'Paiement vérifié', CONFIRMED: 'Confirmée', REJECTED: 'Rejetée', CANCELLED: 'Annulée', VERIFIED: 'Vérifié', DECLARED: 'Déclaré' }
const formatDate = (value: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
const formatAmount = (value: string | number) => `${Number(value).toLocaleString('fr-FR')} FCFA`

const AdminEtudiantDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { token } = useAdminAuth()
  const [student, setStudent] = useState<Student | null>(null)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', city: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const loadStudent = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/admin/students/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        const data = (await response.json()) as { data?: Student; message?: string }
        if (!response.ok || !data.data) throw new Error(data.message ?? 'Étudiant introuvable.')
        setStudent(data.data)
        setForm({ firstName: data.data.firstName, lastName: data.data.lastName, email: data.data.email, phone: data.data.phone ?? '', city: data.data.city ?? '' })
      } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Erreur de chargement.') } finally { setIsLoading(false) }
    }
    void loadStudent()
  }, [id, token])

  const saveStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setIsSaving(true); setMessage(''); setError('')
    try {
      const response = await fetch(`${apiUrl}/api/admin/students/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
      const data = (await response.json()) as { data?: Student; message?: string }
      if (!response.ok || !data.data) throw new Error(data.message ?? 'Impossible d’enregistrer les modifications.')
      setStudent((current) => current ? { ...current, ...data.data! } : data.data!)
      setMessage('Les informations ont été mises à jour.')
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Erreur de sauvegarde.') } finally { setIsSaving(false) }
  }

  const downloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    const response = await fetch(`${apiUrl}/api/admin/students/${id}/invoices/${invoiceId}/download`, { headers: { Authorization: `Bearer ${token}` } })
    if (!response.ok) { setError('Impossible de télécharger la facture.'); return }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${invoiceNumber}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <div className="p-8 text-slate-500">Chargement du dossier...</div>
  if (error && !student) return <div className="space-y-4"><Link to="/admin/etudiants" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-green"><ArrowLeft className="h-4 w-4" />Retour aux étudiants</Link><div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div></div>
  if (!student) return null

  return <div className="mx-auto max-w-7xl space-y-6"><Link to="/admin/etudiants" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-green hover:text-brand-greenDeep"><ArrowLeft className="h-4 w-4" />Retour aux étudiants</Link><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-green">Dossier étudiant</p><h1 className="mt-2 text-3xl font-bold text-slate-900">{student.firstName} {student.lastName}</h1><p className="mt-2 font-mono text-xs text-slate-500">ID : {student.id}</p></div>{message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}{error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"><form onSubmit={saveStudent} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Informations personnelles</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{(['firstName', 'lastName', 'email', 'phone', 'city'] as const).map((field) => <label key={field} className={field === 'email' ? 'sm:col-span-2' : ''}><span className="mb-1.5 block text-sm font-medium text-slate-600">{{ firstName: 'Prénom', lastName: 'Nom', email: 'Email', phone: 'Téléphone', city: 'Ville' }[field]}</span><input required={field === 'firstName' || field === 'lastName' || field === 'email'} type={field === 'email' ? 'email' : 'text'} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="input-field" /></label>)}</div><button disabled={isSaving} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-greenDeep disabled:opacity-50"><Save className="h-4 w-4" />{isSaving ? 'Enregistrement...' : 'Enregistrer'}</button></form>
      <div className="space-y-6"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Inscriptions</h2>{student.registrations.length === 0 ? <p className="mt-4 text-sm text-slate-500">Aucune inscription.</p> : <div className="mt-4 space-y-3">{student.registrations.map((registration) => <div key={registration.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-slate-900">{registration.course.name}</p><span className="rounded-full bg-brand-greenSoft px-3 py-1 text-xs font-semibold text-brand-green">{statusLabels[registration.status] ?? registration.status}</span></div><p className="mt-2 text-sm text-slate-500">{formatDate(registration.createdAt)} · {formatAmount(registration.amount)}</p></div>)}</div>}</section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Paiements et factures</h2>{student.registrations.flatMap((registration) => registration.payments.map((payment) => <div key={payment.id} className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4"><div><p className="font-semibold text-slate-900">{payment.method} · {formatAmount(payment.amount)}</p><p className="text-sm text-slate-500">{formatDate(payment.createdAt)} · {statusLabels[payment.status] ?? payment.status}{payment.reference ? ` · ${payment.reference}` : ''}</p></div>{payment.proofUrl && <a href={payment.proofUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-green"><Download className="h-4 w-4" />Preuve</a>}</div>))}{student.registrations.flatMap((registration) => registration.invoice ? [<div key={registration.invoice.invoiceNumber} className="mt-4 flex items-center justify-between gap-3"><div><p className="font-semibold text-slate-900"><FileText className="mr-2 inline h-4 w-4" />Facture {registration.invoice.invoiceNumber}</p><p className="text-sm text-slate-500">{formatDate(registration.invoice.issuedAt)} · {formatAmount(registration.invoice.total)}</p></div><button type="button" onClick={() => void downloadInvoice(registration.invoice!.id, registration.invoice!.invoiceNumber)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-green"><Download className="h-4 w-4" />Télécharger</button></div>] : [])}</section></div></div>
  </div>
}

export default AdminEtudiantDetailPage