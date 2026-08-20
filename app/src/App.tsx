import { useEffect, useState } from 'react'
import './App.css'
import { downloadSnapshot, exportSnapshot } from './store/db'
import { usePath, uid, type OnboardingAnswers } from './store/usePath'
import type { ProgramTemplate } from './data/templates'
import type { Session } from './core/types'
import { weekStreak } from './core/stats'
import { Today } from './ui/Today'
import { Training } from './ui/Training'
import { Receipt } from './ui/Receipt'
import { Journey } from './ui/Journey'
import { Records } from './ui/Records'
import { Parq } from './ui/Parq'
import { ChartIcon, PeaksIcon, SunIcon } from './ui/icons'

type Screen = 'today' | 'journey' | 'records' | 'training' | 'receipt'

/** 主 tab 走 hash 路由（#/today · #/journey · #/records）：可后退、可分享、重开回到原页 */
function screenFromHash(): Screen {
  const h = window.location.hash.replace(/^#\/?/, '')
  return h === 'journey' || h === 'records' ? h : 'today'
}

const TEMPLATE_LABEL: Record<ProgramTemplate['path'], string> = {
  returning: '我中断了一段时间，想重新开始',
  routine: '我有意愿，想建立每周两次的节奏',
  progressing: '我已有规律训练，想补短板并看懂进步',
}

const GOAL_OPTIONS = ['减脂', '增肌', '塑形', '体能', '更健康的感觉']
const WEEKLY_OPTIONS = [1, 2, 3]
const CAUTION_OPTIONS = ['无', '膝', '腰', '肩', '其他']

/** 底部导航：图标 + 文字，对应 app 的三个核心功能区 */
const TABS = [
  { key: 'today', label: '今天', Icon: SunIcon },
  { key: 'journey', label: '旅程', Icon: PeaksIcon },
  { key: 'records', label: '记录', Icon: ChartIcon },
] as const

function App() {
  const {
    loaded, activeMission, activeProgram, nextPlannedSessionId, sessions, programs,
    programSessions, missions, bodyMetrics, templateChoices, startWithTemplate,
    archiveActivePlan, saveSession, saveBodyMetric, evidences, saveEvidence,
    saveDecision, saveMission, decisions,
  } = usePath()
  const [screen, setScreenState] = useState<Screen>(screenFromHash)

  // 浏览器后退 / 前进时跟随 hash
  useEffect(() => {
    const onHash = () => setScreenState(screenFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  /** 切页：主 tab 同步写 hash（产生历史记录，可后退）；训练 / 收据是临时流程，不进历史 */
  const setScreen = (s: Screen) => {
    setScreenState(s)
    if (s === 'today' || s === 'journey' || s === 'records') {
      window.location.hash = `#/${s}`
    }
  }
  const [draft, setDraft] = useState<Session | null>(null)
  const [pendingTemplate, setPendingTemplate] = useState<ProgramTemplate | null>(null)
  const [pendingAnswers, setPendingAnswers] = useState<OnboardingAnswers | null>(null)
  const [confirmSwitch, setConfirmSwitch] = useState(false)
  const hasHistory = missions.length > 0

  const onExport = async () => {
    downloadSnapshot(await exportSnapshot())
  }

  if (!loaded) {
    return <div className="app"><p className="body">加载本地数据…</p></div>
  }

  /** PAR-Q+ 一次性筛查（KB-ASSESS-01）：做过一次就不再出现 */
  const parqDone = evidences.some((e) => e.kind === 'screening')
  const saveParq = (answers: boolean[]) => {
    const positives = answers.filter((v) => v).length
    void saveEvidence({
      id: uid(),
      kind: 'screening',
      classification: 'fact',
      statement:
        positives === 0
          ? '参与前筛查（PAR-Q+）：7 项均为「否」。'
          : `参与前筛查（PAR-Q+）：${positives} 项「是」，已建议咨询医生，未拦截训练。`,
      value: positives,
      unit: '项',
      recordedAt: new Date().toISOString(),
      sourceRecordIds: [],
      confidence: 'direct',
      scope: 'mission',
    })
  }

  // ---------- 入口：选路径 -> 三个快问 -> 看完整计划再开始 ----------
  if (activeMission === undefined || activeProgram === undefined) {
    if (pendingTemplate !== null && pendingAnswers === null) {
      return (
        <div className="app">
          <header className="topline">
            <span className="label">PATH / FIELD</span>
            <span className="label">v0.2 M2</span>
          </header>
          <main className="stage">
            <QuickQuestions
              onSubmit={(answers) => setPendingAnswers(answers)}
              onBack={() => setPendingTemplate(null)}
            />
          </main>
        </div>
      )
    }

    if (pendingTemplate !== null && pendingAnswers !== null) {
      const preview = templatePreview(pendingTemplate)
      return (
        <div className="app">
          <header className="topline">
            <span className="label">PATH / FIELD</span>
            <span className="label">v0.2 M2</span>
          </header>
          <main className="stage">
            <section className="mission">
              <p className="label">计划预览</p>
              <h1>{preview.title}</h1>
              {pendingAnswers.goal !== undefined && <p className="body">目标：{pendingAnswers.goal}</p>}
            </section>
            <JourneyPreviewSection template={pendingTemplate} />
            <section className="entry-actions">
              <button
                type="button"
                className="primary"
                onClick={() => {
                  void startWithTemplate(pendingTemplate, pendingAnswers)
                  setPendingTemplate(null)
                  setPendingAnswers(null)
                  setScreen('journey')
                }}
              >
                确认开始这份计划
              </button>
              <button type="button" className="ghost" onClick={() => setPendingAnswers(null)}>
                返回改答案
              </button>
            </section>
          </main>
        </div>
      )
    }

    return (
      <div className="app">
        <header className="topline">
          <span className="label">PATH / FIELD</span>
          <span className="label">v0.2 M2</span>
        </header>
        <main className="stage">
          {!parqDone ? (
            <Parq onSubmit={(answers) => saveParq(answers)} />
          ) : (
            <>
              <section className="mission entry-hero">
            <p className="label">从这里开始</p>
            <h1>先看清整份计划，<br />再决定今天练什么</h1>
            <p className="body">选一个起点，先看完整计划再开始。</p>
          </section>
          <p className="label entry-q">你现在在哪里？</p>
          {templateChoices.map((t, i) => (
            <button key={t.templateId} type="button" className="path-card" onClick={() => setPendingTemplate(t)}>
              <span className="path-no">{String(i + 1).padStart(2, '0')}</span>
              <span className="path-body">
                <span className="path-name">{TEMPLATE_LABEL[t.path]}</span>
                <span className="variant-meta">{t.description}</span>
                <span className="path-meta">
                  每周 {t.weeklyRhythm.recommendedPerWeek} 次 · 最少 {t.weeklyRhythm.minViablePerWeek} 次 · {t.sessions.length} 节课
                  {t.sessions.length > 1 ? '轮换' : ''}
                </span>
              </span>
            </button>
          ))}
          <p className="body entry-note">
            随时可换路径，记录不删。
            {hasHistory ? '之前的记录都还在「记录」里。' : ''}
          </p>
            </>
          )}
        </main>
      </div>
    )
  }

  const inFocus = screen === 'training' || screen === 'receipt'

  /** 本周是否已记录过体重（用于「今天」页的一行轻提示） */
  const monday = new Date()
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const thisWeekHasWeight = bodyMetrics.some((b) => Date.parse(b.recordedAt) >= monday.getTime())

  /** 本周（当前计划内）已完成次数与当前周连击（用于「今天」页数字条） */
  const weekDone = programSessions.filter(
    (s) => Date.parse(s.startedAt) >= monday.getTime() && s.outcome !== 'skipped',
  ).length
  const streakCurrent = weekStreak(sessions, activeProgram.weeklyRhythm.minViablePerWeek).current

  return (
    <div className="app">
      <header className="topline">
        <span className="label">PATH / FIELD</span>
        <span className="label">{activeMission.title}</span>
      </header>

      <main className="stage">
        {screen === 'today' && (
          <Today
            program={activeProgram}
            nextPlannedSessionId={nextPlannedSessionId}
            weekDone={weekDone}
            streakCurrent={streakCurrent}
            showBodyPrompt={!thisWeekHasWeight}
            onGoRecords={() => setScreen('records')}
            onStartTraining={(s) => {
              setDraft(s)
              void saveSession(s)
              setScreen('training')
            }}
          />
        )}

        {screen === 'journey' && (
          <Journey
            mission={activeMission}
            program={activeProgram}
            sessions={sessions}
            programs={programs}
            sessionsDone={programSessions.length}
            programSessions={programSessions}
          />
        )}
        {screen === 'records' && (
          <Records
            sessions={sessions}
            programs={programs}
            bodyMetrics={bodyMetrics}
            mission={activeMission}
            evidences={evidences}
            decisions={decisions}
            onSaveBodyMetric={(b) => void saveBodyMetric(b)}
            onSaveMission={(m) => void saveMission(m)}
          />
        )}

        {screen === 'training' && draft !== null && (
          <Training
            program={activeProgram}
            session={draft}
            history={sessions}
            onChange={(s) => {
              setDraft(s)
              void saveSession(s)
            }}
            onFinish={() => setScreen('receipt')}
          />
        )}

        {screen === 'receipt' && draft !== null && (
          <Receipt
            session={draft}
            history={sessions}
            program={activeProgram}
            onDecide={(d) => void saveDecision(d)}
            onDone={() => {
              setDraft(null)
              setScreen('today')
            }}
          />
        )}
      </main>

      {!inFocus && (
        <nav className="tabs" aria-label="主导航">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              className={screen === key ? 'tab selected' : 'tab'}
              aria-current={screen === key ? 'page' : undefined}
              onClick={() => setScreen(key)}
            >
              <Icon size={24} />
              <span className="tab-label">{label}</span>
            </button>
          ))}
        </nav>
      )}

      <footer className="footnote">
        <button type="button" className="ghost small" onClick={() => void onExport()}>导出本地数据 (JSON)</button>
        {confirmSwitch ? (
          <span className="confirm-switch">
            <button
              type="button"
              className="primary small"
              onClick={() => {
                void archiveActivePlan()
                setConfirmSwitch(false)
                setScreen('today')
              }}
            >
              确认放弃当前计划
            </button>
            <button type="button" className="ghost small" onClick={() => setConfirmSwitch(false)}>
              先不动
            </button>
          </span>
        ) : (
          <button type="button" className="ghost small" onClick={() => setConfirmSwitch(true)}>
            重新选择路径
          </button>
        )}
        <p className="body">
          数据只存本机，记得定期导出。
        </p>
      </footer>
    </div>
  )
}

/** 入口第二步：三个快问（约 15 秒，都可跳过），答案随 Mission 落库 */
function QuickQuestions({ onSubmit, onBack }: { onSubmit: (a: OnboardingAnswers) => void; onBack: () => void }) {
  const [goal, setGoal] = useState<string | undefined>()
  const [weeklyTarget, setWeeklyTarget] = useState<number | undefined>()
  const [cautionAreas, setCautionAreas] = useState<string[]>([])

  const toggleCaution = (c: string) => {
    if (c === '无') {
      setCautionAreas(['无'])
      return
    }
    setCautionAreas((prev) => prev.filter((x) => x !== '无').includes(c)
      ? prev.filter((x) => x !== c)
      : [...prev.filter((x) => x !== '无'), c])
  }

  return (
    <div className="quick-questions">
      <section className="mission">
        <p className="label">三个快问 · 可跳过</p>
        <h1>让计划更贴近你</h1>
      </section>

      <section>
        <p className="label">主要目标</p>
        <div className="chips">
          {GOAL_OPTIONS.map((g) => (
            <button
              key={g}
              type="button"
              className={goal === g ? 'chip selected' : 'chip'}
              aria-pressed={goal === g}
              onClick={() => setGoal(goal === g ? undefined : g)}
            >
              {g}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="label">每周想练几次</p>
        <div className="chips">
          {WEEKLY_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              className={weeklyTarget === n ? 'chip selected' : 'chip'}
              aria-pressed={weeklyTarget === n}
              onClick={() => setWeeklyTarget(weeklyTarget === n ? undefined : n)}
            >
              {n} 次
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="label">有需要注意的部位吗</p>
        <div className="chips">
          {CAUTION_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              className={cautionAreas.includes(c) ? 'chip selected' : 'chip'}
              aria-pressed={cautionAreas.includes(c)}
              onClick={() => toggleCaution(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section className="entry-actions">
        <button
          type="button"
          className="primary"
          onClick={() =>
            onSubmit({
              goal,
              weeklyTarget,
              cautionAreas: cautionAreas.filter((c) => c !== '无'),
            })
          }
        >
          看完整计划
        </button>
        <button type="button" className="ghost" onClick={onBack}>返回换路径</button>
      </section>
    </div>
  )
}

/** 入口第三步：给未创建的计划做一个轻量预览（不落库，点确认才创建） */
function templatePreview(t: ProgramTemplate): { title: string; intent: string } {
  const byPath: Record<ProgramTemplate['path'], { title: string; intent: string }> = {
    returning: { title: '重新建立训练节奏', intent: '中断后重新开始，恢复规律训练' },
    routine: { title: '稳定完成每周两次训练', intent: '有意愿，把每周两次变成默认节奏' },
    progressing: { title: '补齐下肢与背部，积累可比较证据', intent: '已有规律训练，补短板并看懂进步' },
  }
  return byPath[t.path]
}

/** 计划确认页里的计划总览（结构与旅程页一致，但用模板数据） */
function JourneyPreviewSection({ template }: { template: ProgramTemplate }) {
  return (
    <section className="plan-preview">
      <p className="label">训练安排 · {template.sessions.length} 节</p>
      <ul>
        {template.sessions.map((s) => (
          <li key={s.id}>
            <strong>{s.title}</strong> —— {s.intent}
            <br />
            <span className="meta">
              {s.blocks.map((b) => b.exerciseId).length} 个动作 · 完整版约 {template.variants.full.estimatedMinutes} 分钟 / 短版约 {template.variants.short.estimatedMinutes} 分钟
            </span>
          </li>
        ))}
      </ul>
      <p className="label" style={{ marginTop: 14 }}>如何变化</p>
      <ul className="rules">
        <li>同 RPE 档下完成目标区间上限 → 下次候选 +2.5kg，由你确认后生效。</li>
      </ul>
      <p className="body">三个版本都在主路上，按状态与时间选。</p>
    </section>
  )
}

export default App
