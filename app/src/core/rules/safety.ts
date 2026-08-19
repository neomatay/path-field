/**
 * 安全分流规则（V1_PRODUCT_CONTRACT.md 5.1）
 *
 * 规则只输出建议与限制，不替用户完成最终选择。
 * SAFE-URGENT-01：急性红旗症状 -> urgent，停止高强度与进阶建议
 * SAFE-CAUTION-02：影响动作的明显不适/异常疲劳 -> caution，相关动作不加负荷
 * SAFE-CLEAR-03：无信号或暂不回答 -> 放行但保留风险入口，"未回答"不得表述为"安全"
 */
import type { DiscomfortLevel, RiskLevel, SafetyCheck } from '../types';

export interface SafetyRuleInput {
  /** 用户是否报告任一红旗症状：胸部不适 / 晕厥或接近晕厥 / 休息时或异常呼吸困难 / 突发或持续加重的剧烈疼痛 */
  redFlagSymptoms: boolean;
  /** 影响动作的明显不适或异常疲劳 */
  noticeableDiscomfortOrFatigue: boolean;
  /** 用户是否选择"暂不回答" */
  declinedToAnswer: boolean;
}

export interface SafetyRuleResult {
  safetyCheck: Omit<SafetyCheck, 'id' | 'answeredAt'> & { ruleId: string };
  riskLevel: RiskLevel;
  /** 建议输出（用户可读） */
  message: string;
  /** 被抑制的内容：urgent/caution 下完整版与进阶不再被建议 */
  suppresses: Array<'highIntensity' | 'loadProgression'>;
  forbidden: string[];
}

export function evaluateSafety(input: SafetyRuleInput): SafetyRuleResult {
  if (input.redFlagSymptoms) {
    return {
      safetyCheck: { checkVersion: 'v1', result: 'urgent', allAnswered: true, ruleId: 'SAFE-URGENT-01' },
      riskLevel: 'urgent',
      message:
        '先暂停高强度训练。你选择的信号（胸部不适、晕厥感、异常呼吸困难或持续加重的剧烈疼痛）超出了本产品能处理的范围，请根据情况寻求合适的专业支持。',
      suppresses: ['highIntensity', 'loadProgression'],
      forbidden: ['不诊断原因', '不提供"忍一下完成"', '不以奖励推动继续'],
    };
  }

  if (input.noticeableDiscomfortOrFatigue) {
    return {
      safetyCheck: { checkVersion: 'v1', result: 'caution', allAnswered: true, ruleId: 'SAFE-CAUTION-02' },
      riskLevel: 'caution',
      message:
        '已记录你的不适。相关动作今天不再建议加重；你可以记录、换恢复版、跳过或暂停。本产品不判断不适的原因。',
      suppresses: ['loadProgression'],
      forbidden: ['不把不适解释成酸痛、康复进展或伤病'],
    };
  }

  return {
    safetyCheck: {
      checkVersion: 'v1',
      result: 'clear',
      allAnswered: !input.declinedToAnswer,
      ruleId: 'SAFE-CLEAR-03',
    },
    riskLevel: 'none',
    message: input.declinedToAnswer
      ? '你选择暂不回答。可以继续，但本页不算作"确认安全"；风险入口始终可用。'
      : '没有收到风险信号。可以继续选择今天的训练。',
    suppresses: [],
    forbidden: ['不将"未回答"表述为"安全"'],
  };
}

/** CurrentState.discomfort 到规则输入的映射 */
export function discomfortToSafetyInput(
  discomfort: DiscomfortLevel,
  declinedToAnswer = false,
): SafetyRuleInput {
  return {
    redFlagSymptoms: discomfort === 'urgentSignal',
    noticeableDiscomfortOrFatigue: discomfort === 'noticeable',
    declinedToAnswer,
  };
}

/** urgent 的 persona 不得显示"开始完整训练"（契约 6.4） */
export function mayOfferFullVariant(riskLevel: RiskLevel): boolean {
  return riskLevel === 'none';
}
