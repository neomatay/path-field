import { describe, expect, it } from 'vitest';
import { discomfortToSafetyInput, evaluateSafety, mayOfferFullVariant } from './safety';
import { evaluateVariant } from './variant';
import { evaluateReturn } from './returnRules';
import { buildComparableGroups, buildProgressionCandidates, evaluateWeeklyReview } from './reviewRules';
import type { ActualBlock, Session } from '../types';
import { EXERCISES, substitutionsFor } from '../../data/exercises';
import { TEMPLATES, instantiateProgram } from '../../data/templates';

// ---------- SAFE ----------

describe('安全分流', () => {
  it('红旗症状 -> urgent，抑制高强度与进阶（SAFE-URGENT-01）', () => {
    const r = evaluateSafety({ redFlagSymptoms: true, noticeableDiscomfortOrFatigue: false, declinedToAnswer: false });
    expect(r.safetyCheck.result).toBe('urgent');
    expect(r.safetyCheck.ruleId).toBe('SAFE-URGENT-01');
    expect(r.suppresses).toContain('highIntensity');
    expect(mayOfferFullVariant(r.riskLevel)).toBe(false);
  });

  it('明显不适 -> caution，抑制加负荷但仍可训练（SAFE-CAUTION-02）', () => {
    const r = evaluateSafety({ redFlagSymptoms: false, noticeableDiscomfortOrFatigue: true, declinedToAnswer: false });
    expect(r.safetyCheck.result).toBe('caution');
    expect(r.suppresses).toEqual(['loadProgression']);
    expect(mayOfferFullVariant(r.riskLevel)).toBe(false);
  });

  it('暂不回答 -> 放行但不得表述为"安全"（SAFE-CLEAR-03）', () => {
    const r = evaluateSafety({ redFlagSymptoms: false, noticeableDiscomfortOrFatigue: false, declinedToAnswer: true });
    expect(r.safetyCheck.result).toBe('clear');
    expect(r.safetyCheck.allAnswered).toBe(false);
    expect(r.message).toContain('不算作"确认安全"');
  });

  it('discomfort=urgentSignal 映射到红旗输入', () => {
    const input = discomfortToSafetyInput('urgentSignal');
    expect(input.redFlagSymptoms).toBe(true);
  });
});

// ---------- VARIANT ----------

describe('版本选择', () => {
  const full = 55;

  it('时间充足且状态可训练 -> 完整版（VARIANT-FULL-01）', () => {
    const r = evaluateVariant({ riskLevel: 'none', availableMinutes: 55, fullVariantMinutes: full, readiness: 'ok' });
    expect(r.ruleId).toBe('VARIANT-FULL-01');
    expect(r.selectable).toContain('short'); // 短版仍是可见选项
  });

  it('25 分钟（55 的 45%）-> 短版（VARIANT-SHORT-02）', () => {
    const r = evaluateVariant({ riskLevel: 'none', availableMinutes: 25, fullVariantMinutes: full, readiness: 'ok' });
    expect(r.ruleId).toBe('VARIANT-SHORT-02');
    expect(r.selectable).not.toContain('full');
  });

  it('caution -> 恢复版（VARIANT-RECOVERY-03）', () => {
    const r = evaluateVariant({ riskLevel: 'caution', availableMinutes: 60, fullVariantMinutes: full, readiness: 'good' });
    expect(r.ruleId).toBe('VARIANT-RECOVERY-03');
  });

  it('用户改选短版被尊重（VARIANT-USER-04）', () => {
    const r = evaluateVariant({
      riskLevel: 'none', availableMinutes: 55, fullVariantMinutes: full, readiness: 'good',
      userOverride: { kind: 'short', reason: '临时加班' },
    });
    expect(r.ruleId).toBe('VARIANT-USER-04');
    expect(r.recommended).toBe('short');
  });

  it('caution 下用户强行选完整版仍被安全限制挡住', () => {
    const r = evaluateVariant({
      riskLevel: 'caution', availableMinutes: 60, fullVariantMinutes: full, readiness: 'good',
      userOverride: { kind: 'full' },
    });
    expect(r.recommended).not.toBe('full');
  });
});

// ---------- RETURN ----------

function sessionAt(id: string, daysAgo: number, outcome: Session['outcome'] = 'completed'): Session {
  return {
    id, createdAt: '', programId: null, plannedSessionId: null,
    startedAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    outcome, selectedVariant: 'full', actualBlocks: [], adjustments: [],
    checkOut: { discomfort: 'unknown' }, safetyEvents: [],
  };
}

describe('中断重返', () => {
  it('距上次有效训练 >= 14 天 -> 触发重新确认（RETURN-14D-01）', () => {
    const r = evaluateReturn([sessionAt('s1', 20)], new Date(), false);
    expect(r.isReturning).toBe(true);
    expect(r.defaultMinutes).toBe(20);
    expect(r.suppressHistoryLoad).toBe(true);
    expect(r.message).not.toContain('断练天数');
  });

  it('skipped 不算有效记录', () => {
    const r = evaluateReturn([sessionAt('s1', 20, 'skipped')], new Date(), false);
    expect(r.isReturning).toBe(true);
  });

  it('8 天中断不触发', () => {
    const r = evaluateReturn([sessionAt('s1', 8)], new Date(), false);
    expect(r.isReturning).toBe(false);
  });

  it('用户主动声明中断也触发', () => {
    const r = evaluateReturn([sessionAt('s1', 3)], new Date(), true);
    expect(r.isReturning).toBe(true);
  });

  it('无任何记录 -> RETURN-FIRST-02，不用历史负荷', () => {
    const r = evaluateReturn([], new Date(), false);
    expect(r.ruleId).toBe('RETURN-FIRST-02');
  });
});

// ---------- REVIEW ----------

function sessionWithBlock(id: string, daysAgo: number, exId: string, weight: number, reps: number, rpe: number): Session {
  const block: ActualBlock = {
    exerciseId: exId,
    sets: [{ setIndex: 0, weightKg: weight, reps, rpe }],
  };
  return { ...sessionAt(id, daysAgo), actualBlocks: [block] };
}

describe('周复盘', () => {
  it('本周无记录 -> 只能陈述已发生与缺失（REVIEW-WEEK-LOW-01）', () => {
    const r = evaluateWeeklyReview([], false);
    expect(r.ruleId).toBe('REVIEW-WEEK-LOW-01');
    expect(r.observations).toHaveLength(0);
    expect(r.options.length).toBeGreaterThanOrEqual(3);
  });

  it('单次记录不可比较 -> 不产生表现观察', () => {
    const r = evaluateWeeklyReview([sessionWithBlock('s1', 2, 'leg-press', 80, 10, 8)], false);
    expect(r.ruleId).toBe('REVIEW-WEEK-LOW-01');
    expect(r.toConfirm.join()).toContain('不足 2 组');
  });

  it('两次相近条件记录 -> 可陈述稳定/变化，但不得宣称能力提升（REVIEW-WEEK-SIGNAL-02）', () => {
    const r = evaluateWeeklyReview([
      sessionWithBlock('s1', 6, 'leg-press', 80, 10, 8),
      sessionWithBlock('s2', 2, 'leg-press', 85, 10, 8),
    ], false);
    expect(r.ruleId).toBe('REVIEW-WEEK-SIGNAL-02');
    expect(r.observations[0].boundary).toContain('不能推出整体能力');
    expect(r.options.some((o) => o.id === 'small-progress')).toBe(true);
  });

  it('RPE 档差异大的两组不构成可比', () => {
    const groups = buildComparableGroups([
      sessionWithBlock('s1', 6, 'leg-press', 80, 10, 6),
      sessionWithBlock('s2', 2, 'leg-press', 85, 10, 10),
    ]);
    expect(groups).toHaveLength(0);
  });

  it('达到区间上限且难度未升 -> 候选 +2.5kg，不自动生效', () => {
    const candidates = buildProgressionCandidates(
      [sessionWithBlock('s1', 6, 'leg-press', 80, 12, 8), sessionWithBlock('s2', 2, 'leg-press', 80, 12, 8)],
      { 'leg-press': { maxReps: 12 } },
    );
    expect(candidates).toHaveLength(1);
    expect(candidates[0].candidateWeightKg).toBe(82.5);
    expect(candidates[0].reason).toContain('由你决定');
  });
});

// ---------- 数据 ----------

describe('训练内容最小集', () => {
  it('每个关键动作至少有 1 个替换', () => {
    const keys = EXERCISES.filter((e) => e.isCompoundKey);
    expect(keys.length).toBeGreaterThanOrEqual(6);
    for (const k of keys) {
      expect(substitutionsFor(k.id).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('三套模板齐全且短版时长 <= 20 分钟', () => {
    expect(TEMPLATES.map((t) => t.path).sort()).toEqual(['progressing', 'returning', 'routine']);
    for (const t of TEMPLATES) {
      expect(t.variants.short.estimatedMinutes).toBeLessThanOrEqual(20);
      expect(t.variants.recovery.estimatedMinutes).toBeLessThanOrEqual(10);
      expect(t.sessions.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('模板动作都在动作库中', () => {
    const ids = new Set(EXERCISES.map((e) => e.id));
    for (const t of TEMPLATES) {
      for (const s of t.sessions) {
        for (const b of s.blocks) {
          expect(ids.has(b.exerciseId)).toBe(true);
        }
      }
    }
  });

  it('模板实例化为 draft，需确认才激活', () => {
    const p = instantiateProgram(TEMPLATES[2], 'm1');
    expect(p.status).toBe('draft');
    expect(p.missionId).toBe('m1');
  });
});
