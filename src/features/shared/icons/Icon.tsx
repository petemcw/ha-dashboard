type IconProps = {
  // An `@mdi/js` path constant, imported by name so Vite can tree-shake it.
  path: string
  // Defaults to 1em so the surrounding CSS sizes the icon, like text.
  size?: number | string
  className?: string
  // Decorative unless titled: an icon next to a visible label shouldn't be announced twice.
  title?: string
}

export function Icon({ path, size = '1em', className, title }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d={path} />
    </svg>
  )
}
