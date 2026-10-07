import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, CreditCard, GraduationCap, LoaderCircle, MessageSquareText, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAdminAuth } from '../../contexts/AdminAuthContext'

type DashboardData = {
  metrics: { totalStudents: number; newRegistrations: number; pendingPayments: number; paymentsToVerify: number; confirmedPayments: number; confirmedRegistrations: number; revenue: number; unreadMessages: number }
  statistics: { label: string; registrations: number; revenue: number }[]
  recentRegistrations: { id: string; createdAt: string; status: string; student: { firstName: string; lastName: string }; course: { name: string } }[]
  recentPayments: { id: string; createdAt: string; status: string; amount: string | number; registration: { student: { firstName: string; lastName: string } } }[]
  paymentAlerts: { id: string; declaredAt: string; amount: string | number; registration: { student: { firstName: string; lastName: string } } }[]
}

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
const formatDate = (date: string) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(date))
const formatAmount = (amount: number | string) => `${new Intl.NumberFormat('fr-FR').format(Number(amount))} FCFA`
const metricCards = [
  ['totalStudents', 'Total étudiants', Users, 'bg-emerald-50 text-emerald-700'],
  ['newRegistrations', 'Nouvelles inscriptions', UserPlus, 'bg-sky-50 text-sky-700'],
  ['pendingPayments', 'Paiements en attente', Clock3, 'bg-amber-50 text-amber-700'],
  ['paymentsToVerify', 'Paiements à vérifier', AlertTriangle, 'bg-rose-50 text-rose-700'],
  ['confirmedPayments', 'Paiements confirmés', CheckCircle2, 'bg-teal-50 text-teal-700'],
  ['confirmedRegistrations', 'Inscriptions confirmées', GraduationCap, 'bg-indigo-50 text-indigo-700'],
  ['revenue', 'Revenus vérifiés', CreditCard, 'bg-lime-50 text-lime-700'],
  ['unreadMessages', 'Messages non lus', MessageSquareText, 'bg-rose-50 text-rose-700'],
] as const

const AdminDashboardPage = () => {
  const { token } = useAdminAuth()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [analytics, setAnalytics] = useState<{ visitorsToday: number; registrations: number; registrationStarts: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
        const payload = (await response.json()) as { success?: boolean; message?: string; data?: DashboardData }
        if (!response.ok || !payload.success || !payload.data) throw new Error(payload.message ?? 'Impossible de charger le dashboard.')
        setDashboard(payload.data)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Impossible de charger le dashboard.')
      }
    }
    void loadDashboard()
  }, [token])

  useEffect(() => {
    const loadAnalytics = async () => {
      const response = await fetch(`${apiUrl}/api/admin/analytics/overview`, { headers: { Authorization: `Bearer ${token}` } })
      const payload = (await response.json()) as { data?: { visitorsToday: number; registrations: number; registrationStarts: number }; }
      if (response.ok && payload.data) setAnalytics(payload.data)
    }
    void loadAnalytics()
  }, [token])

  if (error) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800"><h1 className="text-lg font-semibold">Dashboard indisponible</h1><p className="mt-2 text-sm text-rose-700">{error}</p></div>
  if (!dashboard) return <div className="flex min-h-64 items-center justify-center"><LoaderCircle className="h-8 w-8 animate-spin text-brand-green" aria-label="Chargement" /></div>
  const maxRevenue = Math.max(...dashboard.statistics.map((item) => item.revenue), 1)

  return <div className="mx-auto max-w-7xl space-y-6">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-green">Vue d’ensemble</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Bonjour, équipe VISTOAFRIKA</h1><p className="mt-2 text-slate-600">Suivez l’activité de votre plateforme en un coup d’œil.</p></div><Link to="/admin/paiements" className="inline-flex items-center gap-2 self-start rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white shadow-glow hover:bg-brand-greenDeep">Vérifier les paiements <ArrowUpRight className="h-4 w-4" /></Link></div>
    {analytics && <section className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-sky-100 bg-sky-50 p-5"><p className="text-sm text-sky-700">Visiteurs aujourd’hui</p><p className="mt-2 text-2xl font-bold text-sky-950">{analytics.visitorsToday.toLocaleString('fr-FR')}</p></div><div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><p className="text-sm text-emerald-700">Nouvelles inscriptions</p><p className="mt-2 text-2xl font-bold text-emerald-950">{analytics.registrations.toLocaleString('fr-FR')}</p></div><div className="rounded-2xl border border-amber-100 bg-amber-50 p-5"><p className="text-sm text-amber-700">Visiteurs ayant commencé une inscription</p><p className="mt-2 text-2xl font-bold text-amber-950">{analytics.registrationStarts.toLocaleString('fr-FR')}</p></div></section>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metricCards.map(([key, label, Icon, color]) => { const card = <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-2xl font-bold text-slate-900">{key === 'revenue' ? formatAmount(dashboard.metrics[key]) : dashboard.metrics[key].toLocaleString('fr-FR')}</p></div><div className={`rounded-xl p-3 ${color}`}><Icon className="h-5 w-5" /></div></div></div>; return key === 'unreadMessages' ? <Link key={key} to="/admin/messages" aria-label="Ouvrir les messages non lus">{card}</Link> : <div key={key}>{card}</div> })}</section>
    <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-slate-900">Activité des six derniers mois</h2><p className="mt-1 text-sm text-slate-500">Revenus vérifiés par mois</p></div><CreditCard className="h-5 w-5 text-brand-green" /></div><div className="mt-8 flex h-52 items-end gap-3 border-b border-slate-100 sm:gap-5">{dashboard.statistics.map((item) => <div key={item.label} className="flex h-full flex-1 flex-col justify-end gap-2"><div className="flex h-full items-end"><div className="w-full rounded-t-lg bg-brand-green" style={{ height: `${Math.max((item.revenue / maxRevenue) * 100, item.revenue ? 8 : 2)}%` }} title={formatAmount(item.revenue)} /></div><p className="text-center text-xs capitalize text-slate-500">{item.label}</p></div>)}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-slate-900">Paiements à vérifier</h2><p className="mt-1 text-sm text-slate-500">Déclarations en attente de contrôle</p></div><AlertTriangle className="h-5 w-5 text-rose-500" /></div><div className="mt-5 space-y-3">{dashboard.paymentAlerts.length === 0 ? <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">Aucun paiement à vérifier.</p> : dashboard.paymentAlerts.map((payment) => <div key={payment.id} className="flex items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50/60 p-3"><div><p className="text-sm font-semibold text-slate-900">{payment.registration.student.firstName} {payment.registration.student.lastName}</p><p className="mt-1 text-xs text-slate-500">Déclaré le {formatDate(payment.declaredAt)}</p></div><span className="whitespace-nowrap text-sm font-bold text-rose-700">{formatAmount(payment.amount)}</span></div>)}<Link to="/admin/paiements" className="block pt-1 text-sm font-semibold text-brand-green">Voir tous les paiements</Link></div></div></section>
    <section className="grid gap-6 xl:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-slate-900">Dernières inscriptions</h2><div className="mt-4 divide-y divide-slate-100">{dashboard.recentRegistrations.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold text-slate-900">{item.student.firstName} {item.student.lastName}</p><p className="mt-1 text-xs text-slate-500">{item.course.name} · {formatDate(item.createdAt)}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{item.status}</span></div>)}{dashboard.recentRegistrations.length === 0 && <p className="py-4 text-sm text-slate-500">Aucune inscription récente.</p>}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-slate-900">Derniers paiements</h2><div className="mt-4 divide-y divide-slate-100">{dashboard.recentPayments.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold text-slate-900">{item.registration.student.firstName} {item.registration.student.lastName}</p><p className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)} · <span className="uppercase">{item.status}</span></p></div><span className="text-sm font-bold text-slate-900">{formatAmount(item.amount)}</span></div>)}{dashboard.recentPayments.length === 0 && <p className="py-4 text-sm text-slate-500">Aucun paiement récent.</p>}</div></div></section>
  </div>
}

export default AdminDashboardPage
