import { createContext } from 'react'
import type { HomeConfig } from './homeConfig'

export const HomeConfigContext = createContext<HomeConfig | null>(null)
