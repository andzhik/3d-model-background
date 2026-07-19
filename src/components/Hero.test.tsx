import { fireEvent, render, screen } from '@testing-library/react'
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

  it('can hide the centered text and call to action', () => {
    render(<Hero />)

    const contentToggle = screen.getByRole('button', {
      name: /hide text/i,
    })
    fireEvent.click(contentToggle)

    expect(contentToggle).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('button', { name: /show text/i }),
    ).toBeInTheDocument()
    expect(document.querySelector('#hero-content')).not.toBeVisible()
    expect(
      screen.queryByRole('heading', { name: /stillness in the wild/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /begin the journey/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: /lemur scene/i }),
    ).toBeInTheDocument()
  })

  it('keeps the poster fallback when WebGL is unavailable', () => {
    const { container } = render(<Hero />)
    const scene = container.querySelector('.scene-background')
    const hero = screen.getByRole('region', {
      name: /stillness in the wild/i,
    })
    const sceneToggle = screen.getByRole('switch', { name: /3d scene/i })

    expect(scene).toHaveAttribute('data-scene-status', 'fallback')
    expect(scene?.querySelector('canvas')).not.toBeInTheDocument()
    expect(hero).toHaveClass('hero--poster-visible')
    expect(sceneToggle).toBeDisabled()
  })
})
