/**
 * 应用状态：从 IndexedDB 加载 Mission / Program / Session，提供创建与保存。
 * M2 范围：首次进入选模板 -> 生成 Mission + Program；训练会话的创建与保存。
 */
import { useCallback, useEffect, useState } from 'react'
import { getAll, put } from './db'
import { TEMPLATES, instantiateProgram, type ProgramTemplate } from '../data/templates'
import type { BodyMetric, Decision, Evidence, Mission, Program, Session } from '../core/types'

/** 入口追问的答案（可选填，跳过也允许） */
export interface OnboardingAnswers {
  goal?: string
  weeklyTarget?: number
  cautionAreas?: string[]
}

export function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const MISSION_TITLES: Record<ProgramTemplate['path'], { title: string; evidences: Mission['successEvidence'] }> = {
  returning: {
    title: '重新建立训练节奏',
    evidences: [
      { statement: '每周完成至少 1 次训练', classification: 'fact', frequency: '每周' },
      { statement: '关键动作形成第一条可比较记录', classification: 'observation', frequency: '每次训练' },
    ],
  },
  routine: {
    title: '稳定完成每周两次训练',
    evidences: [
      { statement: '每周完成 2 次训练（至少 1 次为短版亦可）', classification: 'fact', frequency: '每周' },
      { statement: 'A/B 关键动作积累可比较的工作组', classification: 'observation', frequency: '每次训练' },
    ],
  },
  progressing: {
    title: '补齐下肢与背部，积累可比较证据',
    evidences: [
      { statement: '每周完成 2-3 次计划训练', classification: 'fact', frequency: '每周' },
      { statement: '腿举 / 臀推 / 引体在相近条件下积累可比较工作组', classification: 'observation', frequency: '每次训练' },
    ],
  },
}

export function usePath() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([])
  const [evidences, setEvidences] = useState<Evidence[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    void (async () => {
      const [m, p, s, b, e, d] = await Promise.all([
        getAll<Mission>('missions'),
        getAll<Program>('programs'),
        getAll<Session>('sessions'),
        getAll<BodyMetric>('bodyMetrics'),
        getAll<Evidence>('evidence'),
        getAll<Decision>('decisions'),
      ])
      setMissions(m.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)))
      setPrograms(p)
      setSessions(s.sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt)))
      setBodyMetrics(b.sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt)))
      setEvidences(e.sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt)))
      setDecisions(d.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)))
      setLoaded(true)
    })()
  }, [])

  const activeMission = missions.find((m) => m.status === 'active')
  const activeProgram =
    activeMission === undefined
      ? undefined
      : programs.find((p) => p.status === 'active' && p.missionId === activeMission.id)

  /** 属于当前计划的训练记录（用于课次轮换与旅程进度；换计划后从头数） */
  const programSessions =
    activeProgram === undefined
      ? []
      : sessions.filter((s) => s.programId === activeProgram.id)

  const startWithTemplate = useCallback(async (template: ProgramTemplate, answers?: OnboardingAnswers) => {
    const now = new Date().toISOString()
    const missionId = uid()
    const meta = MISSION_TITLES[template.path]
    const mission: Mission = {
      id: missionId,
      createdAt: now,
      title: meta.title,
      userIntent: template.description,
      goal: answers?.goal,
      weeklyTarget: answers?.weeklyTarget,
      cautionAreas: answers?.cautionAreas,
      startDate: now,
      reviewDate: new Date(Date.now() + 28 * 86400000).toISOString(),
      successEvidence: meta.evidences,
      notTheJudge: ['体重', '连续训练天数'],
      timeAndEnvironment: '以当前可用的场地与时间执行，短版与恢复版均为计划内选择。',
      boundaries: ['标记不适的动作不作为加负荷依据。', 'urgent 信号时停止本计划。'],
      assumptions: ['当前节奏在你的时间里是可持续的。'],
      status: 'active',
    }
    const program: Program = {
      id: uid(),
      createdAt: now,
      ...instantiateProgram(template, missionId),
      status: 'active',
    }
    await put('missions', mission)
    await put('programs', program)
    setMissions((prev) => [mission, ...prev])
    setPrograms((prev) => [...prev, program])
  }, [])

  const saveSession = useCallback(async (s: Session) => {
    await put('sessions', s)
    setSessions((prev) => [s, ...prev.filter((x) => x.id !== s.id)].sort(
      (a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt),
    ))
  }, [])

  const saveBodyMetric = useCallback(async (b: BodyMetric) => {
    await put('bodyMetrics', b)
    setBodyMetrics((prev) => [b, ...prev.filter((x) => x.id !== b.id)].sort(
      (a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt),
    ))
  }, [])

  /** 落库一条证据（如 PAR-Q+ 筛查结果），事实只增不改 */
  const saveEvidence = useCallback(async (e: Evidence) => {
    await put('evidence', e)
    setEvidences((prev) => [e, ...prev.filter((x) => x.id !== e.id)].sort(
      (a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt),
    ))
  }, [])

  /** 落库一条决策（进阶采用/拒绝等）：候选只是候选，用户选择才成为事实 */
  const saveDecision = useCallback(async (d: Decision) => {
    await put('decisions', d)
    setDecisions((prev) => [d, ...prev.filter((x) => x.id !== d.id)].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    ))
  }, [])

  /** 更新 Mission（编辑目标/次数/注意部位）；创建事实与记录不动 */
  const saveMission = useCallback(async (m: Mission) => {
    await put('missions', m)
    setMissions((prev) => [m, ...prev.filter((x) => x.id !== m.id)].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    ))
  }, [])

  /** 下一次计划训练：按当前计划的完成次数轮换模板内的 session */
  const nextPlannedSessionId =
    activeProgram === undefined || activeProgram.sessions.length === 0
      ? undefined
      : activeProgram.sessions[programSessions.length % activeProgram.sessions.length].id

  /** 放弃当前计划、回到入口重新选路径。训练记录是事实，保留不动；Mission/Program 只归档不删除。 */
  const archiveActivePlan = useCallback(async () => {
    if (activeMission === undefined || activeProgram === undefined) return
    const archivedMission: Mission = { ...activeMission, status: 'replaced' }
    const archivedProgram: Program = { ...activeProgram, status: 'superseded' }
    await put('missions', archivedMission)
    await put('programs', archivedProgram)
    setMissions((prev) => prev.map((m) => (m.id === archivedMission.id ? archivedMission : m)))
    setPrograms((prev) => prev.map((p) => (p.id === archivedProgram.id ? archivedProgram : p)))
  }, [activeMission, activeProgram])

  return {
    loaded,
    missions,
    programs,
    sessions,
    bodyMetrics,
    evidences,
    programSessions,
    activeMission,
    activeProgram,
    nextPlannedSessionId,
    templateChoices: TEMPLATES,
    startWithTemplate,
    archiveActivePlan,
    saveSession,
    saveBodyMetric,
    saveEvidence,
    saveDecision,
    saveMission,
    decisions,
  }
}
