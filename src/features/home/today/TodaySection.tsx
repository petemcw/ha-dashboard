import { useHomeConfig } from '../../../config/useHomeConfig'
import { sunViewModel } from '../../../domains/sun/viewModel'
import { weatherViewModel } from '../../../domains/weather/viewModel'
import { useEntity } from '../../../infrastructure/entities/useEntity'
import { useNow } from '../../../infrastructure/clock/clock'
import { useForecast } from '../../../infrastructure/ha/useForecast'
import { TodayCard } from './TodayCard'
import { todayViewModel } from './todayViewModel'

function TodayContent({ entityId, sunId }: { entityId: string; sunId: string }) {
  const weather = weatherViewModel(useEntity(entityId), entityId)
  const sun = sunViewModel(useEntity(sunId), sunId)
  const hourly = useForecast(entityId, 'hourly')
  const daily = useForecast(entityId, 'daily')
  const now = useNow()
  return <TodayCard vm={todayViewModel({ weather, sun, hourly, daily, now })} />
}

// Renders only when home.json has a weather section.
export function TodaySection() {
  const { weather } = useHomeConfig()
  return weather ? <TodayContent entityId={weather.entity_id} sunId={weather.sun} /> : null
}
