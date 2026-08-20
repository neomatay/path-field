/**
 * 线性图标（底部导航 / 主按钮用）：
 * 与画报风格一致——细线、圆头、currentColor，选中态只换颜色不换形。
 */
interface IconProps {
  size?: number
}

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

/** 今天：太阳（呼应 --sun 日晒黄） */
export function SunIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" />
    </svg>
  )
}

/** 旅程：两座山峰 + 一段徒步路线 */
export function PeaksIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M3 18.5 9.2 7.5l3.4 5.8" />
      <path d="M10.5 18.5 15 10.8l5.5 7.7z" />
      <circle cx="9.2" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** 记录：上升的柱状图（事实记录） */
export function ChartIcon({ size = 24 }: IconProps) {
  return (
    <svg {...base} width={size} height={size} aria-hidden="true">
      <path d="M4 19.5h16" />
      <path d="M7 16v-4" />
      <path d="M12 16V7.5" />
      <path d="M17 16V4.5" />
    </svg>
  )
}

/** 主按钮：播放三角 */
export function PlayIcon({ size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9 6.8c0-.9 1-1.5 1.8-1l7.5 4.5c.8.5.8 1.6 0 2.1l-7.5 4.5c-.8.5-1.8-.1-1.8-1z" />
    </svg>
  )
}
