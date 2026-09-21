import { CheckCircle2, ChevronLeft, ChevronRight, CreditCard, Mail, MapPin, Phone, User } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import FormField from '../components/FormField'
import { useCourses } from '../hooks/useCourses'
import type { Course } from '../types/course'
import { trackEvent } from '../services/analytics'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

type FormValues = {
  nom: string
  prenom: string
  telephone: string
  ville: string
  email: string
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const steps = ['Informations personnelles', 'Récapitulatif', 'Paiement']

const initialValues: FormValues = {
  nom: '',
  prenom: '',
  telephone: '',
  ville: '',
  email: '',
}

const phoneRegex = /^(\+?[0-9\s\-()]{8,20})$/

const RegistrationPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const { courses, loading: coursesLoading, error: coursesError } = useCourses()
  const selectedCourse = useMemo(() => courses.find((course) => course.id === params.get('courseId')), [courses, location.search]) as Course | undefined

  const [currentStep, setCurrentStep] = useState(1)
  const [formValues, setFormValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => { trackEvent('REGISTRATION_STARTED', '/inscription') }, [])

  const validateField = (name: keyof FormValues, value: string) => {
    switch (name) {
      case 'nom':
        if (!value.trim()) return 'Le nom est requis.'
        if (value.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères.'
        if (value.trim().length > 50) return 'Le nom ne peut pas dépasser 50 caractères.'
        return ''
      case 'prenom':
        if (!value.trim()) return 'Le prénom est requis.'
        if (value.trim().length < 2) return 'Le prénom doit contenir au moins 2 caractères.'
        if (value.trim().length > 50) return 'Le prénom ne peut pas dépasser 50 caractères.'
        return ''
      case 'telephone':
        if (!value.trim()) return 'Le téléphone est requis.'
        if (!phoneRegex.test(value.trim())) return 'Le téléphone n’est pas valide.'
        if (value.trim().length < 8 || value.trim().length > 20) return 'Le téléphone doit avoir entre 8 et 20 caractères.'
        return ''
      case 'ville':
        if (!value.trim()) return 'La ville est requise.'
        if (value.trim().length < 2) return 'La ville doit contenir au moins 2 caractères.'
        if (value.trim().length > 100) return 'La ville ne peut pas dépasser 100 caractères.'
        return ''
      case 'email':
        if (!value.trim()) return 'L’email est requis.'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'L’email n’est pas valide.'
        if (value.trim().length > 255) return 'L’email est trop long.'
        return ''
      default:
        return ''
    }
  }

  const validateStepOne = () => {
    const nextErrors: FormErrors = {}

    ;(Object.keys(initialValues) as Array<keyof FormValues>).forEach((key) => {
      const error = validateField(key, formValues[key])
      if (error) nextErrors[key] = error
    })

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleChange = (field: keyof FormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))

    if (errors[field]) {
      const error = validateField(field, value)
      setErrors((prev) => ({ ...prev, [field]: error }))
    }
  }

  const nextStep = () => {
    if (currentStep === 1 && !validateStepOne()) {
      return
    }

    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateStepOne()) {
      return
    }
    if (!selectedCourse) {
      setSubmitError('Formation introuvable.')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    try {
      const response = await fetch(`${apiUrl}/api/registrations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName: formValues.prenom.trim(), lastName: formValues.nom.trim(), email: formValues.email.trim(), phone: formValues.telephone.trim(), city: formValues.ville.trim(), courseId: selectedCourse.id }) })
      const result = (await response.json()) as { data?: { id: string; accessToken: string; amount: string | number }; message?: string }
      if (!response.ok || !result.data) throw new Error(result.message ?? 'Impossible d’enregistrer votre inscription.')

    const priceValue = Number(selectedCourse.price.replace(/[^\d]/g, ''))
    const feeValue = Number(selectedCourse.registrationFee.replace(/[^\d]/g, ''))

    const summary = {
      tempNumber: `VAF-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      nom: formValues.nom.trim(),
      prenom: formValues.prenom.trim(),
      telephone: formValues.telephone.trim(),
      ville: formValues.ville.trim(),
      email: formValues.email.trim(),
      formation: selectedCourse.name,
      typeFormation: selectedCourse.type,
      duree: selectedCourse.duration,
      frequence: selectedCourse.frequency,
      prix: selectedCourse.price,
      fraisInscription: selectedCourse.registrationFee,
      total: `${(priceValue + feeValue).toLocaleString('fr-FR')} XAF`,
    }

      sessionStorage.setItem('vistoafrica-registration-summary', JSON.stringify({ ...summary, registrationId: result.data.id, accessToken: result.data.accessToken, total: `${Number(result.data.amount).toLocaleString('fr-FR')} XAF` }))
      trackEvent('REGISTRATION_COMPLETED', '/inscription')
      navigate('/inscription/recapitulatif')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Impossible d’enregistrer votre inscription.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100

  if (coursesLoading || !selectedCourse) {
    return <div className="section-shell py-16 text-center text-slate-600">{coursesError || 'Chargement de la formation...'}</div>
  }

  return (
    <div className="section-shell py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-green">Inscription</p>
          <h1 className="mt-4 text-4xl font-bold text-brand-dark">Créer votre dossier</h1>
        </div>

        <div className="mb-8 rounded-[28px] border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
          <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <span>Étape {currentStep}</span>
            <span>{steps[currentStep - 1]}</span>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-green to-brand-greenDeep transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            {steps.map((step, index) => (
              <span
                key={step}
                className={index + 1 === currentStep ? 'font-semibold text-brand-green' : ''}
              >
                {step}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-brand-dark">Informations personnelles</h2>
                  <p className="mt-2 text-sm text-slate-600">Renseignez les informations qui seront utilisées pour votre dossier.</p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    id="nom"
                    label="Nom"
                    placeholder="Entrez votre nom"
                    value={formValues.nom}
                    onChange={(event) => handleChange('nom', event.target.value)}
                    error={errors.nom}
                    icon={<User className="h-4 w-4" />}
                  />

                  <FormField
                    id="prenom"
                    label="Prénom"
                    placeholder="Entrez votre prénom"
                    value={formValues.prenom}
                    onChange={(event) => handleChange('prenom', event.target.value)}
                    error={errors.prenom}
                    icon={<User className="h-4 w-4" />}
                  />

                  <FormField
                    id="telephone"
                    label="Téléphone"
                    placeholder="Ex: +237 6XX XXX XXX"
                    value={formValues.telephone}
                    onChange={(event) => handleChange('telephone', event.target.value)}
                    error={errors.telephone}
                    icon={<Phone className="h-4 w-4" />}
                  />

                  <FormField
                    id="ville"
                    label="Ville"
                    placeholder="Entrez votre ville"
                    value={formValues.ville}
                    onChange={(event) => handleChange('ville', event.target.value)}
                    error={errors.ville}
                    icon={<MapPin className="h-4 w-4" />}
                  />
                </div>

                <FormField
                  id="email"
                  label="Email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formValues.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  error={errors.email}
                  icon={<Mail className="h-4 w-4" />}
                />

                <div className="flex justify-end">
                  <button type="button" onClick={nextStep} className="btn-primary gap-2">
                    Continuer <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-brand-dark">Récapitulatif</h2>
                  <p className="mt-2 text-sm text-slate-600">Vérifiez votre sélection avant de passer au paiement.</p>
                </div>

                <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                    <span className="text-sm text-slate-500">Formation</span>
                    <span className="text-sm font-semibold text-brand-dark">{selectedCourse.name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                    <span className="text-sm text-slate-500">Type</span>
                    <span className="text-sm font-semibold text-brand-dark">{selectedCourse.type}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                    <span className="text-sm text-slate-500">Durée</span>
                    <span className="text-sm font-semibold text-brand-dark">{selectedCourse.duration}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                    <span className="text-sm text-slate-500">Prix</span>
                    <span className="text-sm font-semibold text-brand-dark">{selectedCourse.price}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">Frais d’inscription</span>
                    <span className="text-sm font-semibold text-brand-dark">{selectedCourse.registrationFee}</span>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                  <h3 className="text-lg font-semibold text-brand-dark">Vos informations</h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <p><span className="font-semibold">Nom :</span> {formValues.nom}</p>
                    <p><span className="font-semibold">Prénom :</span> {formValues.prenom}</p>
                    <p><span className="font-semibold">Téléphone :</span> {formValues.telephone}</p>
                    <p><span className="font-semibold">Ville :</span> {formValues.ville}</p>
                    <p><span className="font-semibold">Email :</span> {formValues.email}</p>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button type="button" onClick={previousStep} className="btn-secondary gap-2">
                    <ChevronLeft className="h-4 w-4" /> Retour
                  </button>
                  <button type="button" onClick={nextStep} className="btn-primary gap-2">
                    Continuer <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-brand-dark">Paiement</h2>
                  <p className="mt-2 text-sm text-slate-600">Cette étape prépare la déclaration de votre paiement manuel.</p>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-3 text-brand-green">
                    <CreditCard className="h-5 w-5" />
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">Montant à prévoir</p>
                  </div>
                  <p className="mt-4 text-3xl font-black text-brand-dark">{selectedCourse.price}</p>
                  <p className="mt-2 text-sm text-slate-600">Frais d’inscription : {selectedCourse.registrationFee}</p>
                </div>

                <div className="rounded-[24px] border border-dashed border-brand-green/40 bg-brand-green/5 p-4 text-sm text-slate-700">
                  <div className="flex items-center gap-2 text-brand-green">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-semibold">Paiement manuel</span>
                  </div>
                  <p className="mt-2 leading-7">
                    Après votre dépôt, vous pourrez déclarer le paiement dans l’espace de paiement.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button type="button" onClick={previousStep} className="btn-secondary gap-2">
                    <ChevronLeft className="h-4 w-4" /> Retour
                  </button>
                  {submitError && <p className="text-sm text-red-700">{submitError}</p>}
                  <button type="button" disabled={isSubmitting} onClick={() => void handleSubmit()} className="btn-primary gap-2 disabled:opacity-50">
                    {isSubmitting ? 'Enregistrement...' : 'Finaliser le dossier'} <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-[30px] border border-slate-200 bg-gradient-to-br from-brand-green/10 via-white to-brand-red/5 p-5 shadow-soft sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-green">Résumé</p>
            <h3 className="mt-3 text-2xl font-bold text-brand-dark">{selectedCourse.name}</h3>
            <p className="mt-2 text-sm text-slate-600">{selectedCourse.type}</p>

            <div className="mt-6 space-y-3 rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">Formation</span>
                <span className="text-sm font-semibold text-brand-dark">{selectedCourse.name}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">Durée</span>
                <span className="text-sm font-semibold text-brand-dark">{selectedCourse.duration}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">Fréquence</span>
                <span className="text-sm font-semibold text-brand-dark">{selectedCourse.frequency}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">Séance</span>
                <span className="text-sm font-semibold text-brand-dark">{selectedCourse.sessionLength}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">Prix</span>
                <span className="text-sm font-semibold text-brand-dark">{selectedCourse.price}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default RegistrationPage
