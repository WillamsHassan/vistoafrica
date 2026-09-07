import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, CheckCircle2, Clock3, CreditCard, FileText, GraduationCap, Info, X } from 'lucide-react'

import type { Course } from '../types/course'

type PaymentTermsModalProps = {
  course: Course
  open: boolean
  onClose: () => void
}

const PaymentTermsModal = ({ course, open, onClose }: PaymentTermsModalProps) => {
  const terms = course.paymentTerms

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-3 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-brand-green/10 to-brand-red/5 p-4 sm:p-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-green">Modalités de paiement</p>
                <h3 className="mt-2 text-2xl font-bold text-brand-dark">{course.name}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-brand-green hover:text-brand-green"
                aria-label="Fermer la modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-4 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3 text-brand-green">
                    <GraduationCap className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em]">Scolarité</span>
                  </div>
                  <p className="mt-3 text-xl font-bold text-brand-dark">{terms?.tuition ?? course.price}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3 text-brand-red">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em]">Frais d’inscription</span>
                  </div>
                  <p className="mt-3 text-xl font-bold text-brand-dark">{terms?.registrationFee ?? course.registrationFee}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3 text-brand-green">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em]">Durée</span>
                  </div>
                  <p className="mt-3 text-base font-semibold text-brand-dark">{terms?.duration ?? course.duration}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3 text-brand-green">
                    <Clock3 className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em]">Fréquence</span>
                  </div>
                  <p className="mt-3 text-base font-semibold text-brand-dark">{terms?.frequency ?? course.frequency}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3 text-brand-red">
                    <Clock3 className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em]">Séance</span>
                  </div>
                  <p className="mt-3 text-base font-semibold text-brand-dark">{terms?.sessionLength ?? course.sessionLength}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3 text-brand-red">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em]">Coût horaire</span>
                  </div>
                  <p className="mt-3 text-base font-semibold text-brand-dark">{terms?.hourlyRate ?? course.hourlyRate ?? 'Non précisé'}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Examen</p>
                  <p className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <CheckCircle2 className={`h-4 w-4 ${terms?.examIncluded ? 'text-brand-green' : 'text-brand-red'}`} />
                    {terms?.examIncluded ? 'Inclus' : 'Non inclus'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Manuel</p>
                  <p className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <CheckCircle2 className={`h-4 w-4 ${terms?.manualIncluded ? 'text-brand-green' : 'text-brand-red'}`} />
                    {terms?.manualIncluded ? 'Inclus' : 'Non inclus'}
                  </p>
                </div>
              </div>

              {terms?.additionalFees && terms.additionalFees.length > 0 && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3 text-brand-green">
                    <Info className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Frais supplémentaires</p>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {terms.additionalFees.map((fee) => (
                      <li key={fee} className="flex items-start gap-2">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-brand-green" />
                        <span>{fee}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {terms?.installments && terms.installments.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Différentes tranches</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {terms.installments.map((amount, index) => (
                      <div key={`${amount}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Tranche {index + 1}</p>
                        <p className="mt-2 text-lg font-bold text-brand-dark">{amount}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {terms?.deadlines && terms.deadlines.length > 0 && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Échéances</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {terms.deadlines.map((deadline) => (
                      <li key={deadline} className="flex items-start gap-2">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-brand-red" />
                        <span>{deadline}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {terms?.conditions && terms.conditions.length > 0 && (
                <div className="mt-6 rounded-2xl bg-brand-green/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-green">Conditions de paiement</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {terms.conditions.map((condition) => (
                      <li key={condition} className="flex items-start gap-2">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-brand-green" />
                        <span>{condition}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PaymentTermsModal
