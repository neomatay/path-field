/**
 * PAR-Q+ 入门筛查（KB-ASSESS-01，strong 证据，Warburton 2011）。
 * 参与前一次性执行：7 个标准问题，是/否作答；任一「是」给出就医建议但不拦截——
 * 记录事实、不评判，用户仍可从短版/恢复版开始。
 */
import { useState } from 'react'

interface Props {
  onSubmit: (answers: boolean[]) => void
}

/** PAR-Q+ 7 问（用户自答，答案只作事实记录） */
const QUESTIONS = [
  '医生是否曾经说过你有心脏方面的问题，且只能在医生建议的医疗监督下进行体力活动？',
  '你活动时是否出现过胸痛？',
  '过去一个月里，不活动时是否出现过胸痛？',
  '你是否曾因头晕失去平衡，或失去过意识？',
  '你是否有关节或骨骼问题，可能因体力活动而加重？',
  '医生是否正在为你开血压或心脏方面的处方药？',
  '你是否还有其他不进行体力活动的理由？',
]

export function Parq({ onSubmit }: Props) {
  // null = 未答；true = 是；false = 否
  const [answers, setAnswers] = useState<(boolean | null)[]>(Array(QUESTIONS.length).fill(null))
  const [done, setDone] = useState(false)

  const answeredCount = answers.filter((a) => a !== null).length
  const allAnswered = answeredCount === QUESTIONS.length
  const positives = answers.filter((a) => a === true).length

  const setAnswer = (i: number, v: boolean) => {
    setAnswers((prev) => prev.map((a, idx) => (idx === i ? v : a)))
  }

  if (done) {
    return (
      <section className="q-card">
        <p className="q-label">筛查结果 · 已记录</p>
        <p className="q-title">
          {positives === 0
            ? '7 项均为「否」'
            : `${positives} 项「是」`}
        </p>
        {positives === 0 ? (
          <p className="body">
            当前没有已知的、需要先咨询医生的信号——可以按自己的节奏开始。
          </p>
        ) : (
          <>
            <p className="body">
              这不代表不能训练，只是建议先咨询医生，再决定从哪个强度开始。
            </p>
            <p className="explain">
              依据「记录事实、不评判」：筛查结果不会拦截你。你可以从短版或恢复版开始，
              并在训练签到里标记需要注意的部位。
            </p>
          </>
        )}
        <button type="button" className="primary" onClick={() => onSubmit(answers as boolean[])}>
          继续，选择你的路径
        </button>
      </section>
    )
  }

  return (
    <section className="q-card">
      <p className="q-label">开始前的 7 个问题 · PAR-Q+</p>
      <p className="q-title">参与前一次性筛查</p>
      <p className="body">
        答案只作为事实记录，不影响你能用哪些功能。（{answeredCount}/{QUESTIONS.length} 已答）
      </p>
      <div className="progress-dots">
        {QUESTIONS.map((_, i) => (
          <span key={i} className={answers[i] !== null ? 'active' : ''} />
        ))}
      </div>
      <ol className="parq-list">
        {QUESTIONS.map((q, i) => (
          <li key={i}>
            <p className="body" style={{ fontWeight: 700, margin: '0 0 8px' }}>{i + 1}. {q}</p>
            <div className="q-options">
              <button
                type="button"
                className={answers[i] === true ? 'q-opt selected' : 'q-opt'}
                aria-pressed={answers[i] === true}
                onClick={() => setAnswer(i, true)}
              >
                是
              </button>
              <button
                type="button"
                className={answers[i] === false ? 'q-opt selected' : 'q-opt'}
                aria-pressed={answers[i] === false}
                onClick={() => setAnswer(i, false)}
              >
                否
              </button>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className="primary"
        disabled={!allAnswered}
        onClick={() => setDone(true)}
      >
        {allAnswered ? '完成筛查' : `还剩 ${QUESTIONS.length - answeredCount} 题未答`}
      </button>
    </section>
  )
}
