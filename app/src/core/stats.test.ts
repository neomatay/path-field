import { describe, expect, it } from 'vitest'
import type { ActualBlock, Program, Session } from './types'
import {
  ACHIEVEMENTS,
  achievementsOf,
  avgRpeOf,
  bestTopSetOf,
  capacityOf,
  capacityTrend,
  durationOf,
  newPRsOf,
  recordedSetsOf,
  weekStreak,
  weeklyCapacity,
} from './stats'

function session(over: Partial<Session> & { id: string; startedAt: string }): Session {
  return {
    createdAt: over.startedAt,
    programId: null,
    plannedSessionId: null,
    outcome: 'completed',
    selectedVariant: 'full',
    actualBlocks: [],
    adjustments: [],
    checkOut: { discomfort: 'unknown' },
    safetyEvents: [],
    ...over,
  }
}

function block(exId: string, sets: Array<{ w?: number; r?: number; rpe?: number }>): ActualBlock {
  return {
    exerciseId: exId,
    sets: sets.map((s, i) => ({ setIndex: i, weightKg: s.w, reps: s.r, rpe: s.rpe })),
  }
}

const MONDAY = (() => {
  const d = new Date()
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  d.setHours(10, 0, 0, 0)
  return d
})()

function daysFromMonday(n: number): string {
  const d = new Date(MONDAY)
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

// ---------- 容量 ----------

describe('容量与摘要', () => {
  const s = session({
    id: 's1',
    startedAt: daysFromMonday(0),
    endedAt: new Date(Date.parse(daysFromMonday(0)) + 45 * 60000).toISOString(),
    actualBlocks: [
      block('leg-press', [{ w: 80, r: 10, rpe: 8 }, { w: 80, r: 10, rpe: 8 }]),
      block('hip-thrust', [{ w: 60, r: 12, rpe: 7 }]),
      block('lateral-raise', [{ r: 15 }]), // 自重不计容量
    ],
  })

  it('容量 = Σ(重量 x 次数)，自重不计', () => {
    expect(capacityOf(s)).toBe(80 * 10 * 2 + 60 * 12)
  })

  it('组数只算有次数的组', () => {
    expect(recordedSetsOf(s)).toBe(4)
  })

  it('平均 RPE', () => {
    expect(avgRpeOf(s)).toBeCloseTo((8 + 8 + 7) / 3)
  })

  it('时长（分钟）', () => {
    expect(durationOf(s)).toBe(45)
  })

  it('跳过的动作不计容量', () => {
    const skipped = session({
      id: 's2',
      startedAt: daysFromMonday(1),
      actualBlocks: [{ ...block('leg-press', [{ w: 100, r: 10 }]), skipped: true }],
    })
    expect(capacityOf(skipped)).toBe(0)
  })
})

describe('周容量与趋势', () => {
  it('近 4 周 vs 前 4 周', () => {
    const sessions = [
      // 5 周前（落在"前 4 周"窗口）：容量 1000
      session({ id: 'a', startedAt: daysFromMonday(-35), actualBlocks: [block('x', [{ w: 100, r: 10 }])] }),
      // 本周：容量 2000
      session({ id: 'b', startedAt: daysFromMonday(0), actualBlocks: [block('x', [{ w: 100, r: 20 }])] }),
    ]
    const trend = capacityTrend(sessions)
    expect(trend).toBeDefined()
    expect(trend!.recent).toBe(2000)
    expect(trend!.previous).toBe(1000)
    expect(trend!.deltaPct).toBe(100)
  })

  it('前 4 周为 0 时返回 undefined', () => {
    const sessions = [session({ id: 'b', startedAt: daysFromMonday(0), actualBlocks: [block('x', [{ w: 100, r: 20 }])] })]
    expect(capacityTrend(sessions)).toBeUndefined()
  })

  it('weeklyCapacity 输出连续 8 周', () => {
    const weeks = weeklyCapacity([], 8)
    expect(weeks).toHaveLength(8)
    expect(weeks[7].count).toBe(0)
  })
})

// ---------- PR ----------

describe('PR 检测', () => {
  it('bestTopSetOf 返回重量x次数最高的组', () => {
    const sessions = [
      session({ id: 'a', startedAt: daysFromMonday(-14), actualBlocks: [block('leg-press', [{ w: 80, r: 10 }])] }),
      session({ id: 'b', startedAt: daysFromMonday(-7), actualBlocks: [block('leg-press', [{ w: 85, r: 10 }])] }),
    ]
    const best = bestTopSetOf('leg-press', sessions)
    expect(best?.weightKg).toBe(85)
  })

  it('newPRsOf 检测本次刷新，历史只算之前的记录', () => {
    const before = [
      session({ id: 'a', startedAt: daysFromMonday(-14), actualBlocks: [block('leg-press', [{ w: 80, r: 10 }])] }),
    ]
    const today = session({ id: 'b', startedAt: daysFromMonday(0), actualBlocks: [block('leg-press', [{ w: 85, r: 10 }])] })
    const prs = newPRsOf(today, [...before, today])
    expect(prs).toHaveLength(1)
    expect(prs[0].exerciseId).toBe('leg-press')
  })

  it('没破纪录不产生 PR', () => {
    const before = [
      session({ id: 'a', startedAt: daysFromMonday(-14), actualBlocks: [block('leg-press', [{ w: 90, r: 10 }])] }),
    ]
    const today = session({ id: 'b', startedAt: daysFromMonday(0), actualBlocks: [block('leg-press', [{ w: 85, r: 10 }])] })
    expect(newPRsOf(today, [...before, today])).toHaveLength(0)
  })
})

// ---------- 周连击 ----------

describe('周连击（温和连击）', () => {
  it('连续达标周计数', () => {
    const sessions = [
      session({ id: 'a', startedAt: daysFromMonday(-14) }),
      session({ id: 'b', startedAt: daysFromMonday(-13) }),
      session({ id: 'c', startedAt: daysFromMonday(-7) }),
      session({ id: 'd', startedAt: daysFromMonday(-6) }),
    ]
    const streak = weekStreak(sessions, 2)
    expect(streak.current).toBe(2)
    expect(streak.best).toBe(2)
  })

  it('本周未达标不打断当前连击', () => {
    const sessions = [
      session({ id: 'a', startedAt: daysFromMonday(-7) }),
      session({ id: 'b', startedAt: daysFromMonday(-6) }),
    ]
    const streak = weekStreak(sessions, 2)
    expect(streak.current).toBe(1)
  })

  it('中间断一周后重新达标：best 记录最长段，current 从现在重数', () => {
    const sessions = [
      // 三周前 + 两周前：连续两周达标（best 段）
      session({ id: 'a', startedAt: daysFromMonday(-21) }),
      session({ id: 'b', startedAt: daysFromMonday(-20) }),
      session({ id: 'c', startedAt: daysFromMonday(-14) }),
      session({ id: 'd', startedAt: daysFromMonday(-13) }),
      // 上周空了一周，本周重新达标
      session({ id: 'e', startedAt: daysFromMonday(0) }),
      session({ id: 'f', startedAt: daysFromMonday(1) }),
    ]
    const streak = weekStreak(sessions, 2)
    expect(streak.current).toBe(1)
    expect(streak.best).toBe(2)
  })

  it('skipped 不计入连击', () => {
    const sessions = [
      session({ id: 'a', startedAt: daysFromMonday(-7), outcome: 'skipped' }),
    ]
    expect(weekStreak(sessions, 1).current).toBe(0)
  })
})

// ---------- 成就 ----------

describe('成就徽章', () => {
  const program: Program = {
    id: 'p1',
    missionId: 'm1',
    version: 1,
    createdAt: '',
    templateId: 'routine-ab',
    weeklyRhythm: { recommendedPerWeek: 2, minViablePerWeek: 1 },
    sessions: [],
    variants: {
      full: { kind: 'full', estimatedMinutes: 50, keeps: '', removed: '' },
      short: { kind: 'short', estimatedMinutes: 20, keeps: '', removed: '' },
      recovery: { kind: 'recovery', estimatedMinutes: 10, keeps: '', removed: '' },
    },
    progressionRules: [],
    safetyConstraints: [],
    rationale: '',
    status: 'active',
  }

  it('首发训练获得「出发」', () => {
    const got = achievementsOf([session({ id: 'a', startedAt: daysFromMonday(0) })], [program])
    expect(got).toContain('first-session')
    expect(got).not.toContain('first-short')
  })

  it('短版 / 恢复版各得徽章', () => {
    const sessions = [
      session({ id: 'a', startedAt: daysFromMonday(-7), selectedVariant: 'short' }),
      session({ id: 'b', startedAt: daysFromMonday(0), selectedVariant: 'recovery' }),
    ]
    const got = achievementsOf(sessions, [program])
    expect(got).toContain('first-short')
    expect(got).toContain('first-recovery')
  })

  it('同一计划 8 次记录 -> 走完一段', () => {
    const sessions = Array.from({ length: 8 }, (_, i) =>
      session({ id: `s${i}`, startedAt: daysFromMonday(-i * 2), programId: 'p1' }),
    )
    expect(achievementsOf(sessions, [program])).toContain('route-complete')
  })

  it('所有成就 id 唯一', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
