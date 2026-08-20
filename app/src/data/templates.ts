/**
 * 三套内置模板（ROADMAP_v0_2.md 第 5 节）
 * 1. return-fullbody  重返版全身训练（重返路径）
 * 2. routine-ab       全身 A / B（建立规律路径，每周 2 次固定时段，20 分钟短版可用）
 * 3. advance-lower    下肢重点计划（初步进阶路径，取自创始人真实臀腿日）
 *
 * v0.2 M3（2026-08-20 知识库落库）：按 KB-SESSION-04 复核课表——每课含下肢+推+拉，
 * 修复原 A 无拉 / B 无推、水平拉与垂直推模式缺席的问题。出处见 src/knowledge/v1/。
 */
import type { PlannedSession, Program, ProgramVariant } from '../core/types';

function variants(
  full: number,
  short: number,
  recovery: number,
  shortKeeps: string,
): Record<'full' | 'short' | 'recovery', ProgramVariant> {
  return {
    full: { kind: 'full', estimatedMinutes: full, keeps: '完整训练意图', removed: '无' },
    short: { kind: 'short', estimatedMinutes: short, keeps: shortKeeps, removed: '非关键容量动作、部分辅助组' },
    recovery: { kind: 'recovery', estimatedMinutes: recovery, keeps: '状态记录与低压力活动', removed: '全部负荷训练' },
  };
}

function plannedSession(id: string, title: string, intent: string, blocks: PlannedSession['blocks']): PlannedSession {
  return { id, title, intent, blocks };
}

// ---------- 1. 重返版全身 ----------
// KB-SESSION-04：补水平拉（坐姿划船替换侧平举，同为器械、难度 1，门槛不升）

const returnA = plannedSession('return-a', '重返 · 全身', '低门槛重新建立训练节奏，采集第一条可比较记录', [
  { exerciseId: 'goblet-squat', targetSets: 3, targetReps: '8-12', keyToMission: true },
  { exerciseId: 'machine-chest-press', targetSets: 3, targetReps: '8-12', keyToMission: true },
  { exerciseId: 'lat-pulldown-neutral', targetSets: 3, targetReps: '8-12', keyToMission: true },
  { exerciseId: 'seated-row', targetSets: 2, targetReps: '10-12', keyToMission: false },
]);

// ---------- 2. 全身 A / B ----------
// KB-SESSION-04：每课含下肢 + 推 + 拉，A/B 合计每周覆盖全部 6 个基础模式（水平推 x2、垂直拉 x2，其余 x1）
// KB-SESSION-01：多关节复合在前

const routineA = plannedSession('routine-a', '全身 A', '建立每周两次的可重复节奏：下肢前侧 + 推 + 双向拉', [
  { exerciseId: 'goblet-squat', targetSets: 3, targetReps: '8-12', keyToMission: true },
  { exerciseId: 'bench-press', targetSets: 4, targetReps: '8-12', keyToMission: true },
  { exerciseId: 'lat-pulldown-neutral', targetSets: 3, targetReps: '8-12', keyToMission: false },
  { exerciseId: 'seated-row', targetSets: 3, targetReps: '10-12', keyToMission: false },
]);

const routineB = plannedSession('routine-b', '全身 B', '与 A 交替：髋后侧 + 推（水平/垂直）+ 垂直拉', [
  { exerciseId: 'hip-thrust', targetSets: 3, targetReps: '8-12', keyToMission: true },
  { exerciseId: 'incline-db-press', targetSets: 3, targetReps: '8-12', keyToMission: false },
  { exerciseId: 'seated-db-ohp', targetSets: 3, targetReps: '8-12', keyToMission: false },
  { exerciseId: 'lat-pulldown-wide', targetSets: 4, targetReps: '8-12', keyToMission: true },
]);

// ---------- 3. 下肢重点（进阶） ----------

const lowerMain = plannedSession('lower-main', '臀腿 · 重点', '稳定完成下肢训练并积累可比较表现证据', [
  { exerciseId: 'leg-press', targetSets: 4, targetReps: '8-12', keyToMission: true },
  { exerciseId: 'hip-thrust', targetSets: 4, targetReps: '8-12', keyToMission: true },
  { exerciseId: 'hip-abduction', targetSets: 3, targetReps: '12-15', keyToMission: false },
  { exerciseId: 'hip-adduction', targetSets: 3, targetReps: '12-15', keyToMission: false },
  { exerciseId: 'smith-squat', targetSets: 3, targetReps: '8-12', keyToMission: false },
]);

const upperPush = plannedSession('upper-push', '胸 · 肩', '维持上肢推的容量与感觉', [
  { exerciseId: 'bench-press', targetSets: 4, targetReps: '8-12', keyToMission: true },
  { exerciseId: 'incline-bench', targetSets: 3, targetReps: '8-12', keyToMission: true },
  { exerciseId: 'cable-fly', targetSets: 3, targetReps: '12-15', keyToMission: false },
  { exerciseId: 'lateral-raise', targetSets: 3, targetReps: '12-15', keyToMission: false },
]);

const upperPull = plannedSession('upper-pull', '背 · 后束', '背部是当前短板；积累引体与下拉的可比记录', [
  { exerciseId: 'pull-up', targetSets: 4, targetReps: '3-6', keyToMission: true },
  { exerciseId: 'lat-pulldown-wide', targetSets: 3, targetReps: '8-12', keyToMission: true },
  { exerciseId: 'straight-arm-pulldown', targetSets: 3, targetReps: '12-15', keyToMission: false },
  { exerciseId: 'face-pull', targetSets: 3, targetReps: '12-15', keyToMission: false },
]);

// ---------- 模板定义 ----------

export interface ProgramTemplate {
  templateId: string;
  name: string;
  /** 服务路径 */
  path: 'returning' | 'routine' | 'progressing';
  description: string;
  sessions: PlannedSession[];
  variants: Record<'full' | 'short' | 'recovery', ProgramVariant>;
  weeklyRhythm: { recommendedPerWeek: number; minViablePerWeek: number };
  rationale: string;
}

export const TEMPLATES: ProgramTemplate[] = [
  {
    templateId: 'return-fullbody',
    name: '重返 · 全身',
    path: 'returning',
    description: '中断后重新开始：低门槛、可退出、20 分钟起。',
    sessions: [returnA],
    variants: variants(40, 20, 10, '1-2 个关键动作与记录点'),
    weeklyRhythm: { recommendedPerWeek: 2, minViablePerWeek: 1 },
    rationale: '重新开始的第一优先级是"能完成"，不是恢复以前的重量。',
  },
  {
    templateId: 'routine-ab',
    name: '全身 A / B',
    path: 'routine',
    description: '建立规律：每周两次固定时段，A/B 交替。',
    sessions: [routineA, routineB],
    variants: variants(50, 20, 10, 'A/B 的关键动作与记录点'),
    weeklyRhythm: { recommendedPerWeek: 2, minViablePerWeek: 1 },
    rationale: '规律来自固定时段 + 可完成，而不是来自强度。',
  },
  {
    templateId: 'advance-lower',
    name: '下肢重点 · 进阶',
    path: 'progressing',
    description: '已有规律训练，重点补下肢短板并积累可比证据。',
    sessions: [lowerMain, upperPush, upperPull],
    variants: variants(55, 20, 10, 'Mission 关键动作（腿举 / 臀推 / 卧推 / 引体）'),
    weeklyRhythm: { recommendedPerWeek: 3, minViablePerWeek: 2 },
    rationale: '当前 Mission 是下肢与背部；上肢推维持即可，不加量。',
  },
];

/** 从模板实例化一个 Program（status: draft，需用户确认激活） */
export function instantiateProgram(template: ProgramTemplate, missionId: string): Omit<Program, 'id' | 'createdAt'> {
  return {
    missionId,
    version: 1,
    templateId: template.templateId,
    weeklyRhythm: template.weeklyRhythm,
    sessions: template.sessions,
    variants: template.variants,
    // KB-PROG-01/02（src/knowledge/v1/rules.json）：RPE 门控双进阶 + 按器械档位的增量表
    progressionRules: [
      '同 RPE 档下完成目标区间上限 -> 候选加重（需确认）。增量按动作档位：下肢杠铃 +5kg、上肢杠铃 +2.5kg、器械/绳索/哑铃下一格、孤立小动作以次数进阶。',
    ],
    safetyConstraints: ['urgent 信号时停止本计划。', '标记不适的动作不作为加负荷依据。'],
    rationale: template.rationale,
    status: 'draft',
  };
}
