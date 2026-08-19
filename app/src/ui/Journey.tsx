/**
 * 旅程页：完整计划总览 —— Mission、每周节奏、每节课的意图与动作、
 * 完整/短版/恢复版各自保留什么、进阶候选与安全边界。
 * 顶部是地图日记：路线随真实打卡点亮，里程碑是营地印章。
 */
import type { Mission, Program } from '../core/types'
import { EXERCISES_BY_ID } from '../data/exercises'
import { ParkArt } from './ParkArt'

interface Props {
  mission: Mission
  program: Program
  /** 已记录的训练次数（含短版/恢复版——三个版本都是主路） */
  sessionsDone: number
}

/** Mission 目标：8 次记录走完这段路线（与 ADR-002 自用通过标准一致） */
const MISSION_TARGET = 8
/** 营地印章位置：第 4 次与第 8 次 */
const CAMPS = [4 / MISSION_TARGET, 1]

const VARIANT_INFO = [
  { kind: 'full' as const, label: '完整版', desc: '时间与状态都匹配时的完整训练。' },
  { kind: 'short' as const, label: '短版', desc: '时间不足时的主路：保留 Mission 关键动作与记录点，移除非关键容量。不是失败版。' },
  { kind: 'recovery' as const, label: '恢复版', desc: '不适、很疲劳或时间极少时的低压力选择：只做状态记录与轻度活动，可随时退出。' },
]

export function Journey({ mission, program, sessionsDone }: Props) {
  const reviewDate = new Date(mission.reviewDate).toLocaleDateString('zh-CN')
  const progress = Math.min(1, sessionsDone / MISSION_TARGET)
  const nextCampAt = CAMPS.find((c) => c > progress)
  const toNextCamp = nextCampAt === undefined ? 0 : Math.ceil(nextCampAt * MISSION_TARGET) - sessionsDone

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
            ? '路线已经画好，等你走出第一段。任何版本（完整/短版/恢复）都算点亮。'
            : nextCampAt === undefined
              ? '这段路线已经走完。复盘之后，下一段路线等你决定。'
              : `再记录 ${toNextCamp} 次到达下一个营地。中断不清零，路线不会消失。`}
        </p>
      </section>

      <section className="mission-stamp">
        <p className="label">当前 Mission · {reviewDate} 复盘</p>
        <h1>{mission.title}</h1>
        <p className="body">你的原话：{mission.userIntent}</p>
        <div className="stamp-rows">
          <div>
            <p className="label">成功证据</p>
            <ul>
              {mission.successEvidence.map((e, i) => (
                <li key={i}>
                  <span className={e.classification === 'fact' ? 'tag fact' : 'tag obs'}>
                    {e.classification === 'fact' ? '事实' : '观察'}
                  </span>
                  {e.statement}（{e.frequency}）
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label">不作为唯一裁判</p>
            <p className="body">{mission.notTheJudge.join('、')}</p>
          </div>
        </div>
      </section>

      <section>
        <p className="label">每周节奏</p>
        <p className="body">
          建议每周 {program.weeklyRhythm.recommendedPerWeek} 次，最少 {program.weeklyRhythm.minViablePerWeek} 次。
          少于建议不是失败；中断不清零、不补债。
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
            <p className="body">{v.kind === 'full' ? v.desc : program.variants[v.kind].keeps + '。' + v.desc}</p>
          </div>
        ))}
      </section>

      <section>
        <p className="label">计划如何变化</p>
        <ul className="plain-list">
          {program.progressionRules.map((r, i) => (
            <li key={i}>{r}——不自动生效，由你确认。</li>
          ))}
          {program.safetyConstraints.map((r, i) => (
            <li key={`s${i}`}>{r}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
