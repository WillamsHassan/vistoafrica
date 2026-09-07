export type PaymentTerms = {
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

export type Course = {
  id: string
  name: string
  type: string
  duration: string
  frequency: string
  sessionLength: string
  price: string
  registrationFee: string
  badge?: string
  badgeTone?: 'green' | 'red' | 'amber' | 'slate'
  image: string
  details?: string[]
  hourlyRate?: string
  exam?: string
  extra?: string
  paymentTerms?: PaymentTerms
}

export const italianCourses: Course[] = [
  {
    id: 'italien-en-ligne',
    name: 'Italien en ligne',
    type: 'Formation en ligne',
    duration: '6 mois',
    frequency: '3 fois/semaine',
    sessionLength: '2h30',
    price: '300000 XAF',
    registrationFee: '10000 XAF',
    badge: 'Flexible',
    badgeTone: 'green',
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    hourlyRate: '1000 XAF/h',
    exam: 'Examen CELI : non inclus',
    details: ['Scolarité 300000 XAF', 'Inscription 10000 XAF'],
    paymentTerms: {
      tuition: '300000 XAF',
      registrationFee: '10000 XAF',
      duration: '6 mois',
      frequency: '3 fois/semaine',
      sessionLength: '2h30',
      hourlyRate: '1000 XAF/h',
      examIncluded: false,
      manualIncluded: false,
      additionalFees: ['Examen CELI : non inclus'],
      installments: ['100000 XAF', '100000 XAF', '100000 XAF'],
      deadlines: ['1ère tranche à l’inscription', '2e tranche après 2 mois', '3e tranche à mi-parcours'],
      conditions: ['Paiement accepté par virement ou cash selon disponibilités.', 'Un reçu est remis à chaque règlement.', 'Le dossier est validé après réception de l’inscription.'],
    },
  },
  {
    id: 'italien-a-domicile',
    name: 'Italien à domicile',
    type: 'Formation à domicile',
    duration: '6 mois',
    frequency: '3 fois/semaine',
    sessionLength: '3h',
    price: '420000 XAF',
    registrationFee: '10000 XAF',
    badge: 'Inclus',
    badgeTone: 'amber',
    image:
      'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=900&q=80',
    hourlyRate: '1500 XAF/h',
    exam: 'Examen CELI : inclus',
    details: ['Scolarité 420000 XAF', 'Inscription 10000 XAF'],
    paymentTerms: {
      tuition: '420000 XAF',
      registrationFee: '10000 XAF',
      duration: '6 mois',
      frequency: '3 fois/semaine',
      sessionLength: '3h',
      hourlyRate: '1500 XAF/h',
      examIncluded: true,
      manualIncluded: true,
      installments: ['140000 XAF', '140000 XAF', '140000 XAF'],
      deadlines: ['1ère tranche à l’inscription', '2e tranche après 2 mois', '3e tranche après 4 mois'],
      conditions: ['Examen CELI inclus dans la scolarité.', 'Les séances à domicile sont planifiées selon l’agenda du bénéficiaire.', 'Les frais de déplacement ne sont pas inclus si besoin d’un déplacement hors zone.'],
    },
  },
  {
    id: 'italien-presentiel',
    name: 'Italien en présentiel',
    type: 'Formation présentielle',
    duration: '6 mois',
    frequency: '5 fois/semaine',
    sessionLength: '2h30',
    price: '410000 XAF',
    registrationFee: '10000 XAF',
    badge: 'Populaire',
    badgeTone: 'red',
    image:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=80',
    exam: 'Examen CELI : inclus',
    details: ['Scolarité 410000 XAF', 'Inscription 10000 XAF'],
    paymentTerms: {
      tuition: '410000 XAF',
      registrationFee: '10000 XAF',
      duration: '6 mois',
      frequency: '5 fois/semaine',
      sessionLength: '2h30',
      examIncluded: true,
      manualIncluded: true,
      installments: ['150000 XAF', '130000 XAF', '130000 XAF'],
      deadlines: ['1ère tranche à l’inscription', '2e tranche à la 2e semaine', '3e tranche à la fin du 3e mois'],
      conditions: ['La formation est payable en 3 tranches sans pénalité.', 'Le matériel pédagogique est inclus.', 'L’inscription est confirmée après validation du dossier.'],
    },
  },
]

export const englishCourses: Course[] = [
  {
    id: 'anglais-en-ligne',
    name: 'Anglais en ligne',
    type: 'Formation en ligne',
    duration: '6 mois',
    frequency: '3 fois/semaine',
    sessionLength: '2h30',
    price: '280000 XAF',
    registrationFee: '10000 XAF',
    badge: 'À partir de',
    badgeTone: 'green',
    image:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
    details: ['Scolarité 280000 XAF', 'Inscription 10000 XAF', 'Tranches : 80000 / 100000 / 100000'],
    paymentTerms: {
      tuition: '280000 XAF',
      registrationFee: '10000 XAF',
      duration: '6 mois',
      frequency: '3 fois/semaine',
      sessionLength: '2h30',
      examIncluded: false,
      manualIncluded: false,
      installments: ['80000 XAF', '100000 XAF', '100000 XAF'],
      deadlines: ['1ère tranche à l’inscription', '2e tranche après 2 mois', '3e tranche à mi-parcours'],
      conditions: ['Le paiement se fait selon l’échéancier proposé.', 'Les supports numériques sont envoyés par e-mail après inscription.', 'Toute annulation est traitée selon les conditions pédagogiques du centre.'],
    },
  },
  {
    id: 'anglais-a-domicile',
    name: 'Anglais à domicile',
    type: 'Formation à domicile',
    duration: '6 mois',
    frequency: '3 fois/semaine',
    sessionLength: '2h30',
    price: '390000 XAF',
    registrationFee: '10000 XAF',
    badge: 'Sur mesure',
    badgeTone: 'amber',
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    extra: 'Frais préparation : 60000 XAF',
    details: ['Scolarité 390000 XAF', 'Tranches : 100000 / 140000 / 150000', 'Sans examen', 'Sans manuel'],
    paymentTerms: {
      tuition: '390000 XAF',
      registrationFee: '10000 XAF',
      duration: '6 mois',
      frequency: '3 fois/semaine',
      sessionLength: '2h30',
      examIncluded: false,
      manualIncluded: false,
      additionalFees: ['Frais préparation : 60000 XAF'],
      installments: ['100000 XAF', '140000 XAF', '150000 XAF'],
      deadlines: ['1ère tranche à l’inscription', '2e tranche après 2 mois', '3e tranche après 4 mois'],
      conditions: ['Le forfait inclut les cours à domicile et le suivi personnalisé.', 'Les frais de préparation sont payés en plus de la scolarité.', 'La séance est planifiée selon les disponibilités du formateur.'],
    },
  },
  {
    id: 'anglais-presentiel',
    name: 'Anglais en présentiel',
    type: 'Formation présentielle',
    duration: '6 mois',
    frequency: '3 fois/semaine',
    sessionLength: '2h',
    price: '390000 XAF',
    registrationFee: '10000 XAF',
    badge: 'Immersif',
    badgeTone: 'red',
    image:
      'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80',
    details: ['Scolarité 390000 XAF', 'Sans examen', 'Hors manuel'],
    paymentTerms: {
      tuition: '390000 XAF',
      registrationFee: '10000 XAF',
      duration: '6 mois',
      frequency: '3 fois/semaine',
      sessionLength: '2h',
      examIncluded: false,
      manualIncluded: false,
      installments: ['130000 XAF', '130000 XAF', '130000 XAF'],
      deadlines: ['1ère tranche à l’inscription', '2e tranche après 1 mois', '3e tranche à mi-parcours'],
      conditions: ['Les frais du manuel ne sont pas inclus dans la scolarité.', 'La présence est obligatoire pour bénéficier du rythme prévu.', 'Le dossier d’inscription est validé après réception du premier règlement.'],
    },
  },
]

export const allCourses = [...italianCourses, ...englishCourses]
