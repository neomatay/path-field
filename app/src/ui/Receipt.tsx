/**
 * 单次收据：数字摘要（时长/组数/容量/平均RPE/与上次对比）+ 事实要点 + 新纪录印章。
 * 只陈述发生了什么，不做能力判断。
 */
import type { Session } from '../core/types'
import { EXERCISES_BY_ID } from '../data/exercises'
import { avgRpeOf, capacityOf, durationOf, newPRsOf, recordedSetsOf, type TopSet } from '../core/stats'

interface Props {
  session: Session
  history: Session[]
  onDone: () => void
}

function topSetOf(session: Session, exerciseId: string): TopSet | undefined {
  const block = session.actualBlocks.find((b) => b.exerciseId === exerciseId && !b.skipped)
  if (!block) return undefined
  return block.sets
    .filter((s) => (s.reps ?? 0) > 0)
    .reduce<TopSet | undefined>(
      (best, s) =>
        best === undefined || (s.weightKg ?? 0) * (s.reps ?? 1) > (best.weightKg ?? 0) * (best.reps ?? 1)
          ? { weightKg: s.weightKg, reps: s.reps, date: session.startedAt }
          : best,
      undefined,
    )
}

export function Receipt({ session, history, onDone }: Props) {
  const durationMin = durationOf(session)
  const sets = recordedSetsOf(session)
  const capacity = capacityOf(session)
  const avgRpe = avgRpeOf(session)

  const recorded = session.actualBlocks.filter((b) => !b.skipped && b.sets.some((s) => (s.reps ?? 0) > 0))
  const skipped = session.actualBlocks.filter((b) => b.skipped)
  const prs = newPRsOf(session, history)

  // 与上次同类训练（同 plannedSessionId、含负荷记录）的容量对比
  const sameType = history.filter(
    (s) => s.id !== session.id && s.plannedSessionId === session.plannedSessionId && capacityOf(s) > 0,
  )
  const lastSame = sameType.sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))[0]
  const lastCapacity = lastSame === undefined ? undefined : capacityOf(lastSame)
  const deltaPct =
    capacity > 0 && lastCapacity !== undefined && lastCapacity > 0
      ? Math.round(((capacity - lastCapacity) / lastCapacity) * 100)
      : undefined

  return (
    <div className="receipt">
      <header>
        <p className="label">训练收据</p>
        <h1>已记录</h1>
      </header>

      <section className="stat-row">
        <div className="stat">
          <span className="stat-value">{durationMin ?? '—'}</span>
          <span className="stat-label">分钟</span>
        </div>
        <div className="stat">
          <span className="stat-value">{sets}</span>
          <span className="stat-label">组</span>
        </div>
        <div className="stat">
          <span className="stat-value">{capacity > 0 ? Math.round(capacity) : '—'}</span>
          <span className="stat-label">容量 kg</span>
        </div>
        <div className="stat">
          <span className="stat-value">{avgRpe !== undefined ? avgRpe.toFixed(1) : '—'}</span>
          <span className="stat-label">平均 RPE</span>
        </div>
      </section>

      {deltaPct !== undefined && (
        <p className="body">
          容量比上次同类训练{deltaPct >= 0 ? ` +${deltaPct}%` : ` ${deltaPct}%`}。
        </p>
      )}

      {prs.length > 0 && (
        <section className="pr-stamps">
          {prs.map((p) => (
            <div key={p.exerciseId} className="pr-stamp">
              <span className="pr-name">新纪录</span>
              <span className="meta">
                {EXERCISES_BY_ID[p.exerciseId]?.name ?? p.exerciseId}
                {p.topSet.weightKg !== undefined ? ` ${p.topSet.weightKg}kg x ${p.topSet.reps}` : ` ${p.topSet.reps} 次`}
              </span>
            </div>
          ))}
        </section>
      )}

      {recorded.length > 0 && (
        <section>
          <p className="label">动作</p>
          <ul className="evidence">
            {recorded.map((b) => {
              const top = topSetOf(session, b.exerciseId)
              return (
                <li key={b.exerciseId} className="fact">
                  <span className="marker ring" />
                  {EXERCISES_BY_ID[b.exerciseId]?.name ?? b.exerciseId}
                  {top !== undefined && (
                    <span className="meta">
                      {' '}· {top.weightKg !== undefined ? `${top.weightKg}kg x ${top.reps}` : `${top.reps} 次`}
                    </span>
                  )}
                </li>
              )
            })}
            {skipped.map((b) => (
              <li key={b.exerciseId} className="fact">
                <span className="marker ring" />
                {EXERCISES_BY_ID[b.exerciseId]?.name ?? b.exerciseId}
                <span className="meta"> · 已跳过</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {session.checkOut.discomfort === 'noticeable' && (
        <p className="safety caution">结束时报告了不适：相关动作下次不作为加重依据。</p>
      )}
      {session.checkOut.discomfort === 'urgentSignal' && (
        <p className="safety urgent">结束时报告了异常信号：请暂停高强度训练，必要时寻求专业支持。</p>
      )}

      <button type="button" className="primary" onClick={onDone}>回到今天</button>
    </div>
  )
}
