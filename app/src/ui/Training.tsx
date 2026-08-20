/**
 * 训练执行页：计时开始（进入即计时）+ 逐组记录重量/次数/RPE + 组完成勾选（勾完起组间歇倒计时）。
 * 动作要点、上次同条件表现参照、常显替换（点击立即切换，可换回）。
 * 短版只保留 keyToMission 的动作块；恢复版无负荷训练，只做状态记录。
 */
import { useEffect, useMemo, useState } from 'react'
import type { ActualBlock, DiscomfortLevel, Program, Session } from '../core/types'
import { EXERCISES_BY_ID, lastPerformance, regressionsFor, substitutionsFor } from '../data/exercises'

/** 组间歇默认 90 秒（惯例值，非证据结论）；可加 30 秒或直接跳过 */
const REST_SECONDS = 90

function fmtClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(h > 0 ? m : m).padStart(h > 0 ? 2 : 1, '0')
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}

interface Props {
  program: Program
  session: Session
  history: Session[]
  onChange: (s: Session) => void
  onFinish: () => void
}

function targetRepsOf(program: Program, exerciseId: string): string {
  const planned = program.sessions
    .flatMap((s) => s.blocks)
    .find((b) => b.exerciseId === exerciseId)
  return planned?.targetReps ?? '8-12'
}

export function Training({ program, session, history, onChange, onFinish }: Props) {
  // 短版 / 恢复版：只保留关键动作（恢复版无负荷训练，只做状态记录）
  const visibleBlocks = useMemo(() => {
    const planned = program.sessions.find((s) => s.id === session.plannedSessionId) ?? program.sessions[0]
    const blocks = planned?.blocks ?? []
    if (session.selectedVariant === 'short') {
      return blocks.filter((b) => b.keyToMission)
    }
    return blocks
  }, [program, session])

  const [blocks, setBlocks] = useState<ActualBlock[]>(() =>
    session.actualBlocks.length > 0
      ? session.actualBlocks
      : visibleBlocks.map((b) => ({
          exerciseId: b.exerciseId,
          plannedReps: b.targetReps,
          sets: Array.from({ length: b.targetSets }, (_, i) => ({ setIndex: i })),
        })),
  )
  const [discomfort, setDiscomfort] = useState<DiscomfortLevel>('none')

  // 训练中实时落库：每次改动都保存（endedAt 为空 = 进行中，刷新/锁屏后可从今天页续练）
  useEffect(() => {
    onChange({ ...session, actualBlocks: blocks, outcome: 'partial' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks])

  // 会话计时：进入训练即计时；间歇倒计时共用这 1 秒一跳的时钟
  const [now, setNow] = useState(() => Date.now())
  const [restUntil, setRestUntil] = useState<number | null>(null)
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])
  const elapsed = now - Date.parse(session.startedAt)
  const restLeft = restUntil === null ? null : restUntil - now

  // 间歇结束时提醒一次（视觉 + 设备震动，可用则用）
  const [restNotified, setRestNotified] = useState(false)
  useEffect(() => {
    if (restLeft !== null && restLeft <= 0 && !restNotified) {
      setRestNotified(true)
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.([120, 80, 120])
    }
  }, [restLeft, restNotified])

  const updateSet = (bi: number, si: number, patch: Partial<{ weightKg: number; reps: number; rpe: number }>) => {
    setBlocks((prev) =>
      prev.map((b, i) =>
        i !== bi ? b : { ...b, sets: b.sets.map((s, j) => (j !== si ? s : { ...s, ...patch })) },
      ),
    )
  }

  /** 勾选完成一组：记录完成时间并启动组间歇；再点取消勾选 */
  const toggleDone = (bi: number, si: number) => {
    const wasDone = blocks[bi]?.sets[si]?.doneAt !== undefined
    if (!wasDone) {
      setRestUntil(Date.now() + REST_SECONDS * 1000)
      setRestNotified(false)
    }
    setBlocks((prev) =>
      prev.map((b, i) =>
        i !== bi ? b : { ...b, sets: b.sets.map((s, j) => (j !== si ? s : { ...s, doneAt: wasDone ? undefined : new Date().toISOString() })) },
      ),
    )
  }

  const addSet = (bi: number) => {
    setBlocks((prev) =>
      prev.map((b, i) => (i !== bi ? b : { ...b, sets: [...b.sets, { setIndex: b.sets.length }] })),
    )
  }

  /** 点击替换立即切换；再点"换回"恢复原动作 */
  const substitute = (bi: number, newExerciseId: string) => {
    setBlocks((prev) =>
      prev.map((b, i) => {
        if (i !== bi) return b
        const original = b.substitutedWithExerciseId === undefined ? b.exerciseId : b.substitutedWithExerciseId
        if (newExerciseId === original) {
          return { ...b, exerciseId: original, substitutedWithExerciseId: undefined }
        }
        return { ...b, substitutedWithExerciseId: original, exerciseId: newExerciseId }
      }),
    )
  }

  const skip = (bi: number, reason: string) => {
    setBlocks((prev) => prev.map((b, i) => (i !== bi ? b : { ...b, skipped: true, skipReason: reason })))
  }

  const finish = () => {
    const recorded = blocks.filter((b) => !b.skipped && b.sets.some((s) => (s.reps ?? 0) > 0))
    const outcome: Session['outcome'] =
      recorded.length === 0 ? 'skipped' : recorded.length >= blocks.length ? 'completed' : 'partial'
    onChange({
      ...session,
      endedAt: new Date().toISOString(),
      outcome,
      actualBlocks: blocks,
      adjustments: [
        ...session.adjustments,
        ...blocks
          .filter((b) => b.skipped)
          .map((b) => ({ type: 'skip' as const, reason: b.skipReason, source: 'user' as const })),
        ...blocks
          .filter((b) => b.substitutedWithExerciseId !== undefined)
          .map((b) => ({
            type: 'substitution' as const,
            reason: `${EXERCISES_BY_ID[b.substitutedWithExerciseId!]?.name ?? ''} -> ${EXERCISES_BY_ID[b.exerciseId]?.name ?? ''}`,
            source: 'user' as const,
          })),
      ],
      checkOut: { discomfort, willingToContinue: discomfort === 'none' },
    })
    onFinish()
  }

  const isRecovery = session.selectedVariant === 'recovery'

  return (
    <div className="training">
      <header className="training-head">
        <div>
          <p className="label">
            {isRecovery ? '恢复活动' : session.selectedVariant === 'short' ? '短版训练' : '完整训练'}
          </p>
          <p className="body">
            {isRecovery ? '低压力活动，随时可结束。' : '练完一组点 ✓，间歇倒计时自动开始。'}
          </p>
        </div>
        <div className="session-timer" role="timer" aria-label="已训练时长">
          {fmtClock(elapsed)}
        </div>
      </header>

      {isRecovery ? (
        <section className="recovery-note">
          <p className="body">做点拉伸、泡沫轴或散步都可以。结束时标记一下状态。</p>
        </section>
      ) : (
        blocks.map((block, bi) => {
          const ex = EXERCISES_BY_ID[block.exerciseId]
          const originalId = block.substitutedWithExerciseId
          const last = lastPerformance(block.exerciseId, history)
          const subs = substitutionsFor(block.exerciseId)
          // 退阶链（regressionsFor）：同组里难度更低的变体，标出来方便状态差时降档
          const easierIds = new Set(regressionsFor(block.exerciseId).map((r) => r.id))
          return (
            <section key={bi} className={block.skipped ? 'block skipped' : 'block'}>
              <div className="block-head">
                <h2>{ex?.name ?? block.exerciseId}</h2>
                <span className="meta">目标 {block.plannedReps ?? targetRepsOf(program, block.exerciseId)}</span>
              </div>

              {ex?.cues && <p className="cues">{ex.cues}</p>}

              {last ? (
                <p className="last-ref">
                  上次：{last.weightKg !== undefined ? `${last.weightKg}kg x ${last.reps ?? '?'}` : `${last.reps ?? '?'} 次`}
                  {last.rpe !== undefined ? ` @RPE${last.rpe}` : ''}
                  （{new Date(last.date).toLocaleDateString('zh-CN')}）
                </p>
              ) : (
                ex?.startingHint && <p className="last-ref">{ex.startingHint}</p>
              )}

              {block.skipped ? (
                <p className="meta">
                  已跳过。
                  <button type="button" className="ghost small" onClick={() => setBlocks((prev) => prev.map((b, i) => (i !== bi ? b : { ...b, skipped: false, skipReason: undefined })))}>
                    恢复记录
                  </button>
                </p>
              ) : (
                <>
                  <div className="set-grid head">
                    <span>组</span><span>重量 kg</span><span>次数</span><span>RPE</span><span>完成</span>
                  </div>
                  {block.sets.map((s, si) => (
                    <div key={si} className={s.doneAt !== undefined ? 'set-grid done' : 'set-grid'}>
                      <span className="meta">{si + 1}</span>
                      <input
                        type="number" inputMode="decimal" min={0} step={2.5}
                        value={s.weightKg ?? ''} placeholder="—"
                        onChange={(e) => updateSet(bi, si, { weightKg: e.target.value === '' ? undefined : Number(e.target.value) })}
                      />
                      <input
                        type="number" inputMode="numeric" min={0}
                        value={s.reps ?? ''} placeholder={block.plannedReps ?? targetRepsOf(program, block.exerciseId)}
                        onChange={(e) => updateSet(bi, si, { reps: e.target.value === '' ? undefined : Number(e.target.value) })}
                      />
                      <input
                        type="number" inputMode="numeric" min={1} max={10}
                        value={s.rpe ?? ''} placeholder="—"
                        onChange={(e) => updateSet(bi, si, { rpe: e.target.value === '' ? undefined : Number(e.target.value) })}
                      />
                      <button
                        type="button"
                        className={s.doneAt !== undefined ? 'set-check checked' : 'set-check'}
                        aria-pressed={s.doneAt !== undefined}
                        aria-label={`第 ${si + 1} 组完成`}
                        onClick={() => toggleDone(bi, si)}
                      >
                        ✓
                      </button>
                    </div>
                  ))}
                  <div className="block-actions">
                    <button type="button" className="ghost" onClick={() => addSet(bi)}>加一组</button>
                    <button type="button" className="ghost" onClick={() => skip(bi, '个人选择')}>跳过</button>
                  </div>

                  <div className="subs">
                    <p className="meta">替换为：</p>
                    <div className="chips">
                      {originalId !== undefined && (
                        <button type="button" className="chip" onClick={() => substitute(bi, originalId)}>
                          换回 {EXERCISES_BY_ID[originalId]?.name}
                        </button>
                      )}
                      {subs.filter((sub) => sub.id !== originalId).map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          className={easierIds.has(sub.id) ? 'chip easier' : 'chip'}
                          onClick={() => substitute(bi, sub.id)}
                        >
                          {sub.name} · {sub.equipment}{easierIds.has(sub.id) ? ' · 更简单' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </section>
          )
        })
      )}

      <section>
        <p className="label">结束时身体状态</p>
        <div className="chips">
          {(['none', 'noticeable', 'urgentSignal'] as DiscomfortLevel[]).map((d) => (
            <button
              key={d}
              type="button"
              className={discomfort === d ? 'chip selected' : 'chip'}
              aria-pressed={discomfort === d}
              onClick={() => setDiscomfort(d)}
            >
              {d === 'none' ? '正常' : d === 'noticeable' ? '有不适' : '明显异常'}
            </button>
          ))}
        </div>
      </section>

      {/* 组间歇倒计时：勾完一组自动开始；固定在底部，随时可加时/跳过 */}
      {restLeft !== null && (
        <div className={restLeft <= 0 ? 'rest-bar finished' : 'rest-bar'} role="timer" aria-label="组间歇倒计时">
          {restLeft > 0 ? (
            <>
              <span className="rest-clock">{fmtClock(restLeft)}</span>
              <span className="rest-label">组间歇</span>
              <button type="button" className="ghost small" onClick={() => setRestUntil((r) => (r ?? now) + 30000)}>+30s</button>
              <button type="button" className="ghost small" onClick={() => setRestUntil(null)}>跳过</button>
            </>
          ) : (
            <>
              <span className="rest-clock">0:00</span>
              <span className="rest-label">间歇结束，可以开始下一组</span>
              <button type="button" className="ghost small" onClick={() => setRestUntil(null)}>知道了</button>
            </>
          )}
        </div>
      )}

      <button type="button" className="primary" onClick={finish}>结束训练</button>
    </div>
  )
}
