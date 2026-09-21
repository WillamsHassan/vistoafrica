import { AlertTriangle, ArrowRight, Banknote, Clock3, WalletCards } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useSiteSettings } from '../hooks/useSiteSettings'
import { trackEvent } from '../services/analytics'

type PaymentStatus = 'PAYMENT_PENDING' | 'PAYMENT_DECLARED'

type RegistrationSummary = {
  registrationId: string
  accessToken: string
  total: string
  formation: string
  prenom: string
  nom: string
}

const PaymentPage = () => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PAYMENT_PENDING')
  const [summary, setSummary] = useState<RegistrationSummary | null>(null)
  const settings = useSiteSettings()
  const [method, setMethod] = useState<'MTN' | 'ORANGE'>('MTN')
  const [reference, setReference] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { trackEvent('PAYMENT_STARTED', '/inscription/paiement') }, [])

  useEffect(() => {
    const raw = sessionStorage.getItem('vistoafrica-registration-summary')
    if (!raw) {
      setSummary({
        registrationId: '',
        accessToken: '',
        total: '0 XAF',
        formation: 'Formation',
        prenom: 'Étudiant',
        nom: 'VISTOAFRIKA',
      })
      return
    }

    try {
      const parsed = JSON.parse(raw) as RegistrationSummary
      setSummary(parsed)
    } catch {
      setSummary({
        registrationId: '',
        accessToken: '',
        total: '0 XAF',
        formation: 'Formation',
        prenom: 'Étudiant',
        nom: 'VISTOAFRIKA',
      })
    }
  }, [])

  const steps = useMemo(
    () => [
      { key: 'PAYMENT_PENDING', label: 'Dépôt manuel', icon: Banknote },
      { key: 'PAYMENT_DECLARED', label: 'Paiement déclaré', icon: WalletCards },
      { key: 'ADMIN_VERIFICATION', label: 'Vérification admin', icon: Clock3 },
    ],
    [],
  )

  const activeIndex = paymentStatus === 'PAYMENT_PENDING' ? 0 : 1

  const declarePayment = async () => {
    if (!summary?.registrationId || !summary.accessToken) { setError('Votre inscription est introuvable.'); return }
    setIsSubmitting(true); setError('')
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/api/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ registrationId: summary.registrationId, accessToken: summary.accessToken, method, reference: reference.trim() || undefined }) })
      const result = (await response.json()) as { message?: string }
      if (!response.ok) throw new Error(result.message ?? 'Impossible de déclarer le paiement.')
      trackEvent('PAYMENT_DECLARED', '/inscription/paiement')
      setPaymentStatus('PAYMENT_DECLARED')
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Impossible de déclarer le paiement.') } finally { setIsSubmitting(false) }
  }

  return (
    <div className="section-shell py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-green">Paiement</p>
          <h1 className="mt-4 text-4xl font-bold text-brand-dark">Finalisez votre inscription</h1>
        </div>

        <div className="mb-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Statut du paiement</p>
              <div className="mt-3 flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                    paymentStatus === 'PAYMENT_PENDING'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {paymentStatus === 'PAYMENT_PENDING' ? 'PAYMENT_PENDING' : 'PAYMENT_DECLARED'}
                </span>
                <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                  {paymentStatus === 'PAYMENT_PENDING' ? <Clock3 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                  {paymentStatus === 'PAYMENT_PENDING'
                    ? 'En attente de déclaration'
                    : 'Paiement déclaré — vérification par l’administrateur'}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left lg:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Montant à payer</p>
              <p className="mt-2 text-2xl font-bold text-brand-dark">{summary?.total ?? '0 XAF'}</p>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === activeIndex
              const isComplete = index < activeIndex

              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-3 rounded-2xl border p-3 ${
                    isComplete
                      ? 'border-brand-green bg-brand-green/5'
                      : isActive
                        ? 'border-brand-green bg-emerald-50'
                        : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      isComplete ? 'bg-brand-green text-white' : isActive ? 'bg-brand-green text-white' : 'bg-white text-slate-500'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Étape {index + 1}</p>
                    <p className="mt-1 text-sm font-semibold text-brand-dark">{step.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm leading-7">
                  Effectuez votre dépôt manuellement avant de sélectionner l&apos;option correspondant à votre moyen de paiement.
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-green">MTN Mobile Money</p>
                      <h2 className="mt-2 text-xl font-bold text-brand-dark">Dépôt via MTN</h2>
                    </div>
                    <div className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-slate-900">MTN</div>
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-slate-700">
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Numéro temporaire</p>
                      <p className="mt-2 font-bold text-brand-dark">{settings.payment_mtn_number ?? '...'}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Titulaire</p>
                      <p className="mt-2 font-bold text-brand-dark">{settings.payment_mtn_holder ?? '...'}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-green">Orange Money</p>
                      <h2 className="mt-2 text-xl font-bold text-brand-dark">Dépôt via Orange</h2>
                    </div>
                    <div className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">Orange</div>
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-slate-700">
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Numéro temporaire</p>
                      <p className="mt-2 font-bold text-brand-dark">{settings.payment_orange_number ?? '...'}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Titulaire</p>
                      <p className="mt-2 font-bold text-brand-dark">{settings.payment_orange_holder ?? '...'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-brand-green/20 bg-brand-green/5 p-4 text-sm text-slate-700">
                <p className="leading-7">
                  Lorsque vous effectuez le paiement, le nom du titulaire affiché peut être différent du nom VISTOAFRIKA. C&apos;est normal : ces comptes sont utilisés officiellement par VISTOAFRIKA.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Résumé</p>
              <h2 className="mt-3 text-2xl font-bold text-brand-dark">{summary?.formation ?? 'Formation'}</h2>
              <p className="mt-2 text-sm text-slate-600">Étudiant : {summary?.prenom ?? 'Étudiant'} {summary?.nom ?? 'VISTOAFRIKA'}</p>

              <div className="mt-6 space-y-3 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-600">Montant total</span>
                  <span className="font-bold text-brand-dark">{summary?.total ?? '0 XAF'}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <label className="block text-sm font-semibold text-brand-dark">Moyen de paiement<select value={method} onChange={(event) => setMethod(event.target.value as 'MTN' | 'ORANGE')} className="input-field mt-2"><option value="MTN">MTN Mobile Money</option><option value="ORANGE">Orange Money</option></select></label>
                <label className="block text-sm font-semibold text-brand-dark">Référence du paiement <input value={reference} onChange={(event) => setReference(event.target.value)} className="input-field mt-2" placeholder="Référence indiquée sur le reçu" /></label>
                {error && <p className="text-sm text-red-700">{error}</p>}
                <button
                  type="button"
                  onClick={() => void declarePayment()}
                  disabled={isSubmitting || paymentStatus === 'PAYMENT_DECLARED'}
                  className="btn-primary w-full justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'DÉCLARATION...' : paymentStatus === 'PAYMENT_DECLARED' ? 'PAIEMENT DÉCLARÉ' : 'DÉCLARER MON PAIEMENT'}
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentStatus('PAYMENT_PENDING')}
                  className="btn-secondary w-full justify-center"
                >
                  PAYER PLUS TARD
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-brand-dark">Important</p>
                <p className="mt-2 leading-7">
                  Aucun paiement n&apos;est vérifié automatiquement. Le statut affiché indique seulement que le dépôt a été déclaré, puis il sera vérifié par l&apos;administrateur.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
