/**
 * 周复盘规则（V1_PRODUCT_CONTRACT.md 5.4）
 *
 * REVIEW-WEEK-LOW-01    本周记录 < 1 次，或没有可比关键动作 -> 只能陈述已发生与缺失
 * REVIEW-WEEK-SIGNAL-02 >= 2 次同动作、同口径可比工作组，无未解决 caution
 *                       -> 可陈述"相近条件下表现稳定/变化"；不得宣称整体能力提升
 * REVIEW-BOUNDARY-04    体重/围度/照片缺失或与训练信号不一致 -> 标明不能单独解释效果
 *
 * 进阶规则（ROADMAP 第 6.5 条 + KB-PROG-02）：
 * 同 RPE 档下完成目标区间上限 -> 按动作的增量策略给候选（分档加重 / 升配重格 / 次数进阶），需 Decision 确认。
 */
import type { ActualBlock, Program, Session } from '../types';
import { EXERCISES_BY_ID } from '../../data/exercises';

/** 从计划的 targetReps（如 "8-12" 或 "12"）取上限，作为进阶判断的目标区间 */
export function maxRepsTargetsOf(program: Program): Record<string, { maxReps: number }> {
  const targets: Record<string, { maxReps: number }> = {};
  for (const s of program.sessions) {
    for (const b of s.blocks) {
      const m = /(\d+)\s*-\s*(\d+)/.exec(b.targetReps);
      if (m !== null) {
        targets[b.exerciseId] = { maxReps: Number(m[2]) };
      } else {
        const single = /^(\d+)$/.exec(b.targetReps.trim());
        if (single !== null) targets[b.exerciseId] = { maxReps: Number(single[1]) };
      }
    }
  }
  return targets;
}

export interface ComparableGroup {
  exerciseId: string;
  /** 参与比较的 (sessionId, topSetWeightKg, reps, rpeBand) */
  entries: Array<{ sessionId: string; weightKg?: number; reps?: number; rpe?: number }>;
}

export interface ReviewRuleResult {
  ruleId: 'REVIEW-WEEK-LOW-01' | 'REVIEW-WEEK-SIGNAL-02';
  /** 可陈述的事实 */
  facts: string[];
  /** 允许的观察（带边界） */
  observations: Array<{ statement: string; boundary: string }>;
  /** 尚不能下结论的事 */
  toConfirm: string[];
  /** 候选决定选项（用户确认才生效） */
  options: Array<{ id: string; label: string; effect: string }>;
}

export function evaluateWeeklyReview(
  weekSessions: Session[],
  hasUnresolvedCaution: boolean,
): ReviewRuleResult {
  const recorded = weekSessions.filter((s) => s.outcome !== 'skipped');

  if (recorded.length < 1) {
    return {
      ruleId: 'REVIEW-WEEK-LOW-01',
      facts: ['本周没有已完成的训练记录。'],
      observations: [],
      toConfirm: ['本周时间、精力或意愿发生了什么变化，只有你自己知道；系统不做猜测。'],
      options: [
        { id: 'pause', label: '暂停本周', effect: '计划保留，历史保留，无任何清零。' },
        { id: 'short-only', label: '下周只保留短版', effect: '降低门槛，保留训练意图。' },
        { id: 'retry', label: '下周再采样一次', effect: '计划不变，先积累一条真实记录。' },
      ],
    };
  }

  const groups = buildComparableGroups(recorded);
  const comparable = groups.filter((g) => g.entries.length >= 2);

  if (comparable.length === 0 || hasUnresolvedCaution) {
    return {
      ruleId: 'REVIEW-WEEK-LOW-01',
      facts: [
        `本周已记录 ${recorded.length} 次训练。`,
        ...(hasUnresolvedCaution ? ['存在未解决的不适记录：相关动作不作为加重依据。'] : []),
      ],
      observations: [],
      toConfirm: ['同动作、相近条件的工作组不足 2 组，本周还不能比较表现变化。'],
      options: [
        { id: 'maintain', label: '维持当前计划', effect: '继续积累可比记录。' },
        { id: 'short', label: '改用短版', effect: '降低时间门槛，保留关键动作。' },
        { id: 'recover', label: '恢复一周', effect: '降低负荷，保留节奏。' },
      ],
    };
  }

  // REVIEW-WEEK-SIGNAL-02
  const facts = [
    `本周已记录 ${recorded.length} 次训练。`,
    ...comparable.map(
      (g) => `${g.exerciseId}：${g.entries.length} 组相近条件的工作组（${describe(g)}）。`,
    ),
  ];
  const observations = comparable.map((g) => ({
    statement: `${g.exerciseId} 在相近主观难度下的重量${trend(g)}。`,
    boundary: '这只说明相近条件下的表现稳定或变化，不能推出整体能力或体型变化。',
  }));

  return {
    ruleId: 'REVIEW-WEEK-SIGNAL-02',
    facts,
    observations,
    toConfirm: [
      '体重、围度或照片数据不构成身体变化的结论依据。',
      '整体能力是否提升，需要跨 Mission 的更多证据。',
    ],
    options: [
      { id: 'maintain', label: '维持，继续采集', effect: '最大化证据连续性。' },
      { id: 'small-progress', label: '下次尝试小范围渐进', effect: '仅对一项关键动作尝试小幅调整（按器械档位加重或多做 1-2 次），继续记录 RPE 与不适。' },
      { id: 'recover', label: '恢复一周', effect: '主动降载，不清零。' },
    ],
  };
}

// ---- 可比工作组（ROADMAP 第 6.2 条：同动作 + RPE 档相近） ----

export function buildComparableGroups(sessions: Session[]): ComparableGroup[] {
  const byExercise = new Map<string, ComparableGroup>();
  for (const s of sessions) {
    for (const b of s.actualBlocks as ActualBlock[]) {
      if (b.skipped || b.substitutedWithExerciseId) continue;
      const top = topSet(b);
      if (!top) continue;
      const g = byExercise.get(b.exerciseId) ?? { exerciseId: b.exerciseId, entries: [] };
      g.entries.push({ sessionId: s.id, ...top });
      byExercise.set(b.exerciseId, g);
    }
  }
  // RPE 档内部才可比：>= 2 组且至少两组落在同一档
  return [...byExercise.values()].filter((g) => hasSameBand(g));
}

function topSet(b: ActualBlock): { weightKg?: number; reps?: number; rpe?: number } | null {
  const done = b.sets.filter((s) => (s.reps ?? 0) > 0);
  if (done.length === 0) return null;
  const best = done.reduce((a, c) => ((c.weightKg ?? 0) * (c.reps ?? 1) >= (a.weightKg ?? 0) * (a.reps ?? 1) ? c : a));
  return { weightKg: best.weightKg, reps: best.reps, rpe: best.rpe };
}

function band(rpe?: number): '<=7' | '8-9' | '10' {
  if (rpe === undefined) return '8-9';
  if (rpe <= 7) return '<=7';
  if (rpe <= 9) return '8-9';
  return '10';
}

function hasSameBand(g: ComparableGroup): boolean {
  const bands = g.entries.map((e) => band(e.rpe));
  return bands.some((b) => bands.filter((x) => x === b).length >= 2);
}

function describe(g: ComparableGroup): string {
  return g.entries
    .map((e) => `${e.weightKg ?? '?'}kg x ${e.reps ?? '?'} @RPE${e.rpe ?? '?'}`)
    .join(' / ');
}

function trend(g: ComparableGroup): string {
  const ws = g.entries.map((e) => e.weightKg ?? 0);
  const first = ws[0];
  const last = ws[ws.length - 1];
  if (last > first) return '在增加';
  if (last < first) return '在下降';
  return '保持稳定';
}

// ---- 最简进阶候选（需 Decision 确认） ----

export interface ProgressionCandidate {
  exerciseId: string;
  fromWeightKg: number;
  /** 增量策略（KB-PROG-02）：weight 给出候选重量；nextPlate / repsOnly 只给方向 */
  incrementMode: 'weight' | 'nextPlate' | 'repsOnly';
  /** 仅 incrementMode=weight 时有值 */
  candidateWeightKg?: number;
  reason: string;
}

/** KB-PROG-02：增量按器械档位。数据缺省时退回保守的 +2.5kg 惯例。 */
function incrementOf(exerciseId: string): { mode: 'weight' | 'nextPlate' | 'repsOnly'; kg?: number } {
  const inc = EXERCISES_BY_ID[exerciseId]?.loadIncrement
  if (inc === undefined) return { mode: 'weight', kg: 2.5 }
  return inc
}

/**
 * 同 RPE 档下，最近一次在目标区间上限完成 -> 按增量策略给候选。
 * 只产生候选，不直接生效。
 */
export function buildProgressionCandidates(
  sessions: Session[],
  targets: Record<string, { maxReps: number }>,
): ProgressionCandidate[] {
  const groups = buildComparableGroups(sessions);
  const out: ProgressionCandidate[] = [];
  for (const g of groups) {
    const last = g.entries[g.entries.length - 1];
    const target = targets[g.exerciseId];
    if (!target || last.weightKg === undefined) continue;
    if ((last.reps ?? 0) >= target.maxReps && band(last.rpe) === band(g.entries[0].rpe)) {
      const inc = incrementOf(g.exerciseId)
      const base = `最近一次以目标区间上限（${last.reps} 次）完成 ${last.weightKg}kg，且主观难度未上升`
      if (inc.mode === 'weight') {
        const kg = inc.kg ?? 2.5
        out.push({
          exerciseId: g.exerciseId,
          fromWeightKg: last.weightKg,
          incrementMode: 'weight',
          candidateWeightKg: round(last.weightKg + kg),
          reason: `${base}。候选下次 +${kg}kg（到 ${round(last.weightKg + kg)}kg）；是否采用由你决定。`,
        })
      } else if (inc.mode === 'nextPlate') {
        out.push({
          exerciseId: g.exerciseId,
          fromWeightKg: last.weightKg,
          incrementMode: 'nextPlate',
          reason: `${base}。候选下次升一档配重（器械/哑铃取下一格，不必精确到公斤数）；是否采用由你决定。`,
        })
      } else {
        out.push({
          exerciseId: g.exerciseId,
          fromWeightKg: last.weightKg,
          incrementMode: 'repsOnly',
          reason: `${base}。候选下次同重量多做 1-2 次（次数进阶，重量不变）；是否采用由你决定。`,
        })
      }
    }
  }
  return out;
}

function round(n: number): number {
  return Math.round(n * 2) / 2;
}
