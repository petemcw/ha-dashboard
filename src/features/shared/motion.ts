export function prefersReducedMotion() {
  // jsdom has no matchMedia; no matchMedia means no preference.
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

// Matches the transition durations under .theme-changing in base.css.
const THEME_EASE_MS = 250
let themeEaseTimer: ReturnType<typeof setTimeout> | undefined

// Applies a theme change with every colour on the page easing to its new value, so it isn't
// a full-screen brightness jump. Plain CSS transitions rather than a view transition: a
// view transition sends every tap to <html> while it runs, which locks the page out.
// Transitions start from the after-change style, so adding the class in the same frame as
// the change is enough. With reduced motion the change just happens.
export function easeThemeChange(apply: () => void) {
  if (prefersReducedMotion()) {
    apply()
    return
  }
  const root = document.documentElement
  root.classList.add('theme-changing')
  apply()
  clearTimeout(themeEaseTimer)
  themeEaseTimer = setTimeout(() => root.classList.remove('theme-changing'), THEME_EASE_MS)
}

// Whether exit animations should run: the Web Animations API exists (jsdom has none) and
// the person hasn't asked for less motion.
export function canAnimate() {
  return typeof Element.prototype.animate === 'function' && !prefersReducedMotion()
}

// Fades an element out while folding its height, padding, and the flex gap it sits in down
// to nothing, so whatever follows slides up into its place instead of jumping. The caller
// removes the element once `duration` has passed; `fill: forwards` holds it folded until
// then. A grid parent's gap can't be pulled shut by a negative margin, a flex one's can.
export function foldAway(el: HTMLElement, duration: number) {
  const style = getComputedStyle(el)
  const parent = el.parentElement && getComputedStyle(el.parentElement)
  const gap = parent?.display.includes('flex') ? parseFloat(parent.rowGap) || 0 : 0
  const closeGap =
    gap === 0
      ? {}
      : el.nextElementSibling
        ? { marginBottom: `${-gap}px` }
        : el.previousElementSibling
          ? { marginTop: `${-gap}px` }
          : {}
  el.animate(
    [
      {
        height: `${el.offsetHeight}px`,
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
        opacity: 1,
      },
      {
        height: '0px',
        paddingTop: '0px',
        paddingBottom: '0px',
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
        opacity: 0,
        ...closeGap,
      },
    ],
    { duration, easing: 'cubic-bezier(0.3, 0, 0.2, 1)', fill: 'forwards' },
  )
}
