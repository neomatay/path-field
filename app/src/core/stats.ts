/**
 * 统计纯函数（PRD 2.3 进步分析 + 2.4 游戏化简版的本地实现）。
 * 只做事实聚合：容量、PR、周连击、成就。不产生能力判断——判断属于复盘。
 */

import type { ActualSet, Program, Session } from './types'

// ---------- 容量 ----------

/** 单次训练的总容量：Σ(重量 x 次数)。自重动作（无重量）不计入容量，只计入组数。 */
export function capacityOf(session: Session): number {
  return session.actualBlocks
    .filter((b) => !b.skipped)
    .flatMap((b) => b.sets)
    .reduce((sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0), 0)
}

/** 记录的组数（有次数的组才算） */
export function recordedSetsOf(session: Session): number {
  return session.actualBlocks
    .filter((b) => !b.skipped)
    .flatMap((b) => b.sets)
    .filter((s) => (s.reps ?? 0) > 0).length
}

/** 平均 RPE（有记录的组） */
export function avgRpeOf(session: Session): number | undefined {
  const rpes = session.actualBlocks
    .filter((b) => !b.skipped)
    .flatMap((b) => b.sets)
    .map((s) => s.rpe)
    .filter((r): r is number => r !== undefined)
  if (rpes.length === 0) return undefined
  return rpes.reduce((a, b) => a + b, 0) / rpes.length
}

/** 训练时长（分钟） */
export function durationOf(session: Session): number | undefined {
  return session.endedAt === undefined
    ? undefined
    : Math.max(1, Math.round((Date.parse(session.endedAt) - Date.parse(session.startedAt)) / 60000))
}

/** 按周聚合容量：key 为 ISO 周一日期字符串，value 为该周容量总和（含 sessions 数量） */
export function weeklyCapacity(sessions: Session[], weeks = 8): Array<{ weekStart: string; capacity: number; count: number }> {
  const byWeek = new Map<string, { capacity: number; count: number }>()
  for (const s of sessions) {
    const key = mondayOf(new Date(s.startedAt)).toISOString().slice(0, 10)
    const agg = byWeek.get(key) ?? { capacity: 0, count: 0 }
    agg.capacity += capacityOf(s)
    agg.count += 1
    byWeek.set(key, agg)
  }
  const out: Array<{ weekStart: string; capacity: number; count: number }> = []
  const thisMonday = mondayOf(new Date())
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(thisMonday)
    d.setDate(d.getDate() - i * 7)
    const key = d.toISOString().slice(0, 10)
    const agg = byWeek.get(key)
    out.push({ weekStart: key, capacity: agg?.capacity ?? 0, count: agg?.count ?? 0 })
  }
  return out
}

/** 近 4 周总容量 vs 前 4 周（±%）。前 4 周为 0 时返回 undefined（无法比较）。 */
export function capacityTrend(sessions: Session[]): { recent: number; previous: number; deltaPct: number } | undefined {
  const weeks = weeklyCapacity(sessions, 8)
  const recent = weeks.slice(4).reduce((a, w) => a + w.capacity, 0)
  const previous = weeks.slice(0, 4).reduce((a, w) => a + w.capacity, 0)
  if (previous === 0) return undefined
  return { recent, previous, deltaPct: Math.round(((recent - previous) / previous) * 100) }
}

function mondayOf(d: Date): Date {
  const out = new Date(d)
  const day = (out.getDay() + 6) % 7 // 周一=0
  out.setDate(out.getDate() - day)
  out.setHours(0, 0, 0, 0)
  return out
}

// ---------- PR ----------

export interface TopSet {
  weightKg?: number
  reps?: number
  date: string
}

/** 某动作的历史最佳 top-set（按重量 x 次数）。 */
export function bestTopSetOf(exerciseId: string, sessions: Session[]): TopSet | undefined {
  let best: TopSet | undefined
  for (const s of sessions) {
    for (const b of s.actualBlocks) {
      if (b.skipped || (b.exerciseId !== exerciseId && b.substitutedWithExerciseId !== exerciseId)) continue
      for (const set of b.sets) {
        if ((set.reps ?? 0) <= 0) continue
        if (best === undefined || score(set) > score({ weightKg: best.weightKg, reps: best.reps })) {
          best = { weightKg: set.weightKg, reps: set.reps, date: s.startedAt }
        }
      }
    }
  }
  return best
}

/** 本次 session 里是否刷新了某个动作的历史最佳（不含本次在内的历史）。 */
export function newPRsOf(session: Session, history: Session[]): Array<{ exerciseId: string; topSet: TopSet }> {
  const before = history.filter((s) => s.startedAt < session.startedAt)
  const out: Array<{ exerciseId: string; topSet: TopSet }> = []
  const seen = new Set<string>()
  for (const b of session.actualBlocks) {
    if (b.skipped || seen.has(b.exerciseId)) continue
    seen.add(b.exerciseId)
    for (const set of b.sets) {
      if ((set.reps ?? 0) <= 0) continue
      const prev = bestTopSetOf(b.exerciseId, before)
      if (prev === undefined || score(set) > score({ weightKg: prev.weightKg, reps: prev.reps })) {
        out.push({ exerciseId: b.exerciseId, topSet: { weightKg: set.weightKg, reps: set.reps, date: session.startedAt } })
        break
      }
    }
  }
  return out
}

function score(set: Pick<ActualSet, 'weightKg' | 'reps'>): number {
  return (set.weightKg ?? 0) * (set.reps ?? 0)
}

// ---------- 周连击（温和连击） ----------

/**
 * 连续每周达到 minViablePerWeek 的周数（当前连击与历史最佳）。
 * 中断不清零任何数据——连击只是计数，不是资产；断了就归零重数，路线与记录都在。
 */
export function weekStreak(sessions: Session[], minViablePerWeek: number): { current: number; best: number } {
  const valid = sessions.filter((s) => s.outcome !== 'skipped')
  const counts = new Map<string, number>()
  for (const s of valid) {
    const key = mondayOf(new Date(s.startedAt)).toISOString().slice(0, 10)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  if (counts.size === 0) return { current: 0, best: 0 }

  // 当前连击：从本周往回数（本周还没达标不打断，从上一个达标周起算）
  let current = 0
  let cursor = mondayOf(new Date())
  const thisWeek = counts.get(cursor.toISOString().slice(0, 10)) ?? 0
  if (thisWeek >= minViablePerWeek) current += 1
  cursor.setDate(cursor.getDate() - 7)
  while ((counts.get(cursor.toISOString().slice(0, 10)) ?? 0) >= minViablePerWeek) {
    current += 1
    cursor.setDate(cursor.getDate() - 7)
  }

  // 历史最佳：遍历所有达标周，找最长连续
  const sortedWeeks = [...counts.entries()]
    .filter(([, n]) => n >= minViablePerWeek)
    .map(([k]) => k)
    .sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const k of sortedWeeks) {
    if (prev !== null) {
      const gapDays = (Date.parse(k) - Date.parse(prev)) / 86400000
      run = gapDays <= 7.5 ? run + 1 : 1
    } else {
      run = 1
    }
    best = Math.max(best, run)
    prev = k
  }
  return { current, best: Math.max(best, current) }
}

// ---------- 成就徽章（营地印章） ----------

export interface AchievementDef {
  id: string
  name: string
  /** 达成条件的极短说明 */
  hint: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-session', name: '出发', hint: '完成第一次训练' },
  { id: 'first-short', name: '短版也是路', hint: '第一次用短版完成' },
  { id: 'first-recovery', name: '恢复日', hint: '第一次选择恢复版' },
  { id: 'route-complete', name: '走完一段', hint: '一个计划内记录 8 次' },
  { id: 'week-streak-4', name: '四周连击', hint: '连续 4 周达标' },
  { id: 'first-pr', name: '新纪录', hint: '第一次刷新动作最佳' },
  { id: 'fifty-sessions', name: '五十次', hint: '累计记录 50 次训练' },
]

/** 已获得的成就（由 sessions + programs 推导，不落库） */
export function achievementsOf(sessions: Session[], programs: Program[]): string[] {
  const got = new Set<string>()
  const valid = sessions.filter((s) => s.outcome !== 'skipped')
  if (valid.length >= 1) got.add('first-session')
  if (sessions.some((s) => s.selectedVariant === 'short' && s.outcome !== 'skipped')) got.add('first-short')
  if (sessions.some((s) => s.selectedVariant === 'recovery')) got.add('first-recovery')
  if (valid.length >= 50) got.add('fifty-sessions')

  // 任一计划内累计 8 次记录
  for (const p of programs) {
    if (sessions.filter((s) => s.programId === p.id && s.outcome !== 'skipped').length >= 8) {
      got.add('route-complete')
      break
    }
  }

  // 周连击 >= 4（任一计划的 minViable）
  const minViable = Math.max(1, ...programs.map((p) => p.weeklyRhythm.minViablePerWeek), 1)
  if (weekStreak(sessions, minViable).best >= 4) got.add('week-streak-4')

  // 有任何 PR（即历史上有过刷新：至少两次记录且存在提升）
  if (hasAnyPR(sessions)) got.add('first-pr')

  return ACHIEVEMENTS.filter((a) => got.has(a.id)).map((a) => a.id)
}

function hasAnyPR(sessions: Session[]): boolean {
  const sorted = [...sessions].sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt))
  for (let i = 1; i < sorted.length; i++) {
    if (newPRsOf(sorted[i], sorted.slice(0, i)).length > 0) return true
  }
  return false
}
