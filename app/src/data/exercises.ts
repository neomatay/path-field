/**
 * 最小动作库与替换表（ROADMAP_v0_2.md 第 5 节）
 * v0.2 M2 补充：每个动作带动作要点与首次起始重量建议（保守，非处方）。
 */
import type { Exercise } from '../core/types';

export interface ExerciseGuide extends Exercise {
  /** 动作要点（1-2 句，非教学视频替代） */
  cues?: string;
  /** 首次训练的保守起始建议；有历史记录后由"上次表现"替代 */
  startingHint?: string;
}

export const EXERCISES: ExerciseGuide[] = [
  // ---- 下肢 / 臀腿 ----
  {
    id: 'leg-press', name: '腿举', equipment: '腿举机', substitutionGroupId: 'quad-push', isCompoundKey: true,
    cues: '下背和臀部贴紧靠垫，双脚与肩同宽踩实踏板；下放至大腿约与踏板平行，站起时不锁死膝盖。',
    startingHint: '首次从每边一片（约 40-60kg）试探；轻松完成 12 次则下次加 10-20kg。',
  },
  {
    id: 'hack-squat', name: '哈克深蹲', equipment: '哈克机', substitutionGroupId: 'quad-push',
    cues: '背贴靠垫，脚比常规深蹲略前站；控制下放至大腿平行，站起不锁膝。',
    startingHint: '首次不加片或每边小片（10-20kg）开始。',
  },
  {
    id: 'goblet-squat', name: '高脚杯深蹲', equipment: '哑铃', substitutionGroupId: 'quad-push',
    cues: '哑铃贴胸前、肘内收；下蹲至大腿至少平行，躯干保持直立。',
    startingHint: '首次 8-12kg 哑铃。',
  },
  {
    id: 'smith-squat', name: '史密斯深蹲', equipment: '史密斯机', substitutionGroupId: 'quad-push', isCompoundKey: true,
    cues: '杠位放斜方肌上，脚略前于身体；蹲至大腿平行，膝盖轨迹稳定不内扣。',
    startingHint: '首次空杆（约 15-20kg）开始。',
  },
  {
    id: 'hip-thrust', name: '臀推', equipment: '臀推架', substitutionGroupId: 'hip-hinge-glute', isCompoundKey: true,
    cues: '肩胛贴凳缘，下巴微收；顶点夹紧臀部停一秒，肋骨不外翻、腰不过度反弓。',
    startingHint: '首次从空架或 20-40kg 开始，先找顶端夹紧的感觉。',
  },
  {
    id: 'db-rdl', name: '哑铃罗马尼亚硬拉', equipment: '哑铃', substitutionGroupId: 'hip-hinge-glute',
    cues: '膝微屈，髋部向后推；哑铃贴大腿下放至腘绳肌有拉伸感，背部全程平直。',
    startingHint: '首次每只 10-15kg。',
  },
  {
    id: 'cable-pull-through', name: '绳索髋外展', equipment: '器械', substitutionGroupId: 'glute-iso',
    cues: '躯干稳定不后仰，靠臀部发力向外打开；顶端稍作停顿再回放。',
  },
  {
    id: 'hip-abduction', name: '髋外展', equipment: '器械', substitutionGroupId: 'glute-iso',
    cues: '膝部抵住挡板向外打开，躯干坐稳不借力；慢起慢落。',
  },
  {
    id: 'hip-adduction', name: '髋内收', equipment: '器械', substitutionGroupId: 'glute-iso',
    cues: '向中间夹合挡板，动作可控；不用爆发力甩重量。',
  },

  // ---- 胸 / 肩 ----
  {
    id: 'bench-press', name: '卧推', equipment: '卧推架', substitutionGroupId: 'chest-press', isCompoundKey: true,
    cues: '肩胛后缩下沉、双脚踩实；杠铃落至胸部中下沿，推起轨迹略向头部方向。',
    startingHint: '首次从空杆（20kg）开始，能标准完成 12 次再考虑加片。',
  },
  {
    id: 'db-bench', name: '哑铃卧推', equipment: '哑铃 + 板凳', substitutionGroupId: 'chest-press',
    cues: '哑铃下放至大臂与地面平行略低，肘约 45°；顶端不碰撞哑铃。',
    startingHint: '首次每只 7.5-10kg。',
  },
  {
    id: 'machine-chest-press', name: '坐姿推胸', equipment: '器械', substitutionGroupId: 'chest-press',
    cues: '背贴靠垫，把手约与乳头同高；推起不锁肘，回放有控制。',
    startingHint: '首次从最小配重片开始试探。',
  },
  {
    id: 'incline-bench', name: '上斜卧推', equipment: '上斜卧推架', substitutionGroupId: 'incline-press', isCompoundKey: true,
    cues: '凳面约 30°；杠铃落至锁骨下方，肘不过度外飘。',
    startingHint: '首次空杆开始；上斜通常比平板轻。',
  },
  {
    id: 'incline-db-press', name: '上斜哑铃卧推', equipment: '哑铃 + 可调凳', substitutionGroupId: 'incline-press',
    cues: '可调凳 30° 左右；哑铃下放至胸两侧，手腕保持中立。',
    startingHint: '首次每只 7.5kg 左右。',
  },
  {
    id: 'cable-fly', name: '夹胸', equipment: '绳索 / 蝴蝶机', substitutionGroupId: 'chest-iso',
    cues: '肘微屈固定角度，从两侧向中线合拢；想象环抱一棵树，不用大重量。',
  },
  {
    id: 'lateral-raise', name: '侧平举', equipment: '哑铃', substitutionGroupId: 'shoulder-iso',
    cues: '肘微屈向侧抬起至与肩同高；不耸肩、不甩身，宁轻勿重。',
  },
  {
    id: 'rear-delt-fly', name: '后束飞鸟', equipment: '蝴蝶机 / 绳索', substitutionGroupId: 'shoulder-iso',
    cues: '俯身或用器械反向坐；向后方打开，感受后肩发力而不是夹背。',
  },

  // ---- 背 / 手臂 ----
  {
    id: 'pull-up', name: '引体向上', equipment: '自重 / 辅助器械', substitutionGroupId: 'vertical-pull', isCompoundKey: true,
    cues: '正握略宽于肩，从完全悬挂开始；拉至下巴过杠，不甩腿借力。做不满 3 个时先用辅助器械或弹力带。',
    startingHint: '自重；不足时用辅助配重（先减 20-30kg）。',
  },
  {
    id: 'lat-pulldown-wide', name: '宽距高位下拉', equipment: '高位下拉架', substitutionGroupId: 'vertical-pull',
    cues: '宽握、胸部上挺；杠拉至上胸位置，肘向下向后，身体不过度后仰。',
    startingHint: '首次 25-35kg 试探。',
  },
  {
    id: 'lat-pulldown-neutral', name: '对握高位下拉', equipment: '高位下拉架', substitutionGroupId: 'vertical-pull',
    cues: '对握把手，肘贴身下拉；顶峰夹背一秒再回放。',
    startingHint: '首次 25-35kg 试探。',
  },
  {
    id: 'straight-arm-pulldown', name: '直臂下压', equipment: '绳索架', substitutionGroupId: 'lat-iso',
    cues: '肘微屈固定；从高处沿弧线下压至大腿侧，感受背阔肌发力。',
  },
  {
    id: 'face-pull', name: '面拉', equipment: '绳索架', substitutionGroupId: 'rear-delt',
    cues: '绳索拉向额头高度并向外旋至双拳在耳侧；轻重量、高次数。',
  },
  {
    id: 'rope-pushdown', name: '绳索下压', equipment: '绳索架', substitutionGroupId: 'triceps',
    cues: '肘贴身固定不动，下压至手臂伸直；不耸肩、不俯身压。',
  },
];

export const EXERCISES_BY_ID: Record<string, ExerciseGuide> = Object.fromEntries(
  EXERCISES.map((e) => [e.id, e]),
);

/** 器械被占用 / 动作不可用时的等价替换（不含自身） */
export function substitutionsFor(exerciseId: string): ExerciseGuide[] {
  const base = EXERCISES_BY_ID[exerciseId];
  if (!base) return [];
  return EXERCISES.filter(
    (e) => e.substitutionGroupId === base.substitutionGroupId && e.id !== exerciseId,
  );
}

/** 从历史会话中找该动作上次同条件最佳组（重量 x 次数 @RPE） */
export function lastPerformance(
  exerciseId: string,
  history: Array<{ startedAt: string; actualBlocks: Array<{ exerciseId: string; substitutedWithExerciseId?: string; skipped?: boolean; sets: Array<{ weightKg?: number; reps?: number; rpe?: number }> }> }>,
): { weightKg?: number; reps?: number; rpe?: number; date: string } | undefined {
  const sorted = [...history].sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
  for (const s of sorted) {
    const block = s.actualBlocks.find(
      (b) => !b.skipped && (b.exerciseId === exerciseId || b.substitutedWithExerciseId === exerciseId),
    );
    const top = block?.sets
      .filter((x) => (x.reps ?? 0) > 0)
      .reduce<typeof block.sets[number] | undefined>(
        (best, x) =>
          best === undefined || (x.weightKg ?? 0) * (x.reps ?? 1) > (best.weightKg ?? 0) * (best.reps ?? 1) ? x : best,
        undefined,
      );
    if (top !== undefined && (top.weightKg !== undefined || top.reps !== undefined)) {
      return { ...top, date: s.startedAt };
    }
  }
  return undefined;
}
