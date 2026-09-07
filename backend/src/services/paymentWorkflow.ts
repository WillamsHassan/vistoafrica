export type RegistrationPaymentStatus = 'PAYMENT_PENDING' | 'PAYMENT_DECLARED' | 'REJECTED' | 'CONFIRMED'
export type PaymentStatus = 'PENDING' | 'DECLARED' | 'VERIFIED' | 'REJECTED'

export const canDeclarePayment = (registrationStatus: RegistrationPaymentStatus) => registrationStatus === 'PAYMENT_PENDING' || registrationStatus === 'REJECTED'

export const reviewPaymentStatus = (paymentStatus: PaymentStatus, action: 'confirm' | 'reject') => {
  if (paymentStatus !== 'DECLARED') throw new Error('Seuls les paiements déclarés peuvent être traités.')
  return action === 'confirm' ? { payment: 'VERIFIED' as const, registration: 'CONFIRMED' as const } : { payment: 'REJECTED' as const, registration: null }
}