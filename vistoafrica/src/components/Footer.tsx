import { Camera, Mail, MapPin, Phone } from 'lucide-react'

import logo from '../assets/logo.png'
import { useSiteSettings } from '../hooks/useSiteSettings'

const Footer = () => {
  const settings = useSiteSettings()
  return (
    <footer className="bg-brand-dark text-slate-200">
      <div className="section-shell grid gap-10 py-14 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img src={logo} alt="VISTOAFRIKA logo" className="h-12 w-auto object-contain" />
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-300">
            Plateforme premium de formation linguistique et de mobilité internationale.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">Navigation</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>Accueil</li>
            <li>Cours d’italien</li>
            <li>Cours d’anglais</li>
            <li>Visa</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand-green" /> {settings.contact_phone ?? '...'}</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand-green" /> {settings.contact_email ?? '...'}</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-green" /> {settings.contact_address ?? '...'}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">Réseaux</h3>
          <div className="mt-4 flex items-center gap-3 text-slate-300">
            <div className="rounded-full border border-slate-700 p-2"><Camera className="h-4 w-4 text-brand-green" /></div>
            <div className="rounded-full border border-slate-700 p-2"><Mail className="h-4 w-4 text-brand-green" /></div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="section-shell flex flex-col gap-2 py-5 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 VISTOAFRIKA</span>
          <span>Tous droits réservés</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
