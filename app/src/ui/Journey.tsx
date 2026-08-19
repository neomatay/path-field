/**
 * 旅程页：路线地图 + 周连击 + 成就印章 + 计划总览。
 * 顶部是地图日记：路线随真实打卡点亮，里程碑是营地印章。
 */
import type { Mission, Program, Session } from '../core/types'
import { EXERCISES_BY_ID } from '../data/exercises'
import { ACHIEVEMENTS, achievementsOf, weekStreak } from '../core/stats'
import { ParkArt } from './ParkArt'

interface Props {
  mission: Mission
  program: Program
  sessions: Session[]
  programs: Program[]
  /** 当前计划内已记录的训练次数（三个版本都算点亮） */
  sessionsDone: number
}

/** Mission 目标：8 次记录走完这段路线（与 ADR-002 自用通过标准一致） */
const MISSION_TARGET = 8
/** 营地印章位置：第 4 次与第 8 次 */
const CAMPS = [4 / MISSION_TARGET, 1]

const VARIANT_INFO = [
  { kind: 'full' as const, label: '完整版', desc: '时间与状态都匹配时的完整训练。' },
  { kind: 'short' as const, label: '短版', desc: '保留关键动作与记录点。也是主路，不是失败版。' },
  { kind: 'recovery' as const, label: '恢复版', desc: '低压力选择：状态记录与轻度活动。' },
]

export function Journey({ mission, program, sessions, programs, sessionsDone }: Props) {
  const reviewDate = new Date(mission.reviewDate).toLocaleDateString('zh-CN')
  const progress = Math.min(1, sessionsDone / MISSION_TARGET)
  const nextCampAt = CAMPS.find((c) => c > progress)
  const toNextCamp = nextCampAt === undefined ? 0 : Math.ceil(nextCampAt * MISSION_TARGET) - sessionsDone

  const streak = weekStreak(sessions, program.weeklyRhythm.minViablePerWeek)
  const earned = new Set(achievementsOf(sessions, programs))

  return (
    <div className="journey">
      <section className="route-hero">
        <ParkArt
          lit={progress}
          camps={CAMPS}
          label={`徒步路线，已点亮 ${sessionsDone} / ${MISSION_TARGET} 段`}
          caption={`MISSION · ${mission.title} · 已记录 ${sessionsDone} / ${MISSION_TARGET} 次`}
        />
        <p className="body route-status">
          {sessionsDone === 0
            ? '路线已画好，走出第一段就算点亮（三个版本都算）。'
            : nextCampAt === undefined
              ? '这段路线走完了。复盘之后，下一段等你决定。'
              : `再记录 ${toNextCamp} 次到下一个营地。`}
        </p>
      </section>

      <section className="streak-row">
        <div className="stat">
          <span className="stat-value">{streak.current}</span>
          <span className="stat-label">周连击</span>
        </div>
        <div className="stat">
          <span className="stat-value">{streak.best}</span>
          <span className="stat-label">最佳</span>
        </div>
        <p className="body">
          每周完成 {program.weeklyRhythm.minViablePerWeek} 次即达标。断了随时重新出发，什么都不清零。
        </p>
      </section>

      <section>
        <p className="label">成就印章</p>
        <div className="stamp-strip">
          {ACHIEVEMENTS.map((a) => (
            <div key={a.id} className={earned.has(a.id) ? 'stamp earned' : 'stamp'}>
              <span className="stamp-name">{a.name}</span>
              <span className="stamp-hint">{a.hint}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mission-stamp">
        <p className="label">当前 Mission · {reviewDate} 复盘</p>
        <h1>{mission.title}</h1>
        {mission.goal !== undefined && <p className="body">目标：{mission.goal}</p>}
        <div className="stamp-rows">
          <div>
            <p className="label">成功证据</p>
            <ul>
              {mission.successEvidence.map((e, i) => (
                <li key={i}>
                  <span className={e.classification === 'fact' ? 'tag fact' : 'tag obs'}>
                    {e.classification === 'fact' ? '事实' : '观察'}
                  </span>
                  {e.statement}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label">不作为唯一裁判</p>
            <p className="body">{mission.notTheJudge.join('、')}</p>
          </div>
        </div>
        {mission.cautionAreas !== undefined && mission.cautionAreas.length > 0 && (
          <p className="body">注意部位：{mission.cautionAreas.join('、')}</p>
        )}
      </section>

      <section>
        <p className="label">每周节奏</p>
        <p className="body">
          建议每周 {program.weeklyRhythm.recommendedPerWeek} 次，最少 {program.weeklyRhythm.minViablePerWeek} 次。
          {mission.weeklyTarget !== undefined && `你说想练 ${mission.weeklyTarget} 次。`}
        </p>
      </section>

      <section>
        <p className="label">训练安排 · {program.sessions.length} 节</p>
        <div className="session-cards">
          {program.sessions.map((s) => (
            <div key={s.id} className="session-card">
              <h2>{s.title}</h2>
              <p className="body">{s.intent}</p>
              <ul>
                {s.blocks.map((b) => (
                  <li key={b.exerciseId}>
                    {EXERCISES_BY_ID[b.exerciseId]?.name ?? b.exerciseId}
                    <span className="meta"> · {b.targetSets} x {b.targetReps}{b.keyToMission ? ' · 关键' : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="label">三个版本都是主路</p>
        {VARIANT_INFO.map((v) => (
          <div key={v.kind} className="variant-info">
            <p className="variant-name">{v.label} · 约 {program.variants[v.kind].estimatedMinutes} 分钟</p>
            <p className="body">{v.desc}</p>
          </div>
        ))}
      </section>

      <section>
        <p className="label">计划如何变化</p>
        <ul className="plain-list">
          {program.progressionRules.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
          {program.safetyConstraints.map((r, i) => (
            <li key={`s${i}`}>{r}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
