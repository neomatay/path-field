/**
 * 原创丝网印刷风景 + 徒步路线（移植自 park-poster-field-report-v0-2.html 的 canvas 引擎）。
 * 地图日记机制：路线按真实打卡进度点亮（lit 0..1），已完成的里程碑画成营地印章。
 * 地形永远完整存在，路线只是其中一段——进度不改变风景本身。
 */
import { useEffect, useRef } from 'react'

interface Props {
  /** 已点亮比例 0..1（按"记录了"计算，不按表现） */
  lit: number
  /** 已点亮的里程碑位置（0..1 数组），画成营地印章 */
  camps?: number[]
  seed?: number
  label?: string
  caption?: string
}

/** 路线采样点：两段贝塞尔曲线（与原型一致），从左下走向右上 */
function routePoints(w: number, h: number, n = 140): Array<[number, number]> {
  const pts: Array<[number, number]> = []
  const p0: [number, number] = [w * 0.23, h * 0.92]
  const c1: [number, number] = [w * 0.3, h * 0.84]
  const c2: [number, number] = [w * 0.42, h * 0.84]
  const p1: [number, number] = [w * 0.45, h * 0.75]
  const c3: [number, number] = [w * 0.49, h * 0.65]
  const c4: [number, number] = [w * 0.54, h * 0.66]
  const p2: [number, number] = [w * 0.57, h * 0.58]
  for (let i = 0; i <= n; i++) {
    const t = i / n
    if (t <= 0.5) {
      const s = t / 0.5
      pts.push(bezier(p0, c1, c2, p1, s))
    } else {
      const s = (t - 0.5) / 0.5
      pts.push(bezier(p1, c3, c4, p2, s))
    }
  }
  return pts
}

function bezier(p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number], t: number): [number, number] {
  const u = 1 - t
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ]
}

export function ParkArt({ lit, camps = [], seed = 30607, label, caption }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const ctx = canvas.getContext('2d')
    if (ctx === null) return

    const random = (index: number) => {
      const x = Math.sin(index * 12.9898 + seed) * 43758.5453
      return x - Math.floor(x)
    }
    const polygon = (points: Array<[number, number]>, color: string) => {
      ctx.fillStyle = color
      ctx.beginPath()
      points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      ctx.closePath()
      ctx.fill()
    }
    const tree = (x: number, base: number, height: number, color: string, index: number) => {
      const width = height * (0.17 + random(index) * 0.07)
      ctx.fillStyle = color
      ctx.fillRect(x - Math.max(1, width * 0.07), base - height * 0.16, Math.max(2, width * 0.14), height * 0.18)
      const layers = 5 + Math.floor(random(index + 4) * 3)
      for (let i = 0; i < layers; i++) {
        const y = base - height + (i * height * 0.68) / layers
        const half = (width * (i + 2)) / (layers + 2)
        polygon([[x, y], [x - half, y + height * 0.27], [x + half, y + height * 0.27]], color)
      }
    }

    const paint = () => {
      const box = canvas.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.floor(box.width * ratio))
      canvas.height = Math.max(1, Math.floor(box.height * ratio))
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      const w = box.width
      const h = box.height
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#087c80'
      ctx.fillRect(0, 0, w, h)

      // 四色有限油墨的风景：湖泊天色、两层山脊、间歇泉、树线、草甸、前景墨色
      polygon([[0, h * .7], [w * .15, h * .59], [w * .29, h * .63], [w * .46, h * .48], [w * .6, h * .59], [w * .75, h * .5], [w, h * .62], [w, h], [0, h]], '#2c6a49')
      polygon([[0, h * .76], [w * .21, h * .66], [w * .37, h * .74], [w * .54, h * .54], [w * .69, h * .7], [w * .86, h * .57], [w, h * .67], [w, h], [0, h]], '#1d523a')

      ctx.fillStyle = '#efe1bb'
      ctx.beginPath()
      ctx.moveTo(w * .59, h * .68)
      ctx.bezierCurveTo(w * .55, h * .53, w * .64, h * .48, w * .6, h * .31)
      ctx.bezierCurveTo(w * .56, h * .18, w * .67, h * .13, w * .63, h * .02)
      ctx.bezierCurveTo(w * .73, h * .18, w * .66, h * .35, w * .7, h * .47)
      ctx.bezierCurveTo(w * .72, h * .57, w * .65, h * .61, w * .69, h * .7)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#d7d1ac'
      for (let i = 0; i < 180; i++) {
        const rx = w * (.55 + random(i + 40) * .16)
        const ry = h * (.05 + random(i + 90) * .58)
        const radius = 1 + random(i + 3) * 3.8
        ctx.beginPath()
        ctx.arc(rx, ry, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      for (let i = 0; i < 49; i++) {
        const x = (i / 48) * w
        const base = h * (.64 + random(i + 100) * .095)
        const height = h * (.07 + random(i + 150) * .16)
        tree(x, base, height, i % 3 ? '#1b5139' : '#173d30', i + 200)
      }

      polygon([[0, h * .73], [w * .18, h * .67], [w * .35, h * .76], [w * .53, h * .69], [w * .7, h * .77], [w * .84, h * .68], [w, h * .74], [w, h], [0, h]], '#c87531')
      ctx.globalAlpha = 0.88
      for (let i = 0; i < 52; i++) {
        const y = h * (.75 + random(i + 400) * .22)
        const x = random(i + 420) * w
        const length = w * (.035 + random(i + 480) * .11)
        ctx.strokeStyle = i % 2 ? '#f2e4be' : '#eaa63c'
        ctx.lineWidth = 1.3
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(Math.min(w, x + length), y + (random(i + 500) - 0.5) * 6)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      polygon([[0, h * .86], [w * .2, h * .82], [w * .39, h * .88], [w * .57, h * .81], [w * .78, h * .87], [w, h * .82], [w, h], [0, h]], '#1d2a24')

      // ---- 徒步路线：地形先存在，路线后出现 ----
      const pts = routePoints(w, h)
      const clamped = Math.max(0, Math.min(1, lit))

      // 未走部分：浅虚影（路线永远可见，只是还没走到）
      ctx.strokeStyle = 'rgba(242, 228, 190, 0.35)'
      ctx.lineWidth = 2.1
      ctx.setLineDash([3, 5])
      ctx.beginPath()
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      ctx.stroke()
      ctx.setLineDash([])

      // 已走部分：sun 色实线
      if (clamped > 0) {
        const upto = Math.max(1, Math.floor(clamped * (pts.length - 1)))
        ctx.strokeStyle = '#eaa63c'
        ctx.lineWidth = 2.4
        ctx.beginPath()
        for (let i = 0; i <= upto; i++) {
          const [x, y] = pts[i]
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
        }
        ctx.stroke()

        // 当前位置：sun 圆点 + 墨芯
        const [cx, cy] = pts[upto]
        ctx.fillStyle = '#eaa63c'
        ctx.beginPath()
        ctx.arc(cx, cy, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#1d2a24'
        ctx.beginPath()
        ctx.arc(cx, cy, 2.5, 0, Math.PI * 2)
        ctx.fill()
      }

      // 营地印章：已到达的里程碑画纸色小帐篷/方印
      for (const c of camps) {
        if (c <= clamped + 1e-6) {
          const idx = Math.max(0, Math.min(pts.length - 1, Math.floor(c * (pts.length - 1))))
          const [x, y] = pts[idx]
          ctx.save()
          ctx.translate(x, y)
          ctx.fillStyle = '#f2e4be'
          ctx.strokeStyle = '#1d2a24'
          ctx.lineWidth = 1.4
          ctx.beginPath()
          ctx.moveTo(0, -7)
          ctx.lineTo(6, 5)
          ctx.lineTo(-6, 5)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
          ctx.restore()
        }
      }

      // 油墨颗粒：光栅材质层
      for (let i = 0; i < Math.floor((w * h) / 38); i++) {
        const x = random(i + 700) * w
        const y = random(i + 1000) * h
        ctx.fillStyle = i % 5 ? 'rgba(242,228,190,.09)' : 'rgba(29,42,36,.08)'
        const dot = random(i + 1300) < 0.86 ? 1 : 2
        ctx.fillRect(x, y, dot, dot)
      }
    }

    paint()
    const observer = new ResizeObserver(paint)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [lit, camps, seed])

  return (
    <figure className="park-art" role="img" aria-label={label ?? '国家公园风景与你的徒步路线'}>
      <canvas ref={canvasRef} />
      {caption !== undefined && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
