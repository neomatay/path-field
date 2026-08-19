/**
 * 记录页：全部历史训练，按时间倒序。
 * 只展示发生了什么（事实层），不做能力判断——判断属于周复盘。
 */
import type { Session } from '../core/types'
import { EXERCISES_BY_ID } from '../data/exercises'

interface Props {
  sessions: Session[]
}

export function Records({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="records">
        <section className="mission">
          <p className="label">记录</p>
          <h1>还没有训练记录</h1>
          <p className="body">
            第一次训练完成后会出现在这里。空着不是落后，只是还没开始。
          </p>
        </section>
      </div>
    )
  }

  const sorted = [...sessions].sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))

  return (
    <div className="records">
      <section className="mission">
        <p className="label">记录</p>
        <h1>{sorted.length} 次训练</h1>
        <p className="body">这里只有发生过的事实。趋势与判断在周复盘中出现。</p>
      </section>

      {sorted.map((s) => (
        <section key={s.id} className="record-card">
          <div className="record-head">
            <h2>{new Date(s.startedAt).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}</h2>
            <span className="meta">
              {variantLabel(s.selectedVariant)} · {outcomeLabel(s.outcome)}
              {s.endedAt !== undefined && (
                <> · {Math.max(1, Math.round((Date.parse(s.endedAt) - Date.parse(s.startedAt)) / 60000))} 分钟</>
              )}
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
            <p className="meta note">结束时报告：{s.checkOut.discomfort === 'noticeable' ? '有不适' : '明显异常'}（待确认，不是结论）</p>
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
