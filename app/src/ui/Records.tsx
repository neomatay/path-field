/**
 * 记录页（仪表盘结构）：顶部数字条 + 页内分类 tab（训练 / 身体 / 最佳）。
 * 只展示发生了什么的事实，不做能力判断——判断属于周复盘。
 */
import { useState } from 'react'
import type { BodyMetric, Program, Session } from '../core/types'
import { EXERCISES_BY_ID } from '../data/exercises'
import { uid } from '../store/usePath'
import { bestTopSetOf, capacityOf, capacityTrend, recordedSetsOf } from '../core/stats'

interface Props {
  sessions: Session[]
  programs: Program[]
  bodyMetrics: BodyMetric[]
  onSaveBodyMetric: (b: BodyMetric) => void
}

type SubTab = 'sessions' | 'body' | 'best'

/** 体重趋势迷你折线（纯 SVG，画报风格） */
function WeightSparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null
  const w = 220
  const h = 44
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w
      const y = h - 6 - ((p - min) / range) * (h - 12)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

export function Records({ sessions, programs, bodyMetrics, onSaveBodyMetric }: Props) {
  const [tab, setTab] = useState<SubTab>('sessions')
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [hip, setHip] = useState('')
  const [bodyFat, setBodyFat] = useState('')

  const trend = capacityTrend(sessions)
  const totalSets = sessions.reduce((a, s) => a + recordedSetsOf(s), 0)
  const totalCapacity = sessions.reduce((a, s) => a + capacityOf(s), 0)

  // 关键动作（所有计划里 keyToMission 的动作去重）
  const keyExerciseIds = [...new Set(
    programs.flatMap((p) => p.sessions.flatMap((s) => s.blocks.filter((b) => b.keyToMission).map((b) => b.exerciseId))),
  )]
  const keyPRs = keyExerciseIds
    .map((id) => ({ exerciseId: id, best: bestTopSetOf(id, sessions) }))
    .filter((x) => x.best !== undefined)

  const weights = bodyMetrics.map((b) => b.weightKg).filter((w): w is number => w !== undefined)
  const latest = bodyMetrics.length > 0 ? bodyMetrics[bodyMetrics.length - 1] : undefined

  const saveMetric = () => {
    if (weight === '' && waist === '' && hip === '' && bodyFat === '') return
    onSaveBodyMetric({
      id: uid(),
      recordedAt: new Date().toISOString(),
      weightKg: weight === '' ? undefined : Number(weight),
      waistCm: waist === '' ? undefined : Number(waist),
      hipCm: hip === '' ? undefined : Number(hip),
      bodyFatPct: bodyFat === '' ? undefined : Number(bodyFat),
    })
    setWeight(''); setWaist(''); setHip(''); setBodyFat('')
  }

  if (sessions.length === 0 && bodyMetrics.length === 0) {
    return (
      <div className="records">
        <header className="page-head">
          <p className="label">RECORDS</p>
          <h1 className="page-title">记录</h1>
        </header>
        <p className="body">还没有记录。完成第一次训练后，这里就是你的事实清单。</p>
      </div>
    )
  }

  const sorted = [...sessions].sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))

  return (
    <div className="records">
      <header className="page-head">
        <p className="label">RECORDS</p>
        <h1 className="page-title">记录</h1>
      </header>

      <section className="stat-line">
        <span className="stat-line-item">
          <span className="stat-line-value">{sorted.length}</span>
          <span className="stat-line-label">次训练</span>
        </span>
        <span className="stat-line-item">
          <span className="stat-line-value">{totalCapacity > 0 ? Math.round(totalCapacity) : '—'}</span>
          <span className="stat-line-label">累计容量 kg · {totalSets} 组</span>
        </span>
        <span className="stat-line-item">
          <span className="stat-line-value">
            {trend === undefined ? '—' : `${trend.deltaPct >= 0 ? '+' : ''}${trend.deltaPct}%`}
          </span>
          <span className="stat-line-label">近 4 周</span>
        </span>
      </section>

      <nav className="subtabs">
        {([['sessions', '训练'], ['body', '身体'], ['best', '最佳']] as Array<[SubTab, string]>).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={tab === key ? 'subtab selected' : 'subtab'}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'body' && (
        <section className="tab-panel">
          <div className="metric-form">
            <input type="number" inputMode="decimal" step={0.1} placeholder="体重 kg"
              value={weight} onChange={(e) => setWeight(e.target.value)} />
            <input type="number" inputMode="decimal" step={0.5} placeholder="腰围 cm"
              value={waist} onChange={(e) => setWaist(e.target.value)} />
            <input type="number" inputMode="decimal" step={0.5} placeholder="臀围 cm"
              value={hip} onChange={(e) => setHip(e.target.value)} />
            <input type="number" inputMode="decimal" step={0.1} placeholder="体脂 %"
              value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
            <button type="button" className="ghost small" onClick={saveMetric}>记录</button>
          </div>
          {weights.length >= 2 && <WeightSparkline points={weights} />}
          {latest !== undefined && (
            <p className="meta">
              {new Date(latest.recordedAt).toLocaleDateString('zh-CN')}
              {latest.weightKg !== undefined && ` · 体重 ${latest.weightKg}kg`}
              {latest.waistCm !== undefined && ` · 腰围 ${latest.waistCm}cm`}
              {latest.hipCm !== undefined && ` · 臀围 ${latest.hipCm}cm`}
              {latest.bodyFatPct !== undefined && ` · 体脂 ${latest.bodyFatPct}%`}
            </p>
          )}
        </section>
      )}

      {tab === 'best' && (
        <section className="tab-panel">
          {keyPRs.length === 0 ? (
            <p className="meta">关键动作还没有可比记录。</p>
          ) : (
            <ul className="pr-list">
              {keyPRs.map(({ exerciseId, best }) => (
                <li key={exerciseId}>
                  {EXERCISES_BY_ID[exerciseId]?.name ?? exerciseId}
                  <span className="meta">
                    {' '}{best!.weightKg !== undefined ? `${best!.weightKg}kg x ${best!.reps}` : `${best!.reps} 次`}
                    {' '}· {new Date(best!.date).toLocaleDateString('zh-CN')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'sessions' && sorted.map((s) => (
        <section key={s.id} className="record-card">
          <div className="record-head">
            <h2>{new Date(s.startedAt).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}</h2>
            <span className="meta">
              {variantLabel(s.selectedVariant)} · {outcomeLabel(s.outcome)}
              {s.endedAt !== undefined && (
                <> · {Math.max(1, Math.round((Date.parse(s.endedAt) - Date.parse(s.startedAt)) / 60000))} 分钟</>
              )}
              {capacityOf(s) > 0 && <> · 容量 {Math.round(capacityOf(s))}kg</>}
            </span>
          </div>

          <ul>
            {s.actualBlocks.map((b, i) => {
              if (b.skipped) {
                return (
                  <li key={i} className="meta">
                    {EXERCISES_BY_ID[b.exerciseId]?.name ?? b.exerciseId} —— 已跳过
                    {b.substitutedWithExerciseId !== undefined && '（替换后）'}
                  </li>
                )
              }
              const topSet = b.sets
                .filter((x) => (x.reps ?? 0) > 0)
                .sort((x, y) => (y.weightKg ?? 0) * (y.reps ?? 1) - (x.weightKg ?? 0) * (x.reps ?? 1))[0]
              if (topSet === undefined) {
                return (
                  <li key={i} className="meta">
                    {EXERCISES_BY_ID[b.exerciseId]?.name ?? b.exerciseId} —— 未记录组数
                  </li>
                )
              }
              const recorded = b.sets.filter((x) => (x.reps ?? 0) > 0).length
              return (
                <li key={i}>
                  {EXERCISES_BY_ID[b.exerciseId]?.name ?? b.exerciseId}
                  <span className="meta">
                    {' '}{recorded} 组 · 最高 {topSet.weightKg !== undefined ? `${topSet.weightKg}kg x ${topSet.reps}` : `${topSet.reps} 次`}
                    {topSet.rpe !== undefined ? ` @RPE${topSet.rpe}` : ''}
                  </span>
                </li>
              )
            })}
          </ul>

          {s.checkOut !== undefined && s.checkOut.discomfort !== 'none' && s.checkOut.discomfort !== 'unknown' && (
            <p className="meta note">结束时报告：{s.checkOut.discomfort === 'noticeable' ? '有不适' : '明显异常'}</p>
          )}
        </section>
      ))}
    </div>
  )
}

function variantLabel(v: Session['selectedVariant']): string {
  return v === 'full' ? '完整' : v === 'short' ? '短版' : v === 'recovery' ? '恢复' : '自由'
}

function outcomeLabel(o: Session['outcome']): string {
  return o === 'completed' ? '完成' : o === 'partial' ? '部分完成' : o === 'recovery' ? '恢复' : o === 'stoppedForSafety' ? '因安全停止' : '跳过'
}
