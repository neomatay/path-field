/**
 * PATH v0.2 领域模型（core，纯 TS，无 UI 依赖）
 *
 * 依据：V1_PRODUCT_CONTRACT.md（七对象）+ ROADMAP_v0_2.md 第 6 节调整：
 *  - 新增 Exercise 实体（id / 器械依赖 / 替换组）
 *  - comparisonKey 简化：同模板版本 + 同动作 + RPE 区间相近即可比
 *  - source 收窄为 user | derived
 */

// ---------- 基础 ----------

export type ISO8601 = string; // 所有时间均为 ISO 8601 字符串

export type FactClassification = 'fact' | 'observation' | 'toConfirm';

export type EvidenceKind =
  | 'trainingPerformance'
  | 'bodyObservation'
  | 'subjectiveExperience'
  | 'lifeContext'
  /** 参与前一次性筛查（PAR-Q+，KB-ASSESS-01） */
  | 'screening';

export type EvidenceConfidence = 'direct' | 'limited' | 'insufficient';

export type EvidenceScope = 'session' | 'week' | 'mission';

// ---------- CurrentState ----------

export type EntryMode = 'starting' | 'returning' | 'routine' | 'progressing';

export type DiscomfortLevel = 'none' | 'noticeable' | 'urgentSignal';

export interface CurrentState {
  id: string;
  createdAt: ISO8601;
  entryMode: EntryMode;
  /** 本次可用分钟数 */
  availableMinutes: number;
  /** 场地与器械摘要，如 "商业健身房（乐刻）" */
  environment: string;
  /** 用户自选训练熟悉度，不打分 */
  experience: string;
  /** 精力自评：low | ok | good，可跳过 */
  readiness: 'low' | 'ok' | 'good' | 'unknown';
  discomfort: DiscomfortLevel;
  discomfortNote?: string;
  /** 用户声明的动作回避/限制，每条有来源 */
  constraints: string[];
  safetyCheckId: string;
  source: 'user' | 'derived';
}

// ---------- SafetyCheck ----------

export type SafetyResult = 'clear' | 'caution' | 'urgent';

export interface SafetyCheck {
  id: string;
  checkVersion: string; // 当前为 'v1'
  result: SafetyResult;
  answeredAt: ISO8601;
  /** 未回答不等于安全；仅用户显式全部回答后才可为 clear */
  allAnswered: boolean;
}

// ---------- Mission ----------

export type MissionStatus = 'proposed' | 'active' | 'paused' | 'completed' | 'replaced';

export interface MissionSuccessEvidence {
  statement: string;
  classification: 'fact' | 'observation';
  /** 采集频率说明，如 "每次训练" */
  frequency: string;
}

export interface Mission {
  id: string;
  createdAt: ISO8601;
  title: string;
  userIntent: string; // 用户原话摘要
  /** 入口追问：主要目标，如 "增肌" */
  goal?: string;
  /** 入口追问：每周想练几次（仅记录与展示，不改变模板） */
  weeklyTarget?: number;
  /** 入口追问：需要注意的部位，如 ["膝", "腰"] */
  cautionAreas?: string[];
  startDate: ISO8601;
  /** 开始后 28-42 天 */
  reviewDate: ISO8601;
  successEvidence: MissionSuccessEvidence[]; // 2-4 个
  /** 本阶段不作为唯一成败裁判的指标，如体重 */
  notTheJudge: string[];
  timeAndEnvironment: string;
  boundaries: string[];
  assumptions: string[];
  status: MissionStatus;
  supersedesId?: string;
}

// ---------- Exercise（v0.2 新增） ----------

export interface Exercise {
  id: string;
  name: string;
  /** 器械依赖描述，如 "史密斯机"、"自重"、"绳索架" */
  equipment: string;
  /** 替换组：同组动作互为等价替换（器械被占用时用） */
  substitutionGroupId: string;
  /** 该动作是否为模板关键动作（短版保留） */
  isCompoundKey?: boolean;
}

// ---------- Program ----------

export type ProgramStatus = 'draft' | 'active' | 'superseded' | 'paused';

export type VariantKind = 'full' | 'short' | 'recovery';

export interface PlannedBlock {
  exerciseId: string;
  /** 目标组数 x 次数区间，如 "4 x 8-12" */
  targetSets: number;
  targetReps: string;
  /** 目标负荷区间描述（保守），可为空 = 自选 */
  targetLoad?: string;
  keyToMission: boolean;
}

export interface PlannedSession {
  id: string;
  title: string;
  intent: string; // 本次训练意图
  blocks: PlannedBlock[];
}

export interface ProgramVariant {
  kind: VariantKind;
  estimatedMinutes: number;
  /** 保留了哪些训练意图、移除了什么 */
  keeps: string;
  removed: string;
}

export interface Program {
  id: string;
  missionId: string;
  version: number;
  createdAt: ISO8601;
  templateId: string;
  weeklyRhythm: {
    recommendedPerWeek: number;
    minViablePerWeek: number;
  };
  sessions: PlannedSession[];
  variants: Record<VariantKind, ProgramVariant>;
  /** 仅为候选调整条件，需 Decision 才生效 */
  progressionRules: string[];
  safetyConstraints: string[];
  rationale: string;
  status: ProgramStatus;
  supersedesId?: string;
}

// ---------- Session ----------

export type SessionOutcome =
  | 'completed'
  | 'partial'
  | 'recovery'
  | 'skipped'
  | 'stoppedForSafety';

export type SessionVariantChoice = 'full' | 'short' | 'recovery' | 'selfDirected';

export interface ActualSet {
  setIndex: number;
  weightKg?: number;
  reps?: number;
  rpe?: number;
}

export interface ActualBlock {
  exerciseId: string;
  plannedReps?: string;
  sets: ActualSet[];
  /** 替换成的动作（若发生替换） */
  substitutedWithExerciseId?: string;
  skipped?: boolean;
  skipReason?: string;
}

export interface SessionAdjustment {
  type: 'variantChange' | 'substitution' | 'skip' | 'loadReduction' | 'pause';
  reason?: string;
  source: 'user';
}

/** 训练前状态签到（今天页采集，随 Session 落库，供分析与规则使用） */
export interface SessionCheckIn {
  /** 昨晚睡眠时长（小时） */
  sleepHours?: number;
  readiness?: 'low' | 'ok' | 'good' | 'unknown';
  /** 当天可用分钟数 */
  availableMinutes?: number;
}

export interface Session {
  id: string;
  createdAt: ISO8601;
  programId: string | null;
  plannedSessionId: string | null;
  startedAt: ISO8601;
  endedAt?: ISO8601;
  outcome: SessionOutcome;
  selectedVariant: SessionVariantChoice;
  actualBlocks: ActualBlock[];
  adjustments: SessionAdjustment[];
  checkIn?: SessionCheckIn;
  checkOut: {
    discomfort: DiscomfortLevel | 'unknown';
    energy?: 'low' | 'ok' | 'good';
    willingToContinue?: boolean;
  };
  safetyEvents: string[]; // 触发的 ruleId 列表；无事件为空数组
}

// ---------- BodyMetric（身体数据时间序列） ----------

export interface BodyMetric {
  id: string;
  recordedAt: ISO8601;
  weightKg?: number;
  waistCm?: number;
  hipCm?: number;
  bodyFatPct?: number;
  note?: string;
}

// ---------- Evidence ----------

export interface ComparisonKey {
  exerciseId: string;
  templateVersionId: string;
  /** RPE 区间档：<=7 | 8-9 | 10 */
  rpeBand: '<=7' | '8-9' | '10';
}

export interface Evidence {
  id: string;
  sessionId?: string;
  kind: EvidenceKind;
  classification: FactClassification;
  /** 面向用户的简短陈述，不越过数据支持范围 */
  statement: string;
  value?: number;
  unit?: string;
  recordedAt: ISO8601;
  sourceRecordIds: string[];
  comparisonKey?: ComparisonKey | null;
  confidence: EvidenceConfidence;
  scope: EvidenceScope;
}

// ---------- Review ----------

export type ReviewScope = 'session' | 'week' | 'mission';

export interface ReviewObservation {
  statement: string;
  evidenceIds: string[];
  boundary: string; // 该观察不能推出什么
}

export interface Review {
  id: string;
  createdAt: ISO8601;
  scope: ReviewScope;
  periodStart: ISO8601;
  periodEnd: ISO8601;
  factEvidenceIds: string[];
  observations: ReviewObservation[];
  toConfirm: string[];
  /** 已记录 / 计划的训练数量；不是顺从评分 */
  coverage: { recorded: number; planned: number; comparable: number };
  interpretationBoundary: string;
  recommendationIds: string[];
}

// ---------- Decision ----------

export type RiskLevel = 'none' | 'caution' | 'urgent';

export type UserChoice = 'accepted' | 'modified' | 'declined' | 'paused' | 'deferred';

export interface DecisionOption {
  id: string;
  label: string;
  /** 选择该项的影响 */
  effect: string;
  basedOnEvidenceIds: string[];
  unknowns: string[];
}

export interface Decision {
  id: string;
  createdAt: ISO8601;
  trigger: string; // 如 'RETURN-14D-01' | 'userInitiated'
  ruleId?: string;
  inputEvidenceIds: string[];
  riskLevel: RiskLevel;
  options: DecisionOption[];
  recommendedOptionId?: string;
  userChoice?: UserChoice;
  userChoiceReason?: string;
  effectiveFrom?: ISO8601;
  followUpEvidence: string[];
  /** 固定顺序：事实 -> 观察 -> 待确认 -> 选项 */
  explanation: string;
}
