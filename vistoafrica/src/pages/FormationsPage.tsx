
import { Link } from 'react-router-dom'

import CourseCard from '../components/CourseCard'
import { useCourses } from '../hooks/useCourses'

const FormationsPage = () => {
  const { courses, loading, error } = useCourses()

  return (
    <main className="section-shell py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-green">
          VistoAfrica
        </p>

        <h1 className="mt-3 text-3xl font-bold text-brand-dark sm:text-4xl">
          Nos formations
        </h1>

        <p className="mt-4 text-slate-600">
          Découvrez nos formations en italien et en anglais, comparez les
          modalités et les tarifs, puis choisissez celle qui vous convient.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/cours-italien"
            className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-brand-green hover:text-brand-green"
          >
            Cours d’italien
          </Link>

          <Link
            to="/cours-anglais"
            className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-brand-green hover:text-brand-green"
          >
            Cours d’anglais
          </Link>
        </div>
      </div>

      <section className="mt-12">
        {loading && (
          <p className="py-10 text-center text-slate-500">
            Chargement des formations...
          </p>
        )}

        {!loading && error && (
          <p className="py-10 text-center text-red-700">
            {error}
          </p>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-slate-600">
              Aucune formation n’est disponible pour le moment.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Veuillez réessayer plus tard.
            </p>
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default FormationsPage
