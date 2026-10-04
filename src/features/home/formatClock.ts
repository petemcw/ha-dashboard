// Card-sized times follow the browser's locale, like the header clock: the locale decides
// 12 or 24 hour. `locale` is for tests; the app leaves it out.

const parts = (d: Date, locale: string | undefined, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale, options).formatToParts(d)

const dayPeriod = (p: Intl.DateTimeFormatPart[]) =>
  p.find((x) => x.type === 'dayPeriod')?.value.toLowerCase()

// The digits and the lowercase am/pm marker (absent in 24 hour locales), apart, so the
// header can set the marker small beside large digits.
export function clockParts(d: Date, locale?: string): { digits: string; period?: string } {
  const p = parts(d, locale, { hour: 'numeric', minute: '2-digit' })
  const digits = p
    .filter((x) => x.type !== 'dayPeriod')
    .map((x) => x.value)
    .join('')
    .trim()
  return { digits, period: dayPeriod(p) }
}

// "6:52 pm" or "18:52": sunset, last backup. The am/pm marker, when the locale has one,
// is lowercase and spaced so it reads small beside the digits.
export function formatClock(d: Date, locale?: string): string {
  const { digits, period } = clockParts(d, locale)
  return period ? `${digits} ${period}` : digits
}

// "7p" or "19": the compact hour the hourly strip has room for.
export function formatHour(d: Date, locale?: string): string {
  const p = parts(d, locale, { hour: 'numeric' })
  const hour = p.find((x) => x.type === 'hour')?.value ?? ''
  const period = dayPeriod(p)
  return period ? `${hour}${period.charAt(0)}` : hour
}
