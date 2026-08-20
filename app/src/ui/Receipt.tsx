/**
 * 单次收据：数字摘要（时长/组数/容量/平均RPE/与上次对比）+ 事实要点 + 新纪录印章
 * + 进阶候选（KB-PROG-02）：候选只是候选，采用与否是 Decision，由用户选择后落库。
 * 只陈述发生了什么，不做能力判断。
 */
import { useState } from 'react'
import type { Decision, Program, Session, UserChoice } from '../core/types'
import { EXERCISES_BY_ID } from '../data/exercises'
import { avgRpeOf, capacityOf, durationOf, newPRsOf, recordedSetsOf, type TopSet } from '../core/stats'
import { buildProgressionCandidates, maxRepsTargetsOf, type ProgressionCandidate } from '../core/rules/reviewRules'
import { uid } from '../store/usePath'

interface Props {
  session: Session
  history: Session[]
  program: Program
  onDone: () => void
  onDecide: (d: Decision) => void
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

/** 把一个进阶候选 + 用户选择固化为 Decision 落库（事实：你做了什么选择） */
function buildCandidateDecision(c: ProgressionCandidate, choice: UserChoice): Decision {
  const now = new Date().toISOString()
  return {
    id: uid(),
    createdAt: now,
    trigger: 'session-receipt',
    ruleId: 'KB-PROG-02',
    inputEvidenceIds: [],
    riskLevel: 'none',
    options: [
      { id: 'accepted', label: '采用', effect: c.reason, basedOnEvidenceIds: [], unknowns: [] },
      { id: 'deferred', label: '下次再说', effect: '本次不变，候选保留在记录里，下次仍可参考。', basedOnEvidenceIds: [], unknowns: [] },
      { id: 'declined', label: '不采用', effect: '下次维持当前负荷，不做此进阶。', basedOnEvidenceIds: [], unknowns: [] },
    ],
    // 不设 recommendedOptionId：是否采用由你决定，系统不替你选
    userChoice: choice,
    effectiveFrom: choice === 'accepted' ? now : undefined,
    followUpEvidence: [],
    explanation: c.reason,
  }
}

/** 单个候选的决策 UI：三选 chips；选定后显示结果，不可改（再改会以新 Decision 落库） */
function ProgressionDecision({
  candidate,
  choice,
  onChoose,
}: {
  candidate: ProgressionCandidate
  choice: UserChoice | undefined
  onChoose: (choice: UserChoice) => void
}) {
  const name = EXERCISES_BY_ID[candidate.exerciseId]?.name ?? candidate.exerciseId
  return (
    <div className="prog-decision">
      <p className="prog-reason">
        <strong>{name}</strong>：{candidate.reason}
      </p>
      {choice === undefined ? (
        <div className="parq-options">
          {CHOICES.map(({ choice: c, label }) => (
            <button
              key={c}
              type="button"
              className="chip"
              onClick={() => onChoose(c)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <p className="meta">已记录：{CHOICE_LABEL[choice]}。</p>
      )}
    </div>
  )
}

/** 候选决策三选（KB-PROG-02：采用由你决定） */
const CHOICES: Array<{ choice: UserChoice; label: string }> = [
  { choice: 'accepted', label: '采用' },
  { choice: 'deferred', label: '下次再说' },
  { choice: 'declined', label: '不采用' },
]

const CHOICE_LABEL: Record<UserChoice, string> = {
  accepted: '已采用',
  modified: '已修改',
  declined: '不采用',
  paused: '暂停',
  deferred: '下次再说',
}

export function Receipt({ session, history, program, onDone, onDecide }: Props) {
  const [choices, setChoices] = useState<Record<string, UserChoice>>({})
  const durationMin = durationOf(session)
  const sets = recordedSetsOf(session)
  const capacity = capacityOf(session)
  const avgRpe = avgRpeOf(session)

  const candidates = buildProgressionCandidates(
    [session, ...history.filter((s) => s.id !== session.id)],
    maxRepsTargetsOf(program),
  )

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

      {candidates.length > 0 && (
        <section>
          <p className="label">进阶候选 · 是否采用由你决定</p>
          {candidates.map((c) => (
            <ProgressionDecision
              key={c.exerciseId}
              candidate={c}
              choice={choices[c.exerciseId]}
              onChoose={(choice) => {
                setChoices((prev) => ({ ...prev, [c.exerciseId]: choice }))
                onDecide(buildCandidateDecision(c, choice))
              }}
            />
          ))}
        </section>
      )}

      <button type="button" className="primary" onClick={onDone}>回到今天</button>
    </div>
  )
}
