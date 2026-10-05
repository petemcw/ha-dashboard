import { mdiHomeOutline } from '@mdi/js'
import { sensorViewModel } from '../../domains/sensor/viewModel'
import { useEntity } from '../../infrastructure/entities/useEntity'
import { SectionCard } from '../shared/SectionCard'
import { iconForHa } from '../shared/icons/haIcons'
import { STATUS_TEXT } from '../shared/statusText'
import { MediaPlayers } from './MediaPlayers'
import { RoomTile } from './RoomTile'
import { useSelectedRoom } from './useSelectedRoom'
import './RoomCard.css'

// One reading in the header. "Unavailable" and "Missing" are shown as such, never a guess.
function Reading({ entityId }: { entityId: string }) {
  const entity = useEntity(entityId)
  const sensor = sensorViewModel(entityId, entity)
  // °C and % hug the number, as HA writes them; other units get a space.
  const gap = sensor.unit && /^[°%]/.test(sensor.unit) ? '' : ' '
  const text =
    sensor.status === 'ok'
      ? `${entity!.state}${sensor.unit ? gap + sensor.unit : ''}`
      : STATUS_TEXT[sensor.status]
  return <span className="room-card__reading">{text}</span>
}

export function RoomCard() {
  const { resolved } = useSelectedRoom()
  if (resolved?.kind !== 'room') return null
  const { room } = resolved
  // Media players get rows and chips of their own, not tiles.
  const isPlayer = (id: string) => id.startsWith('media_player.')
  const tileIds = room.entityIds.filter((id) => !isPlayer(id))
  const playerIds = room.entityIds.filter(isPlayer)
  const readings = [room.temperatureEntityId, room.humidityEntityId].filter(
    (id): id is string => !!id,
  )
  return (
    <SectionCard
      title={room.name}
      icon={iconForHa(room.icon, mdiHomeOutline)}
      className="room-card"
      chip={
        readings.length > 0 && (
          <>
            {readings.map((id) => (
              <Reading key={id} entityId={id} />
            ))}
          </>
        )
      }
    >
      {tileIds.length > 0 && (
        <ul className="room-card__tiles">
          {tileIds.map((id) => (
            <RoomTile key={id} entityId={id} />
          ))}
        </ul>
      )}
      {playerIds.length > 0 && <MediaPlayers entityIds={playerIds} />}
    </SectionCard>
  )
}
