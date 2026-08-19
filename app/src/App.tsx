import { useState } from 'react'
import './App.css'
import { downloadSnapshot, exportSnapshot } from './store/db'
import { usePath } from './store/usePath'
import type { ProgramTemplate } from './data/templates'
import type { Session } from './core/types'
import { Today } from './ui/Today'
import { Training } from './ui/Training'
import { Receipt } from './ui/Receipt'
import { Journey } from './ui/Journey'
import { Records } from './ui/Records'

type Screen = 'today' | 'journey' | 'records' | 'training' | 'receipt'

const TEMPLATE_LABEL: Record<ProgramTemplate['path'], string> = {
  returning: '我中断了一段时间，想重新开始',
  routine: '我有意愿，想建立每周两次的节奏',
  progressing: '我已有规律训练，想补短板并看懂进步',
}

function App() {
  const { loaded, activeMission, activeProgram, nextPlannedSessionId, sessions, programSessions, missions, templateChoices, startWithTemplate, archiveActivePlan, saveSession } = usePath()
  const [screen, setScreen] = useState<Screen>('today')
  const [draft, setDraft] = useState<Session | null>(null)
  const [pendingTemplate, setPendingTemplate] = useState<ProgramTemplate | null>(null)
  const [confirmSwitch, setConfirmSwitch] = useState(false)
  const hasHistory = missions.length > 0

  const onExport = async () => {
    downloadSnapshot(await exportSnapshot())
  }

  if (!loaded) {
    return <div className="app"><p className="body">加载本地数据…</p></div>
  }

  // ---------- 入口第一步：选路径；第二步：看完整计划再开始 ----------
  if (activeMission === undefined || activeProgram === undefined) {
    if (pendingTemplate !== null) {
      const preview = templatePreview(pendingTemplate)
      return (
        <div className="app">
          <header className="topline">
            <span className="label">PATH / FIELD</span>
            <span className="label">v0.2 M2</span>
          </header>
          <main className="stage">
            <section className="mission">
              <p className="label">确认之前，先看清整份计划</p>
              <h1>{preview.title}</h1>
              <p className="body">你的原话意图：{preview.intent}</p>
            </section>
            <JourneyPreviewSection template={pendingTemplate} />
            <section className="entry-actions">
              <button
                type="button"
                className="primary"
                onClick={() => {
                  void startWithTemplate(pendingTemplate)
                  setPendingTemplate(null)
                  setScreen('journey')
                }}
              >
                确认开始这份计划
              </button>
              <button type="button" className="ghost" onClick={() => setPendingTemplate(null)}>
                返回换一条路径
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
          <section className="mission entry-hero">
            <p className="label">从这里开始</p>
            <h1>先看清整份计划，<br />再决定今天练什么</h1>
            <p className="body">
              选一个起点，下一屏会展示完整计划：每节课的意图与动作、
              完整 / 短版 / 恢复三个版本、进阶与安全规则。确认之后，才开始第一次训练。
            </p>
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
            这不是等级测试，只是入口。三个入口都通向同一条主路：中断不清零、不补债，随时可以换。
            {hasHistory ? '你之前的训练记录不会受影响，会一直保留在「记录」里。' : ''}
          </p>
        </main>
      </div>
    )
  }

  const inFocus = screen === 'training' || screen === 'receipt'

  return (
    <div className="app">
      <header className="topline">
        <span className="label">PATH / FIELD</span>
        <span className="label">{activeMission.title}</span>
      </header>

      <main className="stage">
        {screen === 'today' && (
          <>
            <section className="mission">
              <p className="label">当前 Mission · {new Date(activeMission.reviewDate).toLocaleDateString('zh-CN')} 复盘</p>
              <h1>{activeMission.title}</h1>
              <div className="mission-rule" aria-hidden="true" />
              <p className="body">
                成功证据：{activeMission.successEvidence.map((e) => e.statement).join('；')}。
                体重不作为本阶段唯一裁判。
              </p>
            </section>
            <Today
              program={activeProgram}
              nextPlannedSessionId={nextPlannedSessionId}
              onStartTraining={(s) => {
                setDraft(s)
                void saveSession(s)
                setScreen('training')
              }}
            />
            {sessions.length > 0 && (
              <section>
                <p className="label">最近记录</p>
                <ul className="history">
                  {sessions.slice(0, 3).map((s) => (
                    <li key={s.id}>
                      {new Date(s.startedAt).toLocaleDateString('zh-CN')} · {variantLabel(s.selectedVariant)} · {outcomeLabel(s.outcome)}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        {screen === 'journey' && <Journey mission={activeMission} program={activeProgram} sessionsDone={programSessions.length} />}
        {screen === 'records' && <Records sessions={sessions} />}

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
            onDone={() => {
              setDraft(null)
              setScreen('today')
            }}
          />
        )}
      </main>

      {!inFocus && (
        <nav className="tabs">
          {(['today', 'journey', 'records'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={screen === tab ? 'tab selected' : 'tab'}
              onClick={() => setScreen(tab)}
            >
              {tab === 'today' ? '今天' : tab === 'journey' ? '旅程' : '记录'}
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
          本地优先：数据仅存于本机。建议添加到主屏幕并定期导出。
          换路径不删任何训练记录——它们是事实，会一直留在「记录」里。
        </p>
      </footer>
    </div>
  )
}

/** 入口第二步：给未创建的计划做一个轻量预览（不落库，点确认才创建） */
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
        <li>同 RPE 档下完成目标区间上限 → 下次候选 +2.5kg——不自动生效，由你确认。</li>
      </ul>
      <p className="body">完整版 / 短版 / 恢复版每天按状态与时间选择，三者都是主路。开始后可在「旅程」随时查看全部细节。</p>
    </section>
  )
}

function variantLabel(v: Session['selectedVariant']): string {
  return v === 'full' ? '完整' : v === 'short' ? '短版' : v === 'recovery' ? '恢复' : '自由'
}

function outcomeLabel(o: Session['outcome']): string {
  return o === 'completed' ? '完成' : o === 'partial' ? '部分完成' : o === 'recovery' ? '恢复' : o === 'stoppedForSafety' ? '因安全停止' : '跳过'
}

export default App
