/**
 * 今天页：10 秒状态检查（时间 / 精力 / 睡眠 / 不适）-> 完整/短版/恢复版选择 -> 开始训练。
 * 依据契约 6 节：推荐区显示 ruleId 的用户可读理由、至少一个替代选项；
 * urgent 的状态不得显示开始完整训练。
 */
import { useMemo, useState } from 'react'
import type { CurrentState, DiscomfortLevel, Program, Session, VariantKind } from '../core/types'
import { discomfortToSafetyInput, evaluateSafety } from '../core/rules/safety'
import { evaluateVariant } from '../core/rules/variant'
import { uid } from '../store/usePath'
import { EXERCISES_BY_ID } from '../data/exercises'

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

interface Props {
  program: Program
  nextPlannedSessionId?: string
  /** 本周还没记录体重时显示一行轻提示 */
  showBodyPrompt?: boolean
  onGoRecords?: () => void
  onStartTraining: (session: Session) => void
}

export function Today({ program, nextPlannedSessionId, showBodyPrompt, onGoRecords, onStartTraining }: Props) {
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

  const variant = useMemo(
    () =>
      safety === null || availableMinutes === null || readiness === null
        ? null
        : evaluateVariant({
            riskLevel: safety.riskLevel,
            availableMinutes,
            fullVariantMinutes: program.variants.full.estimatedMinutes,
            readiness,
            sleepBand: sleepBand ?? undefined,
          }),
    [safety, availableMinutes, readiness, sleepBand, program],
  )

  const planned =
    program.sessions.find((s) => s.id === nextPlannedSessionId) ?? program.sessions[0]

  const checkDone = availableMinutes !== null && readiness !== null && discomfort !== null
  const selectedVariant = chosen ?? variant?.recommended ?? null
  const canStart =
    checkDone && selectedVariant !== null && !(selectedVariant === 'full' && safety?.riskLevel !== 'none')

  const start = () => {
    if (!canStart || selectedVariant === null) return
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
        chosen !== null && chosen !== variant?.recommended
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

  return (
    <div className="today">
      <section>
        <p className="label">今天的训练 · {planned?.title ?? '计划训练'}</p>
      </section>

      {/* 10 秒状态检查 */}
      <section>
        <p className="label">今天可用时间</p>
        <div className="chips">
          {MINUTE_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              className={availableMinutes === m ? 'chip selected' : 'chip'}
              aria-pressed={availableMinutes === m}
              onClick={() => setMinutes(m)}
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
              onClick={() => setReadiness(o.value)}
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
              onClick={() => setDiscomfort(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
        {safety !== null && safety.riskLevel !== 'none' && (
          <p className={safety.riskLevel === 'urgent' ? 'safety urgent' : 'safety caution'}>
            {safety.message}
          </p>
        )}
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

      {showBodyPrompt === true && onGoRecords !== undefined && (
        <p className="body body-prompt">
          本周还没记体重。
          <button type="button" className="ghost small" onClick={onGoRecords}>去记一笔</button>
        </p>
      )}

      {/* 版本选择（检查完成后出现） */}
      {checkDone && variant !== null && (
        <section className="variants">
          <p className="label">
            {VARIANT_LABEL[variant.recommended]} · {variant.ruleId}
          </p>
          <p className="body">{variant.reason}</p>
          <div className="variant-list">
            {(['full', 'short', 'recovery'] as VariantKind[])
              .filter((k) => variant.selectable.includes(k))
              .map((k) => {
                const blocked = k === 'full' && safety?.riskLevel !== 'none'
                const v = program.variants[k]
                return (
                  <button
                    key={k}
                    type="button"
                    disabled={blocked}
                    className={selectedVariant === k ? 'variant selected' : 'variant'}
                    onClick={() => setChosen(k)}
                  >
                    <span className="variant-name">
                      {VARIANT_LABEL[k]}
                      {variant.recommended === k && !blocked ? ' · 推荐' : ''}
                      {blocked ? ' · 今日不可用' : ''}
                    </span>
                    <span className="variant-meta">
                      约 {v.estimatedMinutes} 分钟 · 保留：{v.keeps}
                    </span>
                  </button>
                )
              })}
          </div>
          {variant.unknowns.length > 0 && (
            <p className="unknowns">仍不确定：{variant.unknowns.join('；')}</p>
          )}
        </section>
      )}

      <button type="button" className="primary" disabled={!canStart} onClick={start}>
        {selectedVariant === 'recovery'
          ? '开始恢复活动'
          : selectedVariant === 'short'
            ? `开始 20 分钟短版`
            : `开始完整训练 · 约 ${program.variants.full.estimatedMinutes} 分钟`}
      </button>

      {planned && (
        <section className="plan-preview">
          <p className="label">完整版动作</p>
          <ul>
            {planned.blocks.map((b) => (
              <li key={b.exerciseId}>
                {EXERCISES_BY_ID[b.exerciseId]?.name ?? b.exerciseId}
                <span className="meta"> · {b.targetSets} x {b.targetReps}{b.keyToMission ? ' · 关键' : ''}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
