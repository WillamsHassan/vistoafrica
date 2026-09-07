import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import AppRoutes from '../routes/AppRoutes'

vi.mock('../contexts/AdminAuthContext', () => ({
  AdminAuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('../components/ProtectedRoute', () => ({ default: ({ children }: { children: React.ReactNode }) => children }))

describe('navigation publique', () => {
  it('affiche la page À propos', () => {
    render(<MemoryRouter initialEntries={['/a-propos']}><AppRoutes /></MemoryRouter>)
    expect(screen.getByText('Notre mission')).toBeInTheDocument()
    expect(screen.getByText('Notre vision')).toBeInTheDocument()
  })

  it('affiche la page Contact', () => {
    render(<MemoryRouter initialEntries={['/contact']}><AppRoutes /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /Contactez VISTOAFRIKA/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Téléphone')).toBeInTheDocument()
  })
})
