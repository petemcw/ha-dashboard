// "6:52 pm": the card-sized time (sunset, last backup). Always 12-hour en-US with a
// lowercase marker, unlike the header clock, which follows the locale.
export function formatClock(d: Date): string {
  return d
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .replace(/\s?([AP])M$/, (_, m: string) => ` ${m.toLowerCase()}m`)
}
