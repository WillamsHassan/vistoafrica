import { Download, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useAdminAuth } from '../../contexts/AdminAuthContext'

type Invoice = {
  id: string
  invoiceNumber: string
  total: string | number
  issuedAt: string
  generatedAt: string | null
  registration: { student: { firstName: string; lastName: string; email: string }; course: { name: string } }
}

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
const formatDate = (value: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
const formatAmount = (value: string | number) => `${Number(value).toLocaleString('fr-FR')} FCFA`

const AdminFacturesPage = () => {
  const { token } = useAdminAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/admin/invoices`, { headers: { Authorization: `Bearer ${token}` } })
        const result = (await response.json()) as { data?: Invoice[]; message?: string }
        if (!response.ok || !result.data) throw new Error(result.message ?? 'Impossible de charger les factures.')
        setInvoices(result.data)
      } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Erreur de chargement.') }
    }
    void loadInvoices()
  }, [token])

  const downloadInvoice = async (invoice: Invoice) => {
    const response = await fetch(`${apiUrl}/api/invoices/${invoice.id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
    if (!response.ok) { setError('Le fichier PDF de cette facture est indisponible.'); return }
    const url = URL.createObjectURL(await response.blob())
    const link = document.createElement('a')
    link.href = url
    link.download = `${invoice.invoiceNumber}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div><h1 className="text-3xl font-bold text-slate-900">Factures</h1><p className="mt-3 text-slate-600">Factures émises et fichiers PDF disponibles au téléchargement.</p></div>
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Facture</th><th className="px-5 py-4">Étudiant</th><th className="px-5 py-4">Formation</th><th className="px-5 py-4">Montant</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{invoices.length === 0 ? <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">Aucune facture enregistrée.</td></tr> : invoices.map((invoice) => <tr key={invoice.id} className="hover:bg-slate-50"><td className="px-5 py-4 font-semibold text-slate-900"><FileText className="mr-2 inline h-4 w-4 text-brand-green" />{invoice.invoiceNumber}</td><td className="px-5 py-4"><p className="font-semibold text-slate-900">{invoice.registration.student.firstName} {invoice.registration.student.lastName}</p><p className="text-xs text-slate-500">{invoice.registration.student.email}</p></td><td className="px-5 py-4 text-slate-600">{invoice.registration.course.name}</td><td className="px-5 py-4 font-semibold text-slate-900">{formatAmount(invoice.total)}</td><td className="px-5 py-4 text-slate-600">{formatDate(invoice.issuedAt)}</td><td className="px-5 py-4"><button type="button" onClick={() => void downloadInvoice(invoice)} className="inline-flex items-center gap-2 font-semibold text-brand-green hover:text-brand-greenDeep"><Download className="h-4 w-4" />Télécharger</button></td></tr>)}</tbody></table></div>
      </section>
    </div>
  )
}

export default AdminFacturesPage
