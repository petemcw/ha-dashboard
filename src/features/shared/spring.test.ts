import { describe, expect, it } from 'vitest'
import { projectMomentum, rubberband, settleSpring, type SpringState } from './spring'

// Runs the spring at 60 fps until it settles and records every position.
function run(state: SpringState, target: number, damping: number) {
  const path: number[] = []
  let s = state
  for (let i = 0; i < 600 && !s.done; i++) {
    s = settleSpring(s, target, { damping, response: 0.35 }, 1 / 60)
    path.push(s.value)
  }
  return { final: s, path }
}

describe('spring', () => {
  it('settles on the target without overshooting when critically damped', () => {
    const { final, path } = run({ value: 400, velocity: 0, done: false }, 0, 1)
    expect(final.done).toBe(true)
    expect(final.value).toBe(0)
    expect(Math.min(...path)).toBeGreaterThanOrEqual(0)
  })

  it('overshoots a little when damped below 1', () => {
    const { path } = run({ value: 400, velocity: 0, done: false }, 0, 0.8)
    expect(Math.min(...path)).toBeLessThan(0)
  })

  it('keeps moving in the direction of the hand-off velocity first', () => {
    // At the target already, but thrown downward at 2000 px/s: it must travel down first.
    const { path } = run({ value: 0, velocity: 2000, done: false }, 0, 1)
    expect(Math.max(...path)).toBeGreaterThan(10)
  })

  it('settles within about a second at a 0.35 s response', () => {
    const { path } = run({ value: 400, velocity: 0, done: false }, 0, 1)
    expect(path.length).toBeLessThan(60)
  })
})

describe('gesture helpers', () => {
  it('projects a flick forward like scroll deceleration', () => {
    // 1000 px/s at the default 0.998 rate lands 499 px further on.
    expect(projectMomentum(1000)).toBeCloseTo(499, 0)
    expect(projectMomentum(-1000)).toBeCloseTo(-499, 0)
  })

  it('resists more the further it is pulled past the edge', () => {
    const near = rubberband(20, 600)
    const far = rubberband(200, 600)
    expect(near).toBeLessThan(20)
    expect(far).toBeLessThan(200)
    expect(far / 200).toBeLessThan(near / 20)
  })
})
