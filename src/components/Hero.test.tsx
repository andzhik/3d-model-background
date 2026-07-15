import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Hero } from './Hero'

describe('Hero', () => {
  it('exposes one main landmark with a labelled hero region', () => {
    render(<Hero />)

    expect(screen.getAllByRole('main')).toHaveLength(1)

    const heading = screen.getByRole('heading', {
      level: 1,
      name: /stillness in the wild/i,
    })
    const hero = screen.getByRole('region', {
      name: /stillness in the wild/i,
    })

    expect(hero).toContainElement(heading)
    expect(hero).toHaveAttribute('aria-labelledby', heading.id)
  })

  it('renders descriptive copy and a usable call to action', () => {
    render(<Hero />)

    expect(
      screen.getByText(/pause, breathe, and meet the quiet/i),
    ).toBeInTheDocument()

    const callToAction = screen.getByRole('link', {
      name: /begin the journey/i,
    })
    const target = document.querySelector<HTMLElement>('#begin')

    expect(callToAction).toHaveAttribute('href', '#begin')
    expect(target).toHaveAttribute('tabindex', '-1')
  })
})
