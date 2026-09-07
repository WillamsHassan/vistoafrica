import { Mail, MapPin, MessageSquareText, Phone } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { useSiteSettings } from '../hooks/useSiteSettings'

type FormState = {
  nom: string
  email: string
  telephone: string
  sujet: string
  message: string
}

const initialForm: FormState = {
  nom: '',
  email: '',
  telephone: '',
  sujet: '',
  message: '',
}

const ContactPage = () => {
  const [form, setForm] = useState<FormState>(initialForm)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const settings = useSiteSettings()

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.nom, email: form.email, phone: form.telephone, subject: form.sujet, message: form.message }) })
      const result = (await response.json()) as { message?: string }
      if (!response.ok) throw new Error(result.message ?? 'Impossible d’envoyer le message.')
      setIsSubmitted(true)
      setForm(initialForm)
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Impossible d’envoyer le message.') } finally { setIsSubmitting(false) }
  }

  return (
    <div className="section-shell py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-green">Contact</p>
          <h1 className="mt-4 text-4xl font-bold text-brand-dark sm:text-5xl">Contactez VISTOAFRIKA</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Nous sommes à votre écoute pour vous conseiller sur vos besoins de formation, mobilité et visa.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="rounded-[30px] border border-slate-200 bg-gradient-to-br from-brand-green to-brand-greenDeep p-6 text-white shadow-glow sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                <MessageSquareText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-100">Réponse rapide</p>
                <h2 className="mt-1 text-2xl font-bold">Nous écrire</h2>
              </div>
            </div>

            <div className="mt-8 space-y-5 text-sm text-emerald-50">
              <div className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-white" />
                <span>{settings.contact_phone ?? settings.payment_whatsapp ?? '...'}</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-1 h-5 w-5 shrink-0 text-white" />
                <span>{settings.contact_email ?? '...'}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-white" />
                <span>{settings.contact_address ?? '...'}</span>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm leading-7 text-emerald-50">
              Notre équipe vous répondra avec précision sur votre projet d’apprentissage, d’étude ou de mobilité internationale.
            </div>
          </aside>

          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-brand-dark">Nom complet</span>
                  <input
                    required
                    type="text"
                    value={form.nom}
                    onChange={(event) => handleChange('nom', event.target.value)}
                    placeholder="Votre nom"
                    className="input-field"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-brand-dark">Téléphone</span>
                  <input required type="tel" value={form.telephone} onChange={(event) => handleChange('telephone', event.target.value)} placeholder="Votre téléphone" className="input-field" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-brand-dark">Email</span>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) => handleChange('email', event.target.value)}
                    placeholder="votre@email.com"
                    className="input-field"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-brand-dark">Objet</span>
                <input
                  required
                  type="text"
                  value={form.sujet}
                  onChange={(event) => handleChange('sujet', event.target.value)}
                  placeholder="Objet de votre message"
                  className="input-field"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-brand-dark">Message</span>
                <textarea
                  required
                  rows={7}
                  value={form.message}
                  onChange={(event) => handleChange('message', event.target.value)}
                  placeholder="Décrivez votre demande..."
                  className="input-field min-h-[180px] resize-none"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-50">
                  Envoyer un message
                </button>

                {isSubmitted && <p className="text-sm font-medium text-brand-green">Votre message a bien été envoyé.</p>}
                {error && <p className="text-sm font-medium text-red-700">{error}</p>}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
