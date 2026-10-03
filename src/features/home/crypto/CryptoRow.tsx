import { crypto } from '../../../config/home'
import { useEntity } from '../../../infrastructure/entities/useEntity'
import { useHourlyMeans } from '../../../infrastructure/ha/useHourlyMeans'
import { cryptoViewModel } from './cryptoViewModel'
import { Sparkline } from './Sparkline'

const HISTORY_HOURS = 24
const STATISTIC_IDS = crypto.map((c) => c.entity_id)

function Coin({ symbol, entityId, means }: { symbol: string; entityId: string; means: number[] }) {
  const vm = cryptoViewModel(symbol, useEntity(entityId), means)
  return (
    <li className="crypto-coin" data-direction={vm.direction}>
      <span className="crypto-symbol">{vm.symbol}</span>{' '}
      <span className="crypto-price">{vm.missing ? 'Missing' : vm.price}</span>
      {vm.changeText && (
        <>
          {' '}
          <span className="crypto-change">{vm.changeText}</span>
        </>
      )}
      <Sparkline points={vm.points} />
    </li>
  )
}

export function CryptoRow() {
  const means = useHourlyMeans(STATISTIC_IDS, HISTORY_HOURS)
  return (
    <section aria-label="Crypto">
      <ul className="crypto-row">
        {crypto.map((c) => (
          <Coin
            key={c.symbol}
            symbol={c.symbol}
            entityId={c.entity_id}
            means={means[c.entity_id] ?? []}
          />
        ))}
      </ul>
    </section>
  )
}
