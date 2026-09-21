import { useState } from 'react'

import { getAnalyticsConsent, setAnalyticsConsent } from '../services/analytics'

type CookieConsentProps = { onChange: (accepted: boolean) => void }

const CookieConsent = ({ onChange }: CookieConsentProps) => {
  const [visible, setVisible] = useState(!localStorage.getItem('vistoafrica-analytics-consent'))

  if (!visible || getAnalyticsConsent()) return null

  const choose = (accepted: boolean) => {
    setAnalyticsConsent(accepted)
    setVisible(false)
    onChange(accepted)
  }

  return <aside className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl" aria-label="Consentement analytics">
    <p className="text-sm font-semibold text-slate-900">Respect de votre confidentialité</p>
    <p className="mt-2 text-sm leading-6 text-slate-600">Nous pouvons mesurer les visites de manière anonyme pour améliorer VISTOAFRIKA. Aucun nom, email, téléphone, mot de passe ou donnée bancaire n’est utilisé pour ces statistiques.</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" onClick={() => choose(true)} className="rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white">Accepter les statistiques</button>
      <button type="button" onClick={() => choose(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Refuser</button>
    </div>
  </aside>
}

export default CookieConsent
