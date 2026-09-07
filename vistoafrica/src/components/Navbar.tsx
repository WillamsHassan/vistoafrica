import { Menu, PlaneTakeoff } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import logo from '../assets/logo.png'

const navItems = [
  { to: '/', label: 'Accueil' },
  { to: '/cours-italien', label: 'Cours d’italien' },
  { to: '/cours-anglais', label: 'Cours d’anglais' },
  { to: '/visa', label: 'Visa' },
  { to: '/a-propos', label: 'À propos' },
  { to: '/contact', label: 'Contact' },
]

const Navbar = () => {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="section-shell flex items-center justify-between py-4">
        <NavLink to="/" className="flex items-center gap-3">
          <img src={logo} alt="VISTOAFRIKA logo" className="h-12 w-auto object-contain" />
        </NavLink>

        <nav className="hidden items-center gap-7 lg:flex">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `text-sm font-medium ${
                  isActive ? 'text-brand-green' : 'text-slate-700 hover:text-brand-green'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <NavLink to="/inscription" className="btn-primary hidden sm:inline-flex">
            S’inscrire
          </NavLink>
          <button className="inline-flex rounded-full border border-slate-200 bg-white p-2.5 text-slate-700 lg:hidden" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden rounded-full bg-brand-red/5 p-2 text-brand-red lg:flex">
            <PlaneTakeoff className="h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
