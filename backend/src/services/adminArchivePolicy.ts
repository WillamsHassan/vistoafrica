export const studentRemovalPolicy = (counts: { registrations: number; payments: number; invoices: number }) => ({
  archive: counts.registrations + counts.payments + counts.invoices > 0,
})

export const courseRemovalPolicy = (registrations: number, hasActiveRegistration: boolean) => ({
  archive: registrations > 0 && !hasActiveRegistration,
  deactivateOnly: hasActiveRegistration,
  delete: registrations === 0,
})

export const canPermanentlyDeleteArchivedEntity = (linkedRegistrations: number) => linkedRegistrations === 0

export const canPermanentlyDeletePayment = (_status: 'PENDING' | 'DECLARED' | 'VERIFIED' | 'REJECTED') => false

export const isAuthorizedAdminRole = (role: string | undefined) => role === 'ADMIN' || role === 'SUPER_ADMIN'
