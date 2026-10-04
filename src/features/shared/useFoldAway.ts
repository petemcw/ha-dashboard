import { useLayoutEffect, useRef } from 'react'
import { foldAway } from './motion'
import { LEAVE_MS } from './useLeavingItems'

// A ref for an element that folds away (see foldAway) once `leaving` turns true. A layout
// effect, so the first leaving frame painted is already the start of the fold.
export function useFoldAway<T extends HTMLElement>(leaving: boolean) {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    if (leaving && ref.current) foldAway(ref.current, LEAVE_MS)
  }, [leaving])
  return ref
}
