/**
 * 最小动作库与替换表（ROADMAP_v0_2.md 第 5 节）
 * v0.2 M2 补充：每个动作带动作要点与首次起始重量建议（保守，非处方）。
 * v0.2 M3 补充（2026-08-20 知识库落库）：
 *  - 每个动作增加难度档 difficulty 与进阶增量策略 loadIncrement（修正固定 +2.5kg，见 KB-PROG-02）
 *  - 补齐缺失模式组：horizontal-pull / vertical-push / single-leg / core / biceps / knee-flexion / calf
 *  - 出处与证据强度见 src/knowledge/v1/
 */
import type { Exercise } from '../core/types';

export interface ExerciseGuide extends Exercise {
  /** 动作要点（1-2 句，非教学视频替代） */
  cues?: string;
  /** 首次训练的保守起始建议；有历史记录后由"上次表现"替代 */
  startingHint?: string;
  /** 难度：1=可立即上手 / 2=需基础动作模式 / 3=技术敏感（大重量杠铃类）。同组内由易到难的退阶/进阶依据 */
  difficulty?: 1 | 2 | 3;
  /** 进阶加重策略（KB-PROG-02，实践惯例）：weight=固定公斤数 / nextPlate=器械哑铃下一格 / repsOnly=以次数进阶为主 */
  loadIncrement?: { mode: 'weight'; kg: number } | { mode: 'nextPlate' } | { mode: 'repsOnly' };
}

export const EXERCISES: ExerciseGuide[] = [
  // ---- 下肢 / 臀腿 ----
  {
    id: 'leg-press', name: '腿举', equipment: '腿举机', substitutionGroupId: 'quad-push', isCompoundKey: true,
    difficulty: 1, loadIncrement: { mode: 'nextPlate' },
    cues: '下背和臀部贴紧靠垫，双脚与肩同宽踩实踏板；下放至大腿约与踏板平行，站起时不锁死膝盖。',
    startingHint: '首次从每边一片（约 40-60kg）试探；轻松完成 12 次则下次加 10-20kg。',
  },
  {
    id: 'hack-squat', name: '哈克深蹲', equipment: '哈克机', substitutionGroupId: 'quad-push',
    difficulty: 2, loadIncrement: { mode: 'nextPlate' },
    cues: '背贴靠垫，脚比常规深蹲略前站；控制下放至大腿平行，站起不锁膝。',
    startingHint: '首次不加片或每边小片（10-20kg）开始。',
  },
  {
    id: 'goblet-squat', name: '高脚杯深蹲', equipment: '哑铃', substitutionGroupId: 'quad-push',
    difficulty: 1, loadIncrement: { mode: 'nextPlate' },
    cues: '哑铃贴胸前、肘内收；下蹲至大腿至少平行，躯干保持直立。',
    startingHint: '首次 8-12kg 哑铃。',
  },
  {
    id: 'smith-squat', name: '史密斯深蹲', equipment: '史密斯机', substitutionGroupId: 'quad-push', isCompoundKey: true,
    difficulty: 2, loadIncrement: { mode: 'weight', kg: 5 },
    cues: '杠位放斜方肌上，脚略前于身体；蹲至大腿平行，膝盖轨迹稳定不内扣。',
    startingHint: '首次空杆（约 15-20kg）开始。',
  },
  {
    id: 'hip-thrust', name: '臀推', equipment: '臀推架', substitutionGroupId: 'hip-hinge-glute', isCompoundKey: true,
    difficulty: 1, loadIncrement: { mode: 'weight', kg: 5 },
    cues: '肩胛贴凳缘，下巴微收；顶点夹紧臀部停一秒，肋骨不外翻、腰不过度反弓。',
    startingHint: '首次从空架或 20-40kg 开始，先找顶端夹紧的感觉。',
  },
  {
    id: 'barbell-rdl', name: '杠铃罗马尼亚硬拉', equipment: '杠铃', substitutionGroupId: 'hip-hinge-glute',
    difficulty: 3, loadIncrement: { mode: 'weight', kg: 5 },
    cues: '膝微屈、髋向后推，杠铃贴大腿下放至腘绳肌有拉伸感；背部全程平直，不弓腰。',
    startingHint: '首次空杆或每边小片（20-30kg）开始，重点找髋部后推的感觉。',
  },
  {
    id: 'db-rdl', name: '哑铃罗马尼亚硬拉', equipment: '哑铃', substitutionGroupId: 'hip-hinge-glute',
    difficulty: 2, loadIncrement: { mode: 'nextPlate' },
    cues: '膝微屈，髋部向后推；哑铃贴大腿下放至腘绳肌有拉伸感，背部全程平直。',
    startingHint: '首次每只 10-15kg。',
  },
  {
    id: 'cable-pull-through', name: '绳索髋外展', equipment: '器械', substitutionGroupId: 'glute-iso',
    difficulty: 1, loadIncrement: { mode: 'nextPlate' },
    cues: '躯干稳定不后仰，靠臀部发力向外打开；顶端稍作停顿再回放。',
  },
  {
    id: 'hip-abduction', name: '髋外展', equipment: '器械', substitutionGroupId: 'glute-iso',
    difficulty: 1, loadIncrement: { mode: 'nextPlate' },
    cues: '膝部抵住挡板向外打开，躯干坐稳不借力；慢起慢落。',
  },
  {
    id: 'hip-adduction', name: '髋内收', equipment: '器械', substitutionGroupId: 'glute-iso',
    difficulty: 1, loadIncrement: { mode: 'nextPlate' },
    cues: '向中间夹合挡板，动作可控；不用爆发力甩重量。',
  },
  {
    id: 'seated-leg-curl', name: '坐姿腿弯举', equipment: '器械', substitutionGroupId: 'knee-flexion',
    difficulty: 1, loadIncrement: { mode: 'nextPlate' },
    cues: '大腿贴紧靠垫，靠腘绳肌卷曲小腿；回放慢速控制，不用甩劲。',
    startingHint: '首次从轻配重试探，找到大腿后侧发力感。',
  },
  {
    id: 'standing-calf-raise', name: '站姿提踵', equipment: '提踵机 / 史密斯机', substitutionGroupId: 'calf',
    difficulty: 1, loadIncrement: { mode: 'nextPlate' },
    cues: '前脚掌踩实、脚跟下沉到最低；顶点停一秒，慢放回落。',
    startingHint: '首次自重或轻配重，重点是完整的动作幅度。',
  },
  {
    id: 'seated-calf-raise', name: '坐姿提踵', equipment: '器械', substitutionGroupId: 'calf',
    difficulty: 1, loadIncrement: { mode: 'nextPlate' },
    cues: '膝盖下压挡板，前脚掌发力顶起；同样做到全程幅度。',
    startingHint: '首次从轻配重开始。',
  },

  // ---- 单腿 ----
  {
    id: 'lunge', name: '箭步蹲', equipment: '哑铃 / 自重', substitutionGroupId: 'single-leg',
    difficulty: 2, loadIncrement: { mode: 'nextPlate' },
    cues: '一步迈出下蹲，前后腿膝盖均约 90°；躯干保持直立，重心在两腿之间。',
    startingHint: '首次自重开始，稳定后手持哑铃。',
  },
  {
    id: 'bulgarian-split-squat', name: '保加利亚分腿蹲', equipment: '哑铃 + 板凳', substitutionGroupId: 'single-leg',
    difficulty: 2, loadIncrement: { mode: 'nextPlate' },
    cues: '后脚背搭在凳上，前腿承担主要负荷；下蹲至前腿大腿平行，膝盖轨迹稳定。',
    startingHint: '首次自重找平衡，稳定后每只手持小哑铃。',
  },

  // ---- 胸 / 肩 ----
  {
    id: 'bench-press', name: '卧推', equipment: '卧推架', substitutionGroupId: 'chest-press', isCompoundKey: true,
    difficulty: 3, loadIncrement: { mode: 'weight', kg: 2.5 },
    cues: '肩胛后缩下沉、双脚踩实；杠铃落至胸部中下沿，推起轨迹略向头部方向。',
    startingHint: '首次从空杆（20kg）开始，能标准完成 12 次再考虑加片。',
  },
  {
    id: 'db-bench', name: '哑铃卧推', equipment: '哑铃 + 板凳', substitutionGroupId: 'chest-press',
    difficulty: 2, loadIncrement: { mode: 'nextPlate' },
    cues: '哑铃下放至大臂与地面平行略低，肘约 45°；顶端不碰撞哑铃。',
    startingHint: '首次每只 7.5-10kg。',
  },
  {
    id: 'machine-chest-press', name: '坐姿推胸', equipment: '器械', substitutionGroupId: 'chest-press',
    difficulty: 1, loadIncrement: { mode: 'nextPlate' },
    cues: '背贴靠垫，把手约与乳头同高；推起不锁肘，回放有控制。',
    startingHint: '首次从最小配重片开始试探。',
  },
  {
    id: 'incline-bench', name: '上斜卧推', equipment: '上斜卧推架', substitutionGroupId: 'incline-press', isCompoundKey: true,
    difficulty: 3, loadIncrement: { mode: 'weight', kg: 2.5 },
    cues: '凳面约 30°；杠铃落至锁骨下方，肘不过度外飘。',
    startingHint: '首次空杆开始；上斜通常比平板轻。',
  },
  {
    id: 'incline-db-press', name: '上斜哑铃卧推', equipment: '哑铃 + 可调凳', substitutionGroupId: 'incline-press',
    difficulty: 2, loadIncrement: { mode: 'nextPlate' },
    cues: '可调凳 30° 左右；哑铃下放至胸两侧，手腕保持中立。',
    startingHint: '首次每只 7.5kg 左右。',
  },
  {
    id: 'cable-fly', name: '夹胸', equipment: '绳索 / 蝴蝶机', substitutionGroupId: 'chest-iso',
    difficulty: 1, loadIncrement: { mode: 'nextPlate' },
    cues: '肘微屈固定角度，从两侧向中线合拢；想象环抱一棵树，不用大重量。',
  },
  {
    id: 'machine-shoulder-press', name: '器械推肩', equipment: '肩推器械', substitutionGroupId: 'vertical-push', isCompoundKey: true,
    difficulty: 1, loadIncrement: { mode: 'nextPlate' },
    cues: '背贴靠垫，把手在肩两侧略前；上推不锁肘，下放至耳朵高度即可。',
    startingHint: '首次从最小配重片开始试探。',
  },
  {
    id: 'seated-db-ohp', name: '坐姿哑铃推肩', equipment: '哑铃 + 板凳', substitutionGroupId: 'vertical-push',
    difficulty: 2, loadIncrement: { mode: 'nextPlate' },
    cues: '背部有支撑，哑铃从耳朵高度上推；不耸肩、肋骨不外翻。',
    startingHint: '首次每只 5-7.5kg。',
  },
  {
    id: 'barbell-ohp', name: '杠铃站姿推举', equipment: '深蹲架 / 杠铃', substitutionGroupId: 'vertical-push',
    difficulty: 3, loadIncrement: { mode: 'weight', kg: 2.5 },
    cues: '杠铃落在锁骨前起推，过头至手臂伸直；核心收紧不塌腰，头部在下巴让位后回到中立。',
    startingHint: '首次空杆（20kg）开始；站姿推举比坐姿轻。',
  },
  {
    id: 'lateral-raise', name: '侧平举', equipment: '哑铃', substitutionGroupId: 'shoulder-iso',
    difficulty: 1, loadIncrement: { mode: 'repsOnly' },
    cues: '肘微屈向侧抬起至与肩同高；不耸肩、不甩身，宁轻勿重。',
  },
  {
    id: 'rear-delt-fly', name: '后束飞鸟', equipment: '蝴蝶机 / 绳索', substitutionGroupId: 'shoulder-iso',
    difficulty: 1, loadIncrement: { mode: 'nextPlate' },
    cues: '俯身或用器械反向坐；向后方打开，感受后肩发力而不是夹背。',
  },

  // ---- 背 / 手臂 ----
  {
    id: 'pull-up', name: '引体向上', equipment: '自重 / 辅助器械', substitutionGroupId: 'vertical-pull', isCompoundKey: true,
    difficulty: 3, loadIncrement: { mode: 'repsOnly' },
    cues: '正握略宽于肩，从完全悬挂开始；拉至下巴过杠，不甩腿借力。做不满 3 个时先用辅助器械或弹力带。',
    startingHint: '自重；不足时用辅助配重（先减 20-30kg）。',
  },
  {
    id: 'lat-pulldown-wide', name: '宽距高位下拉', equipment: '高位下拉架', substitutionGroupId: 'vertical-pull',
    difficulty: 1, loadIncrement: { mode: 'nextPlate' },
    cues: '宽握、胸部上挺；杠拉至上胸位置，肘向下向后，身体不过度后仰。',
    startingHint: '首次 25-35kg 试探。',
  },
  {
    id: 'lat-pulldown-neutral', name: '对握高位下拉', equipment: '高位下拉架', substitutionGroupId: 'vertical-pull',
    difficulty: 1, loadIncrement: { mode: 'nextPlate' },
    cues: '对握把手，肘贴身下拉；顶峰夹背一秒再回放。',
    startingHint: '首次 25-35kg 试探。',
  },
  {
    id: 'seated-row', name: '坐姿划船', equipment: '坐姿划船机', substitutionGroupId: 'horizontal-pull', isCompoundKey: true,
    difficulty: 1, loadIncrement: { mode: 'nextPlate' },
    cues: '背贴靠垫、躯干稳定，肘贴身后拉至腹部；先收肩胛再屈肘，不靠后仰借力。',
    startingHint: '首次从轻配重试探，找到"肘往后带"的发力感。',
  },
  {
    id: 'one-arm-db-row', name: '单臂哑铃划船', equipment: '哑铃 + 板凳', substitutionGroupId: 'horizontal-pull',
    difficulty: 2, loadIncrement: { mode: 'nextPlate' },
    cues: '一侧手膝支撑板凳、背部平直；哑铃拉向髋部方向，肘贴近躯干。',
    startingHint: '首次每只 10-12.5kg。',
  },
  {
    id: 'barbell-row', name: '杠铃划船', equipment: '杠铃', substitutionGroupId: 'horizontal-pull',
    difficulty: 3, loadIncrement: { mode: 'weight', kg: 2.5 },
    cues: '俯身约 45°、背部平直；杠铃拉向下腹部，肘部向后，不靠抬躯干甩起。',
    startingHint: '首次空杆或每边小片（20-30kg）开始。',
  },
  {
    id: 'straight-arm-pulldown', name: '直臂下压', equipment: '绳索架', substitutionGroupId: 'lat-iso',
    difficulty: 1, loadIncrement: { mode: 'nextPlate' },
    cues: '肘微屈固定；从高处沿弧线下压至大腿侧，感受背阔肌发力。',
  },
  {
    id: 'face-pull', name: '面拉', equipment: '绳索架', substitutionGroupId: 'rear-delt',
    difficulty: 1, loadIncrement: { mode: 'nextPlate' },
    cues: '绳索拉向额头高度并向外旋至双拳在耳侧；轻重量、高次数。',
  },
  {
    id: 'pallof-press', name: '帕洛夫推', equipment: '绳索架', substitutionGroupId: 'core',
    difficulty: 2, loadIncrement: { mode: 'nextPlate' },
    cues: '绳索在体侧固定高度，双手握把向前推直；躯干抵抗旋转不转腰，回放有控制。',
    startingHint: '首次从轻配重开始，重点是躯干纹丝不动。',
  },
  {
    id: 'plank', name: '平板支撑', equipment: '自重', substitutionGroupId: 'core',
    difficulty: 1, loadIncrement: { mode: 'repsOnly' },
    cues: '肘在肩正下方，身体从头到脚一条直线；不塌腰不撅臀，以坚持秒数进阶。',
    startingHint: '首次 20-30 秒起步，姿势变形即停。',
  },
  {
    id: 'db-curl', name: '哑铃弯举', equipment: '哑铃', substitutionGroupId: 'biceps',
    difficulty: 1, loadIncrement: { mode: 'nextPlate' },
    cues: '肘贴身固定，靠前臂卷起哑铃；不耸肩不后仰借力，下放慢速。',
    startingHint: '首次每只 5-7.5kg。',
  },
  {
    id: 'cable-curl', name: '绳索弯举', equipment: '绳索架', substitutionGroupId: 'biceps',
    difficulty: 1, loadIncrement: { mode: 'nextPlate' },
    cues: '绳索从低位固定，肘贴身弯举至顶峰收紧一秒；全程张力连续。',
    startingHint: '首次从轻配重开始。',
  },
  {
    id: 'rope-pushdown', name: '绳索下压', equipment: '绳索架', substitutionGroupId: 'triceps',
    difficulty: 1, loadIncrement: { mode: 'nextPlate' },
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

/** 同组内按难度排序（退阶 = 找更小的 difficulty） */
export function regressionsFor(exerciseId: string): ExerciseGuide[] {
  const base = EXERCISES_BY_ID[exerciseId];
  const level = base?.difficulty;
  if (!base || level === undefined) return [];
  return EXERCISES.filter(
    (e) => e.substitutionGroupId === base.substitutionGroupId && (e.difficulty ?? 3) < level,
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
