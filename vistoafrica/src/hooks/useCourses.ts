import { useEffect, useState } from 'react'

import type { Course, CourseApi } from '../types/course'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
const formatAmount = (value: string | number | null | undefined) => value === null || value === undefined ? '' : `${Number(value).toLocaleString('fr-FR')} XAF`

export const mapCourse = (course: CourseApi): Course => {
  const installments = Array.isArray(course.installments) ? course.installments.filter((item): item is string => typeof item === 'string') : []
  return {
    id: course.slug, slug: course.slug, name: course.name, category: course.category, type: course.type, description: course.description,
    duration: course.duration ?? 'Non précisée', frequency: course.frequency ?? 'Non précisée', sessionLength: course.sessionDuration ?? 'Non précisée',
    price: formatAmount(course.price), registrationFee: formatAmount(course.registrationFee), hourlyRate: formatAmount(course.hourlyRate) || undefined,
    exam: course.examIncluded ? 'Examen inclus' : 'Examen non inclus', extra: course.manualIncluded ? 'Manuel inclus' : 'Manuel non inclus', image: course.image ?? '',
    paymentTerms: { tuition: formatAmount(course.price), registrationFee: formatAmount(course.registrationFee), duration: course.duration ?? 'Non précisée', frequency: course.frequency ?? 'Non précisée', sessionLength: course.sessionDuration ?? 'Non précisée', hourlyRate: formatAmount(course.hourlyRate) || undefined, examIncluded: course.examIncluded, manualIncluded: course.manualIncluded, installments },
  }
}

export const useCourses = (category?: string) => {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/courses`)
        const result = (await response.json()) as { data?: CourseApi[]; message?: string }
        if (!response.ok || !result.data) throw new Error(result.message ?? 'Impossible de charger les formations.')
        setCourses(result.data.filter((course) => !category || course.category.toLowerCase() === category.toLowerCase()).map(mapCourse))
      } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Erreur de chargement.') } finally { setLoading(false) }
    }
    void loadCourses()
  }, [category])

  return { courses, loading, error }
}
