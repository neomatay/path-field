/**
 * 完整 / 短版 / 恢复版规则（V1_PRODUCT_CONTRACT.md 5.2）
 *
 * VARIANT-FULL-01   时间充足、无限制、准备度可训练 -> 推荐完整版（短/恢复仍可选）
 * VARIANT-SHORT-02  时间 20 分钟 ~ 完整版 79%，或精力有限 -> 推荐短版（保留 Mission 关键动作）
 * VARIANT-RECOVERY-03 caution，或很疲劳，或 < 20 分钟 -> 恢复/休息（可退出）
 * VARIANT-USER-04   用户主动改变 -> 保存选择及理由，保留当日安全限制
 *
 * "推荐"不是"更好"：完整只是时间与状态匹配；短版保留训练意图，不是失败版。
 */
import type { RiskLevel, VariantKind } from '../types';

export interface VariantRuleInput {
  riskLevel: RiskLevel;
  availableMinutes: number;
  fullVariantMinutes: number;
  readiness: 'low' | 'ok' | 'good' | 'unknown';
  /** 昨晚睡眠档位；<6 视为恢复不足，影响推荐 */
  sleepBand?: 'lt6' | '6-7' | '7-8' | 'gt8';
  /** 用户是否已主动选择了某个版本（VARIANT-USER-04） */
  userOverride?: { kind: VariantKind; reason?: string };
}

export interface VariantRuleResult {
  ruleId: 'VARIANT-FULL-01' | 'VARIANT-SHORT-02' | 'VARIANT-RECOVERY-03' | 'VARIANT-USER-04';
  recommended: VariantKind;
  /** 用户可读的推荐理由：观察到的输入 -> 建议 -> 仍不确定 */
  reason: string;
  /** 推荐版本之外仍可选的版本（完整版在 urgent/caution 下不可选/不显示开始入口） */
  selectable: VariantKind[];
  unknowns: string[];
}

export function evaluateVariant(input: VariantRuleInput): VariantRuleResult {
  // VARIANT-USER-04：用户主动选择优先于推荐，但不突破安全限制
  if (input.userOverride) {
    const blocked =
      input.riskLevel !== 'none' && input.userOverride.kind === 'full' ? true : false;
    return {
      ruleId: 'VARIANT-USER-04',
      recommended: blocked ? 'recovery' : input.userOverride.kind,
      reason: blocked
        ? '你选择了完整版，但今天存在未解除的风险限制，高强度版本仍不可用。已保留你的选择与理由。'
        : `按你的选择使用${label(input.userOverride.kind)}${input.userOverride.reason ? `（理由：${input.userOverride.reason}）` : ''}。当日安全限制继续保留。`,
      selectable: selectableFor(input.riskLevel, input.userOverride.kind),
      unknowns: ['你的选择如何影响后续计划，将在下次复盘中呈现'],
    };
  }

  // VARIANT-RECOVERY-03
  if (
    input.riskLevel === 'caution' ||
    input.availableMinutes < 20 ||
    input.readiness === 'low'
  ) {
    return {
      ruleId: 'VARIANT-RECOVERY-03',
      recommended: 'recovery',
      reason:
        input.riskLevel === 'caution'
          ? '今天有不适记录。建议恢复活动或直接休息。'
          : input.availableMinutes < 20
            ? `今天只有 ${input.availableMinutes} 分钟。恢复活动或休息都在计划内。`
            : '精力有限。建议恢复版：只记录状态，不做负荷。',
      selectable: ['recovery', 'short'],
      unknowns: [],
    };
  }

  // VARIANT-SHORT-02
  if (
    input.availableMinutes < input.fullVariantMinutes * 0.8 ||
    input.readiness === 'unknown' ||
    input.sleepBand === 'lt6'
  ) {
    return {
      ruleId: 'VARIANT-SHORT-02',
      recommended: 'short',
      reason:
        input.sleepBand === 'lt6'
          ? '昨晚睡眠不足 6 小时。建议短版：保留关键动作，今天不追容量。'
          : `完整版约 ${input.fullVariantMinutes} 分钟，今天可用 ${input.availableMinutes} 分钟。建议短版：保留关键动作，去掉非关键容量。`,
      selectable: ['short', 'recovery'],
      unknowns: [],
    };
  }

  // VARIANT-FULL-01
  return {
    ruleId: 'VARIANT-FULL-01',
    recommended: 'full',
    reason: '时间和状态都够。建议完整版，短版 / 恢复版仍可选。',
    selectable: ['full', 'short', 'recovery'],
    unknowns: [],
  };
}

function selectableFor(riskLevel: RiskLevel, chosen: VariantKind): VariantKind[] {
  const base: VariantKind[] = riskLevel === 'none' ? ['full', 'short', 'recovery'] : ['short', 'recovery'];
  return base.includes(chosen) ? base : [...base, chosen];
}

function label(kind: VariantKind): string {
  return kind === 'full' ? '完整版' : kind === 'short' ? '短版' : '恢复版';
}
