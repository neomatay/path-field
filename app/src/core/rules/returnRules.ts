/**
 * 中断重返规则（V1_PRODUCT_CONTRACT.md 5.3）
 *
 * RETURN-14D-01   距最后一条有效 Session >= 14 天，或用户主动声明中断
 *                 -> 显示"重新确认今天"，默认提供 20 分钟重返版；不显示断练天数/欠债
 * RETURN-FIRST-02 重返后的第一节训练 -> 不以历史负荷作为今天目标；保守区间或用户选择
 * RETURN-NEXT-03  重返后 >= 1 条完成记录且无未解决信号 -> 提供节奏选项，用户确认后更新计划
 */
import type { Session, SessionOutcome } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ReturnRuleResult {
  ruleId: 'RETURN-14D-01' | 'RETURN-FIRST-02' | 'RETURN-NEXT-03' | null;
  isReturning: boolean;
  message: string;
  /** 重返版默认分钟数 */
  defaultMinutes: number;
  /** 是否抑制使用历史负荷作为目标 */
  suppressHistoryLoad: boolean;
  unresolvedCaution: boolean;
}

function validOutcomes(s: Session[]): Session[] {
  const valid: SessionOutcome[] = ['completed', 'partial', 'recovery'];
  return s.filter((x) => valid.includes(x.outcome));
}

export function evaluateReturn(
  sessions: Session[],
  now: Date,
  userDeclaredBreak: boolean,
  unresolvedCaution = false,
): ReturnRuleResult {
  const valid = validOutcomes(sessions).sort(
    (a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt),
  );
  const last = valid[0];
  const daysSince = last ? Math.floor((now.getTime() - Date.parse(last.startedAt)) / DAY_MS) : Infinity;

  if (daysSince < 14 && !userDeclaredBreak) {
    return {
      ruleId: null,
      isReturning: false,
      message: '',
      defaultMinutes: 0,
      suppressHistoryLoad: false,
      unresolvedCaution,
    };
  }

  // RETURN-14D-01：触发重新确认
  const base: ReturnRuleResult = {
    ruleId: 'RETURN-14D-01',
    isReturning: true,
    message:
      '欢迎回来。不用补回之前的进度——重新确认今天的时间、场地和状态，我们从这里继续。默认提供 20 分钟重返版。',
    defaultMinutes: 20,
    suppressHistoryLoad: true,
    unresolvedCaution,
  };

  // RETURN-FIRST-02：重返后的第一节（触发前最近一次有效记录就是中断前最后一次）
  const noneAfterBreak =
    valid.length === 0 ||
    Date.parse(valid[0].startedAt) <= (last ? now.getTime() - daysSince * DAY_MS : 0);
  if (valid.length === 0 || noneAfterBreak) {
    return {
      ...base,
      ruleId: 'RETURN-FIRST-02',
      message:
        '这是重新开始后的第一节课。今天的重量目标不代表你以前能做多少——采用保守区间，或由你自己选择；不适或过难则维持或恢复，不进阶。',
    };
  }

  // RETURN-NEXT-03：已有完成记录
  if (!unresolvedCaution) {
    return {
      ...base,
      ruleId: 'RETURN-NEXT-03',
      message:
        '已经有回来的记录了。接下来：重复同类训练、间隔后第二次训练、或继续低门槛节奏——你确认后计划才会更新。',
      suppressHistoryLoad: false,
    };
  }

  return base;
}
