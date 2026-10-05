import { mdiCurrencyBtc } from '@mdi/js'
import { memo, useMemo } from 'react'
import { useHomeConfig } from '../../../config/useHomeConfig'
import { useEntity } from '../../../infrastructure/entities/useEntity'
import { useHourlyMeans } from '../../../infrastructure/ha/useHourlyMeans'
import { SectionCard } from '../../shared/SectionCard'
import { cryptoViewModel } from './cryptoViewModel'
import { Sparkline } from './Sparkline'
import './CryptoRow.css'

const HISTORY_HOURS = 24

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
      <span className="crypto-spark">
        <Sparkline points={vm.points} />
      </span>
    </li>
  )
}

function CryptoRowContent() {
  const { crypto } = useHomeConfig()
  const statisticIds = useMemo(() => crypto.map((c) => c.entity_id), [crypto])
  const means = useHourlyMeans(statisticIds, HISTORY_HOURS)
  return (
    <SectionCard
      title="Crypto"
      icon={mdiCurrencyBtc}
      className="crypto"
      // The period the change and the sparkline cover.
      chip={<span className="crypto__period">{HISTORY_HOURS} h</span>}
    >
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
    </SectionCard>
  )
}

// HomeScreen re-renders on every clock tick and attention change; this section reads
// neither, so it only re-renders for its own data.
export const CryptoRow = memo(CryptoRowContent)
