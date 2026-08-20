/**
 * 旅程页（仪表盘结构）：主焦点是路线地图；数字行之后是成就印章带；
 * 计划与规则的长文全部收进折叠块，默认收起。
 */
import type { Mission, Program, Session } from '../core/types'
import { EXERCISES_BY_ID } from '../data/exercises'
import { ACHIEVEMENTS, achievementsOf, weekStreak } from '../core/stats'
import { MANIFEST, RULES_BY_ID, SOURCES_BY_ID } from '../knowledge'
import type { EvidenceLevel } from '../knowledge'
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

/** 「设计依据」展示的规则：计划与课表设计相关的核心条目（数据驱动，改知识库即改这里） */
const RATIONALE_RULE_IDS = [
  'KB-PLAN-01', // 低频有效剂量
  'KB-PLAN-04', // 每肌群 2-3 次/周
  'KB-SESSION-01', // 复合在前
  'KB-SESSION-04', // 每课含下肢+推+拉
  'KB-PROG-01', // 双进阶 RPE 门控
  'KB-PROG-02', // 增量分档
] as const

const EVIDENCE_LABEL: Record<EvidenceLevel, string> = {
  strong: '强证据',
  moderate: '中等',
  weak: '弱',
  inferred: '推断',
}

export function Journey({ mission, program, sessions, programs, sessionsDone }: Props) {
  const reviewDate = new Date(mission.reviewDate).toLocaleDateString('zh-CN')
  const progress = Math.min(1, sessionsDone / MISSION_TARGET)
  const nextCampAt = CAMPS.find((c) => c > progress)
  const toNextCamp = nextCampAt === undefined ? 0 : Math.ceil(nextCampAt * MISSION_TARGET) - sessionsDone
  const streak = weekStreak(sessions, program.weeklyRhythm.minViablePerWeek)
  const earned = new Set(achievementsOf(sessions, programs))

  return (
    <div className="journey">
      <header className="page-head">
        <p className="label">MISSION · {mission.title}</p>
        <div className="page-head-row">
          <h1 className="page-title">旅程</h1>
          <button type="button" className="ghost small print-btn" onClick={() => window.print()}>
            导出海报
          </button>
        </div>
      </header>

      <section className="route-hero">
        <ParkArt
          lit={progress}
          camps={CAMPS}
          label={`徒步路线，已点亮 ${sessionsDone} / ${MISSION_TARGET} 段`}
          caption={`MISSION · ${mission.title} · ${reviewDate} 复盘`}
        />
      </section>

      <section className="stat-line">
        <span className="stat-line-item">
          <span className="stat-line-value">{sessionsDone}</span>
          <span className="stat-line-label">/ {MISSION_TARGET} 次点亮</span>
        </span>
        {nextCampAt !== undefined && (
          <span className="stat-line-item">
            <span className="stat-line-value">{toNextCamp}</span>
            <span className="stat-line-label">次到下个营地</span>
          </span>
        )}
        <span className="stat-line-item">
          <span className="stat-line-value">{streak.current}</span>
          <span className="stat-line-label">周连击 · 最佳 {streak.best}</span>
        </span>
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

      <details className="fold">
        <summary>计划详情</summary>
        <div className="fold-body">
          <p className="body">
            每周 {program.weeklyRhythm.recommendedPerWeek} 次（最少 {program.weeklyRhythm.minViablePerWeek} 次）
            {mission.weeklyTarget !== undefined && ` · 你说想练 ${mission.weeklyTarget} 次`}
          </p>
          {program.sessions.map((s) => (
            <div key={s.id} className="session-card">
              <h2>{s.title}</h2>
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

          <div>
            <p className="label">设计依据</p>
            <ul className="kb-list">
              {RATIONALE_RULE_IDS.map((id) => {
                const rule = RULES_BY_ID[id]
                if (rule === undefined) return null
                const cited = rule.sources
                  .map((sid) => SOURCES_BY_ID[sid]?.citation ?? sid)
                  .join('；')
                return (
                  <li key={id} className="kb-item" title={cited}>
                    <span className={`kb-badge ${rule.evidence}`}>{EVIDENCE_LABEL[rule.evidence]}</span>
                    <span className="kb-text">{rule.statement}</span>
                  </li>
                )
              })}
            </ul>
            <p className="meta">依据与出处：知识库 v{MANIFEST.kbVersion}（{MANIFEST.createdAt} 落库）。</p>
          </div>
        </div>
      </details>

      <details className="fold">
        <summary>Mission 与规则</summary>
        <div className="fold-body">
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
          {mission.cautionAreas !== undefined && mission.cautionAreas.length > 0 && (
            <div>
              <p className="label">注意部位</p>
              <p className="body">{mission.cautionAreas.join('、')}</p>
            </div>
          )}
          <div>
            <p className="label">计划如何变化</p>
            <ul className="plain-list">
              {program.progressionRules.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
              {program.safetyConstraints.map((r, i) => (
                <li key={`s${i}`}>{r}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label">三个版本</p>
            <p className="body">
              完整 {program.variants.full.estimatedMinutes} / 短版 {program.variants.short.estimatedMinutes} / 恢复 {program.variants.recovery.estimatedMinutes} 分钟——都在主路上。
            </p>
          </div>
        </div>
      </details>

      {/* 打印海报的落款：屏幕上不显示，只在导出海报时出现 */}
      <footer className="print-foot">
        <span>PATH / FIELD</span>
        <span>{mission.title} · {sessionsDone} / {MISSION_TARGET}</span>
        <span>{new Date().toLocaleDateString('zh-CN')}</span>
      </footer>
    </div>
  )
}
