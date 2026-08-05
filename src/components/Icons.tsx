// Minimal inline SVG icons, 18x18 default, currentColor stroke.

const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const IconRead = () => (
  <svg {...base}>
    <path d="M4 4h6a2 2 0 0 1 2 2v14" />
    <path d="M20 4h-6a2 2 0 0 0-2 2v14" />
    <path d="M4 4v14h8" />
    <path d="M20 4v14h-8" />
  </svg>
)

export const IconVocab = () => (
  <svg {...base}>
    <path d="M4 19V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2Z" />
    <path d="M8 7h7" />
    <path d="M8 11h7" />
  </svg>
)

export const IconChart = () => (
  <svg {...base}>
    <path d="M4 20V10" />
    <path d="M10 20V4" />
    <path d="M16 20v-7" />
    <path d="M22 20H2" />
  </svg>
)

export const IconSun = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)

export const IconMoon = () => (
  <svg {...base}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
)

export const IconMonitor = () => (
  <svg {...base}>
    <rect x="2" y="4" width="20" height="14" rx="2" />
    <path d="M8 22h8M12 18v4" />
  </svg>
)

export const IconArrowLeft = () => (
  <svg {...base} width={14} height={14}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

export const IconEye = () => (
  <svg {...base} width={14} height={14}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const IconEyeOff = () => (
  <svg {...base} width={14} height={14}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-6.5 0-10-7-10-7a17.7 17.7 0 0 1 3.2-4.6" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a17.36 17.36 0 0 1-2.16 3.19" />
    <path d="M1 1l22 22" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
  </svg>
)
