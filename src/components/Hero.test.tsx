import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Hero } from './Hero'

describe('Hero', () => {
  it('renders the primary content and call to action', () => {
    render(<Hero />)

    expect(
      screen.getByRole('heading', { level: 1, name: /stillness in the wild/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/pause, breathe, and meet the quiet/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /begin the journey/i }),
    ).toHaveAttribute('href', '#begin')
  })
})
