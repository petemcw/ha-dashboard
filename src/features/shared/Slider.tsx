import type { SliderGesture } from './useSliderGesture'
import { fromPercent, type SliderScale } from './sliderScale'
import './Slider.css'

type SliderProps = {
  gesture: SliderGesture
  label: string
  disabled?: boolean
  // The real range the 0-100 gesture maps onto (Kelvin), exposed to assistive tech.
  scale?: SliderScale
  // The real value to read while nobody is dragging: the 0-100 gesture is rounded to whole
  // percents of the range, which would misreport HA's exact value.
  restingValue?: number
  // Overrides the spoken value (the light is off, so there's no value to read).
  valueText?: string
}

// The accessible, keyboard-operable slider with a fill showing the value. It doesn't take
// pointer input itself (pointer events pass through to whatever sits under it); the gesture's
// `surface` handlers go on the element people drag.
export function Slider({ gesture, label, disabled, scale, restingValue, valueText }: SliderProps) {
  const { shown, keyboard } = gesture
  const now = scale
    ? !gesture.active && restingValue !== undefined
      ? restingValue
      : fromPercent(scale, shown)
    : shown
  return (
    <div
      role="slider"
      className="slider"
      aria-label={label}
      aria-orientation="horizontal"
      aria-valuemin={scale?.min ?? 0}
      aria-valuemax={scale?.max ?? 100}
      aria-valuenow={now}
      aria-valuetext={valueText ?? (scale ? `${now}${scale.unit}` : `${shown}%`)}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      data-dragging={gesture.dragging ? '' : undefined}
      {...keyboard}
    >
      <div className="slider-fill" style={{ transform: `scaleX(${shown / 100})` }} />
    </div>
  )
}

// The slider as a bar of its own to drag across (on a tile, the tile itself is the surface).
export function SliderTrack(slider: SliderProps) {
  return (
    <div className="slider-track" {...slider.gesture.frame} {...slider.gesture.surface}>
      <Slider {...slider} />
    </div>
  )
}
