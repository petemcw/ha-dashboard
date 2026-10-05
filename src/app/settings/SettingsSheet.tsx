import type { ReactNode } from 'react'
import { BottomSheet } from '../../features/shared/BottomSheet'
import './SettingsSheet.css'

type SettingsSheetProps = { open: boolean; onClose: () => void; children?: ReactNode }

export function SettingsSheet({ open, onClose, children }: SettingsSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Settings">
      {children}
    </BottomSheet>
  )
}
