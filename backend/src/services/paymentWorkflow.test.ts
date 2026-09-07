import { describe, expect, it } from 'vitest'

import { canDeclarePayment, reviewPaymentStatus } from './paymentWorkflow'

describe('workflow de paiement VISTOAFRIKA', () => {
  it('autorise uniquement la déclaration depuis PAYMENT_PENDING ou REJECTED', () => {
    expect(canDeclarePayment('PAYMENT_PENDING')).toBe(true)
    expect(canDeclarePayment('REJECTED')).toBe(true)
    expect(canDeclarePayment('PAYMENT_DECLARED')).toBe(false)
    expect(canDeclarePayment('CONFIRMED')).toBe(false)
  })

  it('confirme uniquement un paiement DECLARED', () => {
    expect(reviewPaymentStatus('DECLARED', 'confirm')).toEqual({ payment: 'VERIFIED', registration: 'CONFIRMED' })
    expect(() => reviewPaymentStatus('PENDING', 'confirm')).toThrow()
    expect(() => reviewPaymentStatus('REJECTED', 'confirm')).toThrow()
  })

  it('rejette un paiement déclaré sans confirmer l’inscription', () => {
    expect(reviewPaymentStatus('DECLARED', 'reject')).toEqual({ payment: 'REJECTED', registration: null })
  })

  it('ne permet jamais à une déclaration publique de produire VERIFIED', () => {
    expect(reviewPaymentStatus('DECLARED', 'reject').payment).not.toBe('VERIFIED')
    expect(canDeclarePayment('PAYMENT_PENDING')).toBe(true)
  })
})
