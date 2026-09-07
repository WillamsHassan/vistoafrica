import { BriefcaseBusiness, Globe2, Rocket, Sparkles } from 'lucide-react'

import CourseCard from '../components/CourseCard'
import { useCourses } from '../hooks/useCourses'

const highlights = [
  {
    title: 'Pour l’études & le travail',
    text: 'Des cours pensés pour la communication professionnelle et académique.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Disponibilité flexible',
    text: 'Une organisation adaptée à votre rythme de vie et à vos objectifs.',
    icon: Globe2,
  },
  {
    title: 'Progression concrète',
    text: 'Des séances pratiques, ciblées et orientées résultats.',
    icon: Rocket,
  },
]

const CoursAnglaisPage = () => {
  const { courses, loading, error } = useCourses('anglais')
  return (
    <div className="section-shell py-12 sm:py-16">
      <section className="overflow-hidden rounded-[32px] bg-gradient-to-r from-brand-green to-brand-greenDeep p-8 text-white shadow-glow sm:p-10 lg:p-12">
        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-red-50">
              Cours d’anglais
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">Développez votre anglais pour aller plus loin.</h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-red-50 sm:text-lg">
              Des programmes efficaces pour parler, comprendre, écrire et réussir vos objectifs personnels, académiques et professionnels.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-red-100">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-[0.24em]">Atouts</span>
            </div>
            <ul className="mt-5 space-y-4 text-sm text-red-50">
              <li className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-white" /> anglais général et professionnel</li>
              <li className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-white" /> préparation aux examens et dossiers</li>
              <li className="flex items-center gap-3"><span className="h-2.5 w-2.5 rounded-full bg-white" /> supervision pédagogique régulière</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        {highlights.map(({ title, text, icon: Icon }) => (
          <div key={title} className="card-surface p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-red/5 text-brand-red">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-brand-dark">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-green">Nos offres</p>
          <h2 className="mt-3 text-3xl font-bold text-brand-dark sm:text-4xl">Choisissez votre format de cours</h2>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {loading && <p className="text-slate-500">Chargement des formations...</p>}
          {error && <p className="text-red-700">{error}</p>}
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default CoursAnglaisPage
