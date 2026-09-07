import { Download, FileText, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type RegistrationSummary = {
  tempNumber: string
  nom: string
  prenom: string
  telephone: string
  email: string
  ville: string
  formation: string
  typeFormation: string
  duree: string
  frequence: string
  prix: string
  fraisInscription: string
  total: string
}

const RegistrationSummaryPage = () => {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<RegistrationSummary | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('vistoafrica-registration-summary')
    if (!raw) {
      navigate('/inscription')
      return
    }

    try {
      setSummary(JSON.parse(raw) as RegistrationSummary)
    } catch {
      navigate('/inscription')
    }
  }, [navigate])

  if (!summary) {
    return null
  }

  return (
    <div className="section-shell py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-green">Récapitulatif</p>
          <h1 className="mt-4 text-4xl font-bold text-brand-dark">RÉCAPITULATIF DE VOTRE INSCRIPTION</h1>
        </div>

        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-soft">
          <div className="flex flex-col gap-4 border-b border-slate-200 bg-gradient-to-r from-brand-green/10 via-white to-brand-red/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-green">VISTOAFRIKA</p>
              <h2 className="mt-2 text-2xl font-bold text-brand-dark">Dossier d’inscription</h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">N° temporaire</p>
              <p className="mt-1 text-base font-bold text-brand-dark">{summary.tempNumber}</p>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Informations</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Nom</p>
                    <p className="mt-2 font-semibold text-brand-dark">{summary.nom}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Prénom</p>
                    <p className="mt-2 font-semibold text-brand-dark">{summary.prenom}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Téléphone</p>
                    <p className="mt-2 font-semibold text-brand-dark">{summary.telephone}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Ville</p>
                    <p className="mt-2 font-semibold text-brand-dark">{summary.ville}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email</p>
                  <p className="mt-2 font-semibold text-brand-dark">{summary.email}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Formation</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Formation</p>
                    <p className="mt-2 font-semibold text-brand-dark">{summary.formation}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Type</p>
                    <p className="mt-2 font-semibold text-brand-dark">{summary.typeFormation}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Durée</p>
                    <p className="mt-2 font-semibold text-brand-dark">{summary.duree}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Fréquence</p>
                    <p className="mt-2 font-semibold text-brand-dark">{summary.frequence}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3 text-brand-green">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-xs font-semibold uppercase tracking-[0.2em]">Montant</p>
              </div>

              <div className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <span>Prix</span>
                  <span className="font-semibold text-brand-dark">{summary.prix}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Frais d’inscription</span>
                  <span className="font-semibold text-brand-dark">{summary.fraisInscription}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                  <span className="text-base font-semibold text-brand-dark">Total</span>
                  <span className="text-base font-bold text-brand-dark">{summary.total}</span>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-dashed border-brand-green/40 bg-white p-4 text-sm text-slate-600">
                <div className="flex items-center gap-2 text-brand-green">
                  <FileText className="h-4 w-4" />
                  <span className="font-semibold">PDF préparé</span>
                </div>
                <p className="mt-2 leading-7">
                  Le PDF définitif sera généré côté backend avec Puppeteer. Cette interface est prête pour l’export final.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:justify-end sm:p-7">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-green hover:text-brand-green"
            >
              <Download className="h-4 w-4" />
              TÉLÉCHARGER MON RÉCAPITULATIF PDF
            </button>

            <button
              type="button"
              onClick={() => navigate('/inscription/paiement')}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-greenDeep"
            >
              PROCÉDER AU PAIEMENT
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistrationSummaryPage
