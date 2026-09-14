import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCard from './StatCard'

describe('StatCard', () => {
  it('renders the label and value', () => {
    render(<StatCard label="Clientes" value={12} />)

    expect(screen.getByText('Clientes')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('renders split primary/secondary values when secondaryValue is provided', () => {
    render(
      <StatCard
        label="Ingresos"
        value="$1.200"
        primaryLabel="cobrado"
        secondaryValue="$300"
        secondaryLabel="pendiente"
      />,
    )

    expect(screen.getByText('$1.200')).toBeInTheDocument()
    expect(screen.getByText('$300')).toBeInTheDocument()
    expect(screen.getByText('pendiente')).toBeInTheDocument()
  })
})
