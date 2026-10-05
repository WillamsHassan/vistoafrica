import { ChevronLeft, ChevronRight, Eye, Filter, Pencil, Search, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { useAdminAuth } from '../../contexts/AdminAuthContext'

type Course = { id: string; name: string }
type Registration = { course: Course; status: string; createdAt: string }
type Student = { id: string; firstName: string; lastName: string; phone: string | null; email: string; city: string | null; createdAt: string; registrations: Registration[] }
type StudentResponse = { items: Student[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
const statuses = ['PENDING', 'PAYMENT_PENDING', 'PAYMENT_DECLARED', 'PAYMENT_VERIFIED', 'CONFIRMED', 'REJECTED', 'CANCELLED']
const statusLabels: Record<string, string> = {
  PENDING: 'En attente', PAYMENT_PENDING: 'Paiement attendu', PAYMENT_DECLARED: 'Paiement déclaré',
  PAYMENT_VERIFIED: 'Paiement vérifié', CONFIRMED: 'Confirmée', REJECTED: 'Rejetée', CANCELLED: 'Annulée',
}

const formatDate = (value: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))

const AdminEtudiantsPage = () => {
  const { token } = useAdminAuth()
  const [students, setStudents] = useState<StudentResponse>({ items: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } })
  const [courses, setCourses] = useState<Course[]>([])
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [courseId, setCourseId] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCourses = async () => {
      const response = await fetch(`${apiUrl}/api/admin/courses?includeInactive=true`, { headers: { Authorization: `Bearer ${token}` } })
      if (response.ok) {
        const data = (await response.json()) as { data: Course[] }
        setCourses(data.data)
      }
    }
    void loadCourses()
  }, [token])

  useEffect(() => {
    const loadStudents = async () => {
      setIsLoading(true)
      setError('')
      const params = new URLSearchParams({ page: String(page), pageSize: '10' })
      if (search.trim()) params.set('search', search.trim())
      if (city.trim()) params.set('city', city.trim())
      if (courseId) params.set('courseId', courseId)
      if (status) params.set('status', status)
      try {
        const response = await fetch(`${apiUrl}/api/admin/students?${params}`, { headers: { Authorization: `Bearer ${token}` } })
        const data = (await response.json()) as { data?: StudentResponse; message?: string }
        if (!response.ok || !data.data) throw new Error(data.message ?? 'Impossible de charger les étudiants.')
        setStudents(data.data)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les étudiants.')
      } finally {
        setIsLoading(false)
      }
    }
    void loadStudents()
  }, [token, page, search, city, courseId, status])

  const resetFilters = () => { setSearch(''); setCity(''); setCourseId(''); setStatus(''); setPage(1) }

  const deleteStudent = async () => {
    if (!deletingStudent) return
    setIsDeleting(true); setError(''); setNotice('')
    try {
      const response = await fetch(`${apiUrl}/api/admin/students/${deletingStudent.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      const result = (await response.json()) as { message?: string }
      if (!response.ok) throw new Error(result.message ?? 'Impossible de supprimer cet étudiant.')
      setNotice(result.message ?? 'Étudiant supprimé.')
      setStudents((current) => ({ ...current, items: current.items.filter((item) => item.id !== deletingStudent.id), pagination: { ...current.pagination, total: Math.max(0, current.pagination.total - 1) } }))
      setDeletingStudent(null)
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Impossible de supprimer cet étudiant.') } finally { setIsDeleting(false) }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-green">Administration</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Étudiants</h1><p className="mt-2 text-slate-600">Consultez et gérez les dossiers étudiants.</p></div>
        <p className="text-sm text-slate-500">{students.pagination.total} étudiant{students.pagination.total > 1 ? 's' : ''}</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_220px_210px_auto]">
          <label className="relative block"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Rechercher un nom, email..." className="input-field pl-10" /></label>
          <input value={city} onChange={(event) => { setCity(event.target.value); setPage(1) }} placeholder="Ville" className="input-field" />
          <select value={courseId} onChange={(event) => { setCourseId(event.target.value); setPage(1) }} className="input-field"><option value="">Toutes les formations</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="input-field"><option value="">Tous les statuts</option>{statuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select>
          <button type="button" onClick={resetFilters} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:border-brand-green hover:text-brand-green"><Filter className="h-4 w-4" />Réinitialiser</button>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div>}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">ID</th><th className="px-5 py-4">Nom</th><th className="px-5 py-4">Téléphone</th><th className="px-5 py-4">Email</th><th className="px-5 py-4">Ville</th><th className="px-5 py-4">Formation</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Statut</th><th className="px-5 py-4" aria-label="Actions" /></tr></thead>
          <tbody className="divide-y divide-slate-100">{isLoading ? <tr><td colSpan={9} className="px-5 py-12 text-center text-slate-500">Chargement des étudiants...</td></tr> : students.items.length === 0 ? <tr><td colSpan={9} className="px-5 py-12 text-center text-slate-500">Aucun étudiant trouvé.</td></tr> : students.items.map((student) => { const registration = student.registrations[0]; return <tr key={student.id} className="hover:bg-slate-50"><td className="px-5 py-4 font-mono text-xs text-slate-500">{student.id.slice(0, 8)}</td><td className="px-5 py-4 font-semibold text-slate-900">{student.firstName} {student.lastName}</td><td className="px-5 py-4 text-slate-600">{student.phone ?? '—'}</td><td className="px-5 py-4 text-slate-600">{student.email}</td><td className="px-5 py-4 text-slate-600">{student.city ?? '—'}</td><td className="px-5 py-4 text-slate-600">{registration?.course.name ?? '—'}</td><td className="px-5 py-4 whitespace-nowrap text-slate-600">{formatDate(registration?.createdAt ?? student.createdAt)}</td><td className="px-5 py-4"><span className="whitespace-nowrap rounded-full bg-brand-greenSoft px-3 py-1 text-xs font-semibold text-brand-green">{statusLabels[registration?.status ?? ''] ?? 'Sans inscription'}</span></td><td className="px-5 py-4"><Link to={`/admin/etudiants/${student.id}`} className="inline-flex items-center gap-1 rounded-lg p-2 font-semibold text-brand-green hover:bg-brand-greenSoft" aria-label={`Consulter ${student.firstName} ${student.lastName}`}><Eye className="h-4 w-4" />Voir</Link><Link to={`/admin/etudiants/${student.id}`} className="inline-flex items-center gap-1 rounded-lg p-2 font-semibold text-sky-700 hover:bg-sky-50" aria-label={`Modifier ${student.firstName} ${student.lastName}`}><Pencil className="h-4 w-4" />Modifier</Link><button type="button" onClick={() => setDeletingStudent(student)} className="inline-flex items-center gap-1 rounded-lg p-2 font-semibold text-rose-700 hover:bg-rose-50" aria-label={`Supprimer ${student.firstName} ${student.lastName}`}><Trash2 className="h-4 w-4" />Supprimer</button></td></tr> })}</tbody>
        </table></div>
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>Page {students.pagination.page} sur {Math.max(students.pagination.totalPages, 1)}</span><div className="flex gap-2"><button type="button" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 p-2 hover:border-brand-green disabled:cursor-not-allowed disabled:opacity-40" aria-label="Page précédente"><ChevronLeft className="h-4 w-4" /></button><button type="button" disabled={page >= students.pagination.totalPages || isLoading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 p-2 hover:border-brand-green disabled:cursor-not-allowed disabled:opacity-40" aria-label="Page suivante"><ChevronRight className="h-4 w-4" /></button></div></div>
      </section>
      {deletingStudent && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><section role="dialog" aria-modal="true" aria-labelledby="delete-student-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="delete-student-title" className="text-xl font-bold text-slate-900">Supprimer cet étudiant ?</h2><p className="mt-2 text-sm text-slate-600">Cette action peut également affecter les inscriptions et autres données associées.</p></div><button type="button" disabled={isDeleting} onClick={() => setDeletingStudent(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Fermer"><X className="h-5 w-5" /></button></div><dl className="mt-5 grid grid-cols-[100px_1fr] gap-2 rounded-xl bg-slate-50 p-4 text-sm"><dt className="text-slate-500">Nom</dt><dd className="font-medium text-slate-900">{deletingStudent.lastName}</dd><dt className="text-slate-500">Prénom</dt><dd className="font-medium text-slate-900">{deletingStudent.firstName}</dd><dt className="text-slate-500">Email</dt><dd className="break-all font-medium text-slate-900">{deletingStudent.email}</dd><dt className="text-slate-500">Téléphone</dt><dd className="font-medium text-slate-900">{deletingStudent.phone ?? '—'}</dd></dl><p className="mt-3 text-xs text-slate-500">Si un historique est lié, l’étudiant sera archivé afin de préserver les inscriptions, paiements et factures.</p><div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row"><button type="button" disabled={isDeleting} onClick={() => setDeletingStudent(null)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Annuler</button><button type="button" disabled={isDeleting} onClick={() => void deleteStudent()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Trash2 className="h-4 w-4" />{isDeleting ? 'Suppression...' : 'Supprimer'}</button></div></section></div>}
    </div>
  )
}

export default AdminEtudiantsPage
