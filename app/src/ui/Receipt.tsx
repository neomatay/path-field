/**
 * 单次收据：先事实，再有限观察，再待确认（契约 6.1 顺序）。
 * 单次训练只产生"发生了什么"的事实；不宣称能力或体型变化。
 */
import type { Session } from '../core/types'
import { EXERCISES_BY_ID } from '../data/exercises'

interface Props {
  session: Session
  onDone: () => void
}

function topSetOf(session: Session, exerciseId: string) {
  const block = session.actualBlocks.find((b) => b.exerciseId === exerciseId && !b.skipped)
  if (!block) return undefined
  return block.sets
    .filter((s) => (s.reps ?? 0) > 0)
    .reduce<typeof block.sets[number] | undefined>(
      (best, s) =>
        best === undefined || (s.weightKg ?? 0) * (s.reps ?? 1) > (best.weightKg ?? 0) * (best.reps ?? 1)
          ? s
          : best,
      undefined,
    )
}

export function Receipt({ session, onDone }: Props) {
  const durationMin =
    session.endedAt !== undefined
      ? Math.max(1, Math.round((Date.parse(session.endedAt) - Date.parse(session.startedAt)) / 60000))
      : null

  const recorded = session.actualBlocks.filter((b) => !b.skipped && b.sets.some((s) => (s.reps ?? 0) > 0))
  const skipped = session.actualBlocks.filter((b) => b.skipped)

  const facts: string[] = [
    durationMin !== null ? `训练时长约 ${durationMin} 分钟。` : '训练已结束（未记录时长）。',
    recorded.length > 0
      ? `记录了 ${recorded.length} 个动作：${recorded
          .map((b) => {
            const top = topSetOf(session, b.exerciseId)
            const name = EXERCISES_BY_ID[b.exerciseId]?.name ?? b.exerciseId
            return top !== undefined ? `${name}（最高 ${top.weightKg ?? '?'}kg x ${top.reps ?? '?'}）` : name
          })
          .join('、')}。`
      : '本次没有负荷训练记录。',
    ...skipped.map((b) => `${EXERCISES_BY_ID[b.exerciseId]?.name ?? b.exerciseId}被跳过（${b.skipReason ?? '个人选择'}），意图保留。`),
    session.checkOut.discomfort === 'noticeable'
      ? '结束时报告了不适：相关动作下次不作为加重依据。'
      : session.checkOut.discomfort === 'urgentSignal'
        ? '结束时报告了异常信号：请暂停高强度训练，必要时寻求专业支持。'
        : '结束时无不适报告。',
  ]

  const observations: string[] =
    recorded.length > 0
      ? ['本次记录已保存，并将在与相近条件的历史记录比较后进入周复盘。']
      : ['选择不训练也被记录为一次有效决定，不清零、不欠债。']

  const toConfirm: string[] = [
    '单次训练不足以判断能力或体型变化。',
    '本次表现与上次是否可比，取决于动作与主观难度是否相近（周复盘时呈现）。',
  ]

  return (
    <div className="receipt">
      <header>
        <p className="label">阶段现场记录 · 单次</p>
        <h1>已记录</h1>
      </header>

      <section>
        <p className="label">事实</p>
        <ul className="evidence">
          {facts.map((f, i) => (
            <li key={i} className="fact"><span className="marker ring" />{f}</li>
          ))}
        </ul>
      </section>

      <section>
        <p className="label">有限观察</p>
        <ul className="evidence">
          {observations.map((o, i) => (
            <li key={i} className="observation"><span className="marker ring-dot" />{o}</li>
          ))}
        </ul>
      </section>

      <section>
        <p className="label">仍待确认</p>
        <ul className="evidence">
          {toConfirm.map((t, i) => (
            <li key={i} className="toconfirm"><span className="marker diamond" />{t}</li>
          ))}
        </ul>
      </section>

      <p className="body next-step">
        下一步：两天后同类训练前，仍需重新确认今天的状态；系统不会自动为你加重。
      </p>

      <button type="button" className="primary" onClick={onDone}>回到今天</button>
    </div>
  )
}
