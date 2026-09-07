export type Course = {
  id: string
  slug: string
  name: string
  category: string
  type: string
  description: string
  duration: string
  frequency: string
  sessionLength: string
  price: string
  registrationFee: string
  hourlyRate?: string
  exam?: string
  extra?: string
  image: string
  badge?: string
  badgeTone?: 'green' | 'red' | 'amber' | 'slate'
  details?: string[]
  paymentTerms?: {
    tuition: string
    registrationFee: string
    duration: string
    frequency: string
    sessionLength: string
    hourlyRate?: string
    examIncluded?: boolean
    manualIncluded?: boolean
    additionalFees?: string[]
    installments?: string[]
    deadlines?: string[]
    conditions?: string[]
  }
}

export type CourseApi = {
  id: string
  slug: string
  name: string
  category: string
  type: string
  description: string
  duration: string | null
  frequency: string | null
  sessionDuration: string | null
  price: string | number
  registrationFee: string | number
  hourlyRate: string | number | null
  examIncluded: boolean
  manualIncluded: boolean
  preparationFees: string | number | null
  installments: unknown
  image: string | null
  isActive: boolean
}
