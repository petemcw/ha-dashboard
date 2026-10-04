// Late night reads as evening: "Good night" sounds like a sign-off on a wall screen.
export function greetingFor(date: Date): string {
  const hour = date.getHours()
  if (hour >= 4 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  return 'Good evening'
}
