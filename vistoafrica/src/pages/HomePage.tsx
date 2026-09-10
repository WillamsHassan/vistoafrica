import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  ChevronRight,
  CircleCheckBig,
  Globe2,
  Languages,
  MessageSquareText,
  Plane,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const stats = [
  { value: '12k+', label: 'Apprenants' },
  { value: '96%', label: 'Satisfaction' },
  { value: '24/7', label: 'Support' },
  { value: '40+', label: 'Pays ciblés' },
]

const formationCards = [
  {
    title: 'Italien',
    text: 'Cours structurés pour progresser rapidement en communication, écriture et compréhension orale.',
    color: 'bg-brand-greenSoft text-brand-green',
    icon: Languages,
  },
  {
    title: 'Anglais',
    text: 'Un apprentissage orienté études, travail, voyage et mobilité internationale.',
    color: 'bg-brand-red/5 text-brand-red',
    icon: BriefcaseBusiness,
  },
]

const trainingModes = [
  { title: 'En ligne', text: 'Flexibilité totale pour apprendre à votre rythme.', icon: Globe2 },
  { title: 'À domicile', text: 'Un accompagnement personnalisé et rassurant.', icon: HomeIcon },
  { title: 'Présentiel', text: 'Des sessions immersives avec un suivi concret.', icon: Users },
]

const reasons = [
  {
    title: 'Expertise linguistique',
    text: 'Des programmes conçus pour un apprentissage efficace et durable.',
    icon: BookOpen,
  },
  {
    title: 'Accompagnement visa',
    text: 'Soutien professionnel pour les dossiers étudiant et tourisme.',
    icon: ShieldCheck,
  },
  {
    title: 'Suivi humain',
    text: 'Une équipe engagée pour guider chaque étape du parcours.',
    icon: MessageSquareText,
  },
  {
    title: 'Mobilité internationale',
    text: 'Une vision globale de l’éducation, du voyage et de l’intégration.',
    icon: Plane,
  },
]

const testimonials = [
  {
    name: 'Amina D.',
    course: 'Italien – niveau intermédiaire',
    quote: 'Le suivi était excellent et j’ai trouvé une vraie dynamique de progression. Les cours sont clairs et motivants.',
    rating: 5,
  },
  {
    name: 'Jean M.',
    course: 'Anglais – préparation visa',
    quote: 'Le service est très professionnel. J’ai bénéficié d’un accompagnement sérieux et bien structuré.',
    rating: 5,
  },
  {
    name: 'Sara K.',
    course: 'Cours à domicile',
    quote: 'Très bon équilibre entre sérieux, pédagogie et flexibilité. J’ai réussi à avancer à mon rythme.',
    rating: 5,
  },
]

function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3 10.5V7.75A1.75 1.75 0 0 1 4.75 6h14.5A1.75 1.75 0 0 1 21 7.75v2.75" />
      <path d="M5 10.5V18a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7.5" />
      <path d="M9 18v-6h6v6" />
    </svg>
  )
}

const HomePage = () => {
  return (
    <div className="pb-18">
      <section className="section-shell pt-12 sm:pt-16 lg:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <span className="badge">FORMATION • LANGUES • VISA</span>
            <h1 className="mt-6 max-w-xl text-4xl font-black leading-tight text-brand-dark sm:text-5xl lg:text-6xl">
              Apprendre. Préparer. Réussir.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              VISTOAFRIKA vous accompagne dans l’apprentissage des langues, la préparation de votre mobilité internationale et la gestion de votre dossier visa étudiant ou touristique.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button type="button" onClick={() => document.getElementById('formations')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="btn-primary gap-2">
                Découvrir nos formations <ArrowRight className="h-4 w-4" />
              </button>
              <Link to="/visa" className="btn-secondary">Nos services Visa</Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-soft">
                  <p className="text-2xl font-bold text-brand-green">{item.value}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="relative"
          >
            <div className="absolute -left-4 top-10 h-28 w-28 rounded-full bg-brand-red/10 blur-3xl" />
            <div className="absolute -right-2 bottom-10 h-28 w-28 rounded-full bg-brand-green/15 blur-3xl" />

            <div className="card-surface relative overflow-hidden p-5 sm:p-7">
              <div className="rounded-[2rem] bg-gradient-to-br from-brand-green via-emerald-600 to-brand-greenDeep p-6 text-white shadow-glow">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-50">
                    VISTOAFRIKA
                  </span>
                  <Sparkles className="h-5 w-5 text-yellow-200" />
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                    <BookOpen className="h-6 w-6 text-white" />
                    <p className="mt-4 text-xl font-semibold">Formation</p>
                    <p className="mt-2 text-sm text-emerald-50">Cours d’italien et d’anglais</p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                    <Globe2 className="h-6 w-6 text-white" />
                    <p className="mt-4 text-xl font-semibold">Mobilité</p>
                    <p className="mt-2 text-sm text-emerald-50">Études, voyage et projet international</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-100">Parcours</p>
                      <p className="mt-2 text-xl font-semibold">Visa & mobilité</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-red/20 text-white">
                      <Plane className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-brand-red/5 p-4">
                  <p className="text-sm text-slate-500">Accompagnement</p>
                  <p className="mt-2 text-xl font-semibold text-brand-dark">Personnalisé</p>
                </div>
                <div className="rounded-2xl bg-brand-greenSoft p-4">
                  <p className="text-sm text-slate-500">Objectif</p>
                  <p className="mt-2 text-xl font-semibold text-brand-dark">Réussir</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="formations" className="section-shell mt-20 scroll-mt-28">
        <div className="mb-8">
          <span className="badge">Nos formations</span>
          <h2 className="mt-4 text-3xl font-bold text-brand-dark sm:text-4xl">Des cours pensés pour avancer sereinement</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {formationCards.map(({ title, text, color, icon: Icon }) => (
            <Link to={title === 'Italien' ? '/cours-italien' : '/cours-anglais'} key={title} className="block">
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="card-surface p-6 sm:p-7"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-2xl font-bold text-brand-dark">{title}</h3>
              <p className="mt-3 text-base leading-7 text-slate-600">{text}</p>
              <div className="mt-6 flex items-center gap-3 text-sm font-semibold text-brand-green">
                <span>Voir le programme</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </motion.article>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-shell mt-20">
        <div className="mb-8">
          <span className="badge">Formats</span>
          <h2 className="mt-4 text-3xl font-bold text-brand-dark sm:text-4xl">Choisissez le mode d’apprentissage qui vous convient</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {trainingModes.map(({ title, text, icon: Icon }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              className="card-surface p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-greenSoft text-brand-green">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-brand-dark">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="section-shell mt-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="card-surface bg-brand-dark p-8 text-white sm:p-10">
            <span className="badge border-white/10 bg-white/5 text-emerald-100">Visa</span>
            <h2 className="mt-5 text-3xl font-bold text-white">Une aide claire pour votre mobilité internationale</h2>
            <p className="mt-4 text-slate-300">
              Nous vous aidons à préparer votre dossier avec sérieux, ordre et confiance pour un projet de passage réussi.
            </p>

            <div className="mt-8 space-y-4">
              {['Visa étudiant', 'Visa tourisme', 'Conseils personnalisés', 'Préparation de dossier'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-white/5 p-3">
                  <CircleCheckBig className="h-5 w-5 text-brand-green" />
                  <span className="text-sm font-medium text-slate-100">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-surface bg-gradient-to-br from-brand-red/5 to-white p-8 sm:p-10">
            <span className="badge">Processus</span>
            <h2 className="mt-5 text-3xl font-bold text-brand-dark">Comment nous travaillons</h2>
            <div className="mt-8 space-y-6">
              {[
                { step: '01', title: 'Diagnostic', text: 'Nous identifions votre objectif, votre profil et vos besoins.' },
                { step: '02', title: 'Préparation', text: 'Nous structurons votre parcours et les documents à réunir.' },
                { step: '03', title: 'Suivi', text: 'Vous êtes accompagné jusqu’à la validation de votre projet.' },
              ].map(({ step, title, text }) => (
                <div key={step} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green text-sm font-bold text-white">
                    {step}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-brand-dark">{title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell mt-20">
        <div className="mb-8">
          <span className="badge">Pourquoi nous</span>
          <h2 className="mt-4 text-3xl font-bold text-brand-dark sm:text-4xl">Pourquoi choisir VISTOAFRIKA</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {reasons.map(({ title, text, icon: Icon }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              className="card-surface p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-red/5 text-brand-red">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-brand-dark">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="section-shell mt-20">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="badge">Témoignages</span>
            <h2 className="mt-4 text-3xl font-bold text-brand-dark sm:text-4xl">Ils nous font confiance</h2>
          </div>
          <p className="text-sm text-slate-500">Données fictives de démonstration</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map(({ name, course, quote, rating }) => (
            <motion.article
              key={name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              className="card-surface p-6"
            >
              <div className="flex items-center gap-1 text-brand-red">
                {Array.from({ length: rating }).map((_, index) => (
                  <Star key={`${name}-${index}`} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-600">“{quote}”</p>
              <div className="mt-6 border-t border-slate-200 pt-4">
                <p className="font-semibold text-brand-dark">{name}</p>
                <p className="text-sm text-slate-500">{course}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="section-shell mt-20">
        <div className="card-surface bg-gradient-to-r from-brand-green to-brand-greenDeep p-8 text-white shadow-glow sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-50">
                Prêt à avancer ?
              </span>
              <h2 className="mt-5 text-3xl font-bold sm:text-4xl">Votre prochaine étape commence ici.</h2>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/inscription" className="btn-primary bg-white text-brand-green hover:bg-slate-100">S’inscrire</Link>
              <Link to="/contact" className="btn-secondary border-white/40 bg-transparent text-white hover:border-white hover:bg-white/5">Nous contacter</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
