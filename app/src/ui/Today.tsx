/**
 * 今天页（仪表盘结构）：主焦点是一键开始训练；状态签到是可选微调，不是门槛。
 * 签到未答时按默认条件推荐完整版；答了则规则引擎实时改推荐（睡眠不足→短版等）。
 * 安全底线不变：红旗信号下完整版不可用。
 */
import { useMemo, useState } from 'react'
import type { CurrentState, DiscomfortLevel, Program, Session, VariantKind } from '../core/types'
import { discomfortToSafetyInput, evaluateSafety } from '../core/rules/safety'
import { evaluateVariant } from '../core/rules/variant'
import { uid } from '../store/usePath'
import { EXERCISES_BY_ID } from '../data/exercises'
import { PlayIcon } from './icons'

const MINUTE_OPTIONS = [15, 25, 40, 60]
const READINESS_OPTIONS: Array<{ value: CurrentState['readiness']; label: string }> = [
  { value: 'low', label: '精力有限' },
  { value: 'ok', label: '一般' },
  { value: 'good', label: '可训练' },
]
const DISCOMFORT_OPTIONS: Array<{ value: DiscomfortLevel; label: string }> = [
  { value: 'none', label: '没有' },
  { value: 'noticeable', label: '明显不适' },
  { value: 'urgentSignal', label: '红旗信号' },
]
const SLEEP_OPTIONS: Array<{ value: 'lt6' | '6-7' | '7-8' | 'gt8'; label: string; hours: number }> = [
  { value: 'lt6', label: '< 6 小时', hours: 5 },
  { value: '6-7', label: '6-7 小时', hours: 6.5 },
  { value: '7-8', label: '7-8 小时', hours: 7.5 },
  { value: 'gt8', label: '8 小时+', hours: 8.5 },
]

const VARIANT_LABEL: Record<VariantKind, string> = {
  full: '完整版',
  short: '短版',
  recovery: '恢复版',
}

/** 页头日期标签：8月20日 · 周三 */
function todayLabel(): string {
  return new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

interface Props {
  program: Program
  nextPlannedSessionId?: string
  /** 本周已完成次数（用于数字条） */
  weekDone: number
  /** 当前周连击（用于数字条） */
  streakCurrent: number
  /** 本周还没记录体重时显示轻提示 */
  showBodyPrompt?: boolean
  onGoRecords?: () => void
  onStartTraining: (session: Session) => void
}

export function Today({ program, nextPlannedSessionId, weekDone, streakCurrent, showBodyPrompt, onGoRecords, onStartTraining }: Props) {
  const [availableMinutes, setMinutes] = useState<number | null>(null)
  const [readiness, setReadiness] = useState<CurrentState['readiness'] | null>(null)
  const [discomfort, setDiscomfort] = useState<DiscomfortLevel | null>(null)
  const [sleepBand, setSleepBand] = useState<'lt6' | '6-7' | '7-8' | 'gt8' | null>(null)
  const [chosen, setChosen] = useState<VariantKind | null>(null)

  const safety = useMemo(
    () =>
      discomfort === null
        ? null
        : evaluateSafety(discomfortToSafetyInput(discomfort)),
    [discomfort],
  )

  // 签到可选：未答的项用中性默认值，规则引擎作为推荐器而不是门槛
  const variant = useMemo(
    () =>
      evaluateVariant({
        riskLevel: safety?.riskLevel ?? 'none',
        availableMinutes: availableMinutes ?? program.variants.full.estimatedMinutes,
        fullVariantMinutes: program.variants.full.estimatedMinutes,
        readiness: readiness ?? 'ok',
        sleepBand: sleepBand ?? undefined,
      }),
    [safety, availableMinutes, readiness, sleepBand, program],
  )

  const planned =
    program.sessions.find((s) => s.id === nextPlannedSessionId) ?? program.sessions[0]

  const selectedVariant = chosen ?? variant.recommended
  const fullBlocked = selectedVariant === 'full' && safety?.riskLevel !== 'none'

  const start = () => {
    if (fullBlocked) return
    const now = new Date().toISOString()
    onStartTraining({
      id: uid(),
      createdAt: now,
      programId: program.id,
      plannedSessionId: planned?.id ?? null,
      startedAt: now,
      outcome: 'partial',
      selectedVariant,
      actualBlocks: [],
      adjustments:
        chosen !== null && chosen !== variant.recommended
          ? [{ type: 'variantChange', reason: undefined, source: 'user' }]
          : [],
      checkIn: {
        sleepHours: sleepBand === null ? undefined : SLEEP_OPTIONS.find((o) => o.value === sleepBand)?.hours,
        readiness: readiness ?? undefined,
        availableMinutes: availableMinutes ?? undefined,
      },
      checkOut: { discomfort: 'unknown' },
      safetyEvents: safety !== null && safety.riskLevel !== 'none' ? [safety.safetyCheck.ruleId] : [],
    })
  }

  const anyAnswered = availableMinutes !== null || readiness !== null || discomfort !== null || sleepBand !== null
  const minutes = program.variants[selectedVariant].estimatedMinutes

  return (
    <div className="today">
      <header className="page-head">
        <p className="label">{todayLabel()}</p>
        <h1 className="page-title">{planned?.title ?? '计划训练'}</h1>
      </header>

      <button type="button" className="hero-cta" onClick={start}>
        <span className="cta-icon">
          <PlayIcon size={20} />
        </span>
        <span className="cta-title">
          {selectedVariant === 'recovery' ? '开始恢复活动' : '开始训练'}
        </span>
        <span className="cta-sub">
          {VARIANT_LABEL[selectedVariant]} · 约 {minutes} 分钟
        </span>
      </button>

      {anyAnswered && (
        <p className="body" style={{ margin: 0 }}>{variant.reason}</p>
      )}
      {safety !== null && safety.riskLevel !== 'none' && (
        <p className={safety.riskLevel === 'urgent' ? 'safety urgent' : 'safety caution'}>
          {safety.message}
        </p>
      )}

      <section className="stat-line">
        <span className="stat-line-item">
          <span className="stat-line-value">{weekDone}</span>
          <span className="stat-line-label">本周 / {program.weeklyRhythm.recommendedPerWeek} 次</span>
        </span>
        <span className="stat-line-item">
          <span className="stat-line-value">{streakCurrent}</span>
          <span className="stat-line-label">周连击</span>
        </span>
        {showBodyPrompt === true && onGoRecords !== undefined && (
          <button type="button" className="ghost small stat-line-link" onClick={onGoRecords}>
            记体重
          </button>
        )}
      </section>

      <details className="fold">
        <summary>状态微调 · 可选</summary>
        <div className="fold-body">
          <section>
            <p className="label">今天可用时间</p>
            <div className="chips">
              {MINUTE_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={availableMinutes === m ? 'chip selected' : 'chip'}
                  aria-pressed={availableMinutes === m}
                  onClick={() => setMinutes(availableMinutes === m ? null : m)}
                >
                  {m} 分钟
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="label">精力自评</p>
            <div className="chips">
              {READINESS_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={readiness === o.value ? 'chip selected' : 'chip'}
                  aria-pressed={readiness === o.value}
                  onClick={() => setReadiness(readiness === o.value ? null : o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="label">昨晚睡了多久</p>
            <div className="chips">
              {SLEEP_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={sleepBand === o.value ? 'chip selected' : 'chip'}
                  aria-pressed={sleepBand === o.value}
                  onClick={() => setSleepBand(sleepBand === o.value ? null : o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="label">不适 / 风险</p>
            <div className="chips">
              {DISCOMFORT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={discomfort === o.value ? 'chip selected' : 'chip'}
                  aria-pressed={discomfort === o.value}
                  onClick={() => setDiscomfort(discomfort === o.value ? null : o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="label">版本</p>
            <div className="chips">
              {(['full', 'short', 'recovery'] as VariantKind[]).map((k) => {
                const blocked = k === 'full' && safety?.riskLevel !== 'none'
                return (
                  <button
                    key={k}
                    type="button"
                    disabled={blocked}
                    className={selectedVariant === k ? 'chip selected' : 'chip'}
                    onClick={() => setChosen(k)}
                  >
                    {VARIANT_LABEL[k]}
                    {variant.recommended === k ? ' · 推荐' : ''}
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      </details>

      {planned && (
        <details className="fold">
          <summary>今天练什么</summary>
          <div className="fold-body">
            <ul>
              {planned.blocks.map((b) => (
                <li key={b.exerciseId}>
                  {EXERCISES_BY_ID[b.exerciseId]?.name ?? b.exerciseId}
                  <span className="meta"> · {b.targetSets} x {b.targetReps}{b.keyToMission ? ' · 关键' : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}
    </div>
  )
}
