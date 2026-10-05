// A small spring for gesture-driven motion, in Apple's terms: `damping` is the damping
// ratio (1 = no overshoot, below 1 bounces) and `response` is roughly how long it takes
// to get there, in seconds. Unlike a CSS transition it starts from wherever the element
// is, carries the finger's velocity, and can be grabbed and redirected mid-flight.

export type SpringParams = { damping: number; response: number }
export type SpringState = { value: number; velocity: number; done: boolean }

const STEP = 1 / 240
const REST_DISTANCE = 0.5
const REST_VELOCITY = 10

export function settleSpring(
  state: SpringState,
  target: number,
  { damping, response }: SpringParams,
  dt: number,
): SpringState {
  const stiffness = ((2 * Math.PI) / response) ** 2
  const friction = (4 * Math.PI * damping) / response
  let { value, velocity } = state
  // Fixed small substeps keep the integration stable whatever the frame rate.
  for (let t = 0; t < dt; t += STEP) {
    const h = Math.min(STEP, dt - t)
    velocity += (-stiffness * (value - target) - friction * velocity) * h
    value += velocity * h
  }
  if (Math.abs(value - target) < REST_DISTANCE && Math.abs(velocity) < REST_VELOCITY) {
    return { value: target, velocity: 0, done: true }
  }
  return { value, velocity, done: false }
}

// Where a flick would come to rest, like scroll deceleration (Apple's projection).
export function projectMomentum(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate)
}

// Past an edge, follow the finger less and less instead of stopping dead.
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  const resisted =
    (Math.abs(overshoot) * dimension * constant) / (dimension + constant * Math.abs(overshoot))
  return Math.sign(overshoot) * resisted
}

export type SpringAnimation = { stop: () => SpringState }

// Drives a spring on animation frames. `stop` returns the live state, so the next
// gesture or animation can pick up from exactly where this one is.
export function animateSpring(
  from: SpringState,
  target: number,
  params: SpringParams,
  onUpdate: (value: number) => void,
  onDone?: () => void,
): SpringAnimation {
  let state: SpringState = { ...from, done: false }
  let last = performance.now()
  let frame = 0
  const tick = (now: number) => {
    // Cap the step so a backgrounded tab doesn't jump the spring when it wakes.
    state = settleSpring(state, target, params, Math.min((now - last) / 1000, 1 / 20))
    last = now
    onUpdate(state.value)
    if (state.done) onDone?.()
    else frame = requestAnimationFrame(tick)
  }
  if (Math.abs(from.value - target) < REST_DISTANCE && Math.abs(from.velocity) < REST_VELOCITY) {
    onUpdate(target)
    onDone?.()
    return { stop: () => ({ value: target, velocity: 0, done: true }) }
  }
  frame = requestAnimationFrame(tick)
  return {
    stop: () => {
      cancelAnimationFrame(frame)
      return state
    },
  }
}
