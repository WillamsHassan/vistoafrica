import { motion } from 'framer-motion'
import { Bell, BriefcaseBusiness, FileText, GraduationCap, LayoutDashboard, Menu, MessageSquareText, Settings, Users, X, LogOut } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { useAdminAuth } from '../contexts/AdminAuthContext'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/etudiants', label: 'Étudiants', icon: Users },
  { to: '/admin/inscriptions', label: 'Inscriptions', icon: GraduationCap },
  { to: '/admin/paiements', label: 'Paiements', icon: FileText },
  { to: '/admin/formations', label: 'Formations', icon: BriefcaseBusiness },
  { to: '/admin/factures', label: 'Factures', icon: FileText },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquareText },
  { to: '/admin/parametres', label: 'Paramètres', icon: Settings },
]

const AdminLayout = () => {
  const { logout, user } = useAdminAuth()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const navigation = (
    <>
      <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">VISTOAFRIKA</p>
          <h1 className="mt-2 text-xl font-semibold text-white">Administration</h1>
        </div>
        <button type="button" onClick={() => setIsSidebarOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden" aria-label="Fermer le menu">
          <X className="h-5 w-5" />
        </button>
        <Bell className="hidden h-5 w-5 text-emerald-300 lg:block" />
      </div>
      <nav className="space-y-2 p-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/admin'} onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-950/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
        <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-red-950/60 hover:text-red-200">
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </nav>
    </>
  )

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 bg-slate-950 text-slate-100 lg:block">{navigation}</aside>
        {isSidebarOpen && <button type="button" onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-30 bg-slate-950/60 lg:hidden" aria-label="Fermer le menu" />}
        <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-950 text-slate-100 shadow-2xl transition-transform duration-200 lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>{navigation}</aside>

        <div className="flex-1">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setIsSidebarOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Ouvrir le menu">
                <Menu className="h-5 w-5" />
              </button>
              <div>
              <p className="text-sm text-slate-500">Espace d’administration</p>
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Gestion VISTOAFRIKA</h2>
              {user && <p className="mt-1 hidden text-xs text-slate-500 sm:block">Connecté : {user.fullName}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 sm:block"
            >
              Déconnexion
            </button>
          </header>

          <motion.main
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            <Outlet />
          </motion.main>
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
