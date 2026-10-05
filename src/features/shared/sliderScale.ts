export type SliderScale = { min: number; max: number; unit: string }

// The gesture works in 0-100; a scale maps that onto a real range and back.
export const fromPercent = ({ min, max }: SliderScale, percent: number) =>
  Math.round(min + ((max - min) * percent) / 100)
export const toPercent = ({ min, max }: SliderScale, value: number) =>
  Math.round(((value - min) / (max - min)) * 100)
