const WIDTH = 80
const HEIGHT = 28

// Decorative: the numbers are in the row's text, so assistive tech skips the line.
export function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null
  const min = Math.min(...points)
  const span = Math.max(...points) - min || 1
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * WIDTH
      const y = HEIGHT - ((p - min) / span) * HEIGHT
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg
      aria-hidden="true"
      data-testid="sparkline"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
    >
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
