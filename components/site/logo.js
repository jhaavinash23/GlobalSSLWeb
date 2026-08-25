// GlobalSSLWeb brand logo — SVG-native so it scales sharp everywhere.
// Usage:
//   <Logo />                         — full logo (mark + wordmark)
//   <Logo variant="dark" />          — for dark backgrounds (admin sidebar / hero)
//   <Logo size={36} />               — resize mark; wordmark scales proportionally
//   <LogoMark size={32} />           — icon only, for tight spaces / avatars
//
// The mark is a rounded square in the brand gradient (blue → sky) with a white
// inner shield holding a checkmark stroked in the same gradient. Reads as
// "secure / verified" at any size.

import { cn } from '@/lib/utils'

export function LogoMark({ size = 36, className = '', gradientId }) {
  // Unique gradient id per instance so multiple logos on a page don't collide
  const gid = gradientId || `gssl-lg-${Math.random().toString(36).slice(2, 8)}`
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={cn('shrink-0 drop-shadow-[0_4px_10px_rgba(37,99,235,0.25)]', className)}
      aria-label="GlobalSSLWeb"
      role="img"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
      {/* Background rounded square */}
      <rect x="0" y="0" width="40" height="40" rx="11" fill={`url(#${gid})`} />
      {/* Outer shield glow */}
      <path
        d="M20 7 L30 11 V21 C30 27 25.5 31 20 33 C14.5 31 10 27 10 21 V11 L20 7 Z"
        fill="white"
        fillOpacity="0.18"
      />
      {/* Inner white shield */}
      <path
        d="M20 10 L27.5 13 V21 C27.5 25.5 23.5 28.5 20 30 C16.5 28.5 12.5 25.5 12.5 21 V13 L20 10 Z"
        fill="white"
      />
      {/* Verified check */}
      <path
        d="M15.75 20.5 L19 23.5 L24.5 18"
        stroke={`url(#${gid})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export default function Logo({
  size = 36,
  variant = 'light',
  showText = true,
  className = '',
  wordmarkClassName = '',
}) {
  const dark = variant === 'dark'
  const wordmarkSize = size >= 40 ? 'text-lg' : size >= 32 ? 'text-[15px]' : 'text-sm'
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={size} />
      {showText && (
        <span
          className={cn(
            'font-semibold tracking-tight leading-none',
            wordmarkSize,
            dark ? 'text-white' : 'text-slate-900',
            wordmarkClassName,
          )}
        >
          GlobalSSL<span className={dark ? 'text-blue-400' : 'text-blue-600'}>Web</span>
        </span>
      )}
    </div>
  )
}
