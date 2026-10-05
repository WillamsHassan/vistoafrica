import { describe, expect, it } from 'vitest'

import { canPermanentlyDeleteArchivedEntity, canPermanentlyDeletePayment, courseRemovalPolicy, isAuthorizedAdminRole, studentRemovalPolicy } from './adminArchivePolicy'

const deletionPermission = (role: string | undefined) => isAuthorizedAdminRole(role)

describe('politiques de suppression administrative', () => {
  it('autorise la suppression physique d’un étudiant sans relation, mais archive son historique', () => {
    expect(studentRemovalPolicy({ registrations: 0, payments: 0, invoices: 0 })).toEqual({ archive: false })
    expect(studentRemovalPolicy({ registrations: 1, payments: 0, invoices: 0 })).toEqual({ archive: true })
    expect(studentRemovalPolicy({ registrations: 0, payments: 1, invoices: 0 })).toEqual({ archive: true })
    expect(studentRemovalPolicy({ registrations: 0, payments: 0, invoices: 1 })).toEqual({ archive: true })
  })

  it('supprime une formation sans inscription, archive une formation inactive liée, désactive celle avec un dossier actif', () => {
    expect(courseRemovalPolicy(0, false)).toEqual({ archive: false, deactivateOnly: false, delete: true })
    expect(courseRemovalPolicy(2, false)).toEqual({ archive: true, deactivateOnly: false, delete: false })
    expect(courseRemovalPolicy(1, true)).toEqual({ archive: false, deactivateOnly: true, delete: false })
  })

  it('interdit toute suppression définitive des paiements, y compris vérifiés', () => {
    for (const status of ['PENDING', 'DECLARED', 'VERIFIED', 'REJECTED'] as const) expect(canPermanentlyDeletePayment(status)).toBe(false)
  })

  it('n’autorise la purge finale que pour une ressource archivée sans inscription', () => {
    expect(canPermanentlyDeleteArchivedEntity(0)).toBe(true)
    expect(canPermanentlyDeleteArchivedEntity(1)).toBe(false)
  })

  it('n’autorise que les rôles administrateurs', () => {
    expect(deletionPermission('ADMIN')).toBe(true)
    expect(deletionPermission('SUPER_ADMIN')).toBe(true)
    expect(deletionPermission('STUDENT')).toBe(false)
    expect(deletionPermission(undefined)).toBe(false)
  })
})
