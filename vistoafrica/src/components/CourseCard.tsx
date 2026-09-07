import { ArrowRight, CalendarDays, Clock3, GraduationCap, Landmark, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import type { Course } from '../types/course'
import PaymentTermsModal from './PaymentTermsModal'

type CourseCardProps = {
  course: Course
}

const badgeStyles: Record<NonNullable<Course['badgeTone']>, string> = {
  green: 'bg-brand-greenSoft text-brand-green',
  red: 'bg-brand-red/10 text-brand-red',
  amber: 'bg-amber-100 text-amber-700',
  slate: 'bg-slate-200 text-slate-700',
}

const CourseCard = ({ course }: CourseCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <article className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
        <div className="relative h-52 overflow-hidden">
          <img src={course.image} alt={course.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          {course.badge && (
            <span className={`absolute left-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${badgeStyles[course.badgeTone ?? 'slate']}`}>
              <Sparkles className="h-3.5 w-3.5" />
              {course.badge}
            </span>
          )}
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-green">{course.type}</p>
              <h3 className="mt-2 text-2xl font-bold text-brand-dark">{course.name}</h3>
            </div>
            <div className="rounded-full bg-brand-greenSoft p-2 text-brand-green">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
              <CalendarDays className="h-4 w-4 text-brand-green" />
              <span>Durée : {course.duration}</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
              <Clock3 className="h-4 w-4 text-brand-green" />
              <span>Fréquence : {course.frequency}</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
              <Clock3 className="h-4 w-4 text-brand-red" />
              <span>Séance : {course.sessionLength}</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
              <Landmark className="h-4 w-4 text-brand-red" />
              <span>Prix : {course.price}</span>
            </div>
          </div>

          {course.hourlyRate || course.exam || course.extra ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {course.hourlyRate && <p>Coût horaire : {course.hourlyRate}</p>}
              {course.exam && <p className="mt-1">{course.exam}</p>}
              {course.extra && <p className="mt-1">{course.extra}</p>}
            </div>
          ) : null}

          {course.details && course.details.length > 0 && (
            <ul className="space-y-2 text-sm text-slate-600">
              {course.details.map((detail) => (
                <li key={detail} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-brand-green" />
                  {detail}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-green hover:text-brand-green"
            >
              Modalités de paiement
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to={`/inscription?courseId=${course.id}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-greenDeep"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </article>

      <PaymentTermsModal course={course} open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

export default CourseCard
