import { describe, expect, it } from 'vitest';
import { MANIFEST, RULES, SOURCES, SOURCES_BY_ID } from './index';
import { EXERCISES } from '../data/exercises';
import type { EvidenceLevel, KbRuleDomain, KbRuleType } from './types';

const EVIDENCE_LEVELS: EvidenceLevel[] = ['strong', 'moderate', 'weak', 'inferred'];
const RULE_TYPES: KbRuleType[] = ['fact', 'interpretation', 'convention'];
const DOMAINS: KbRuleDomain[] = [
  'plan',
  'session-design',
  'exercise-selection',
  'assessment',
  'measurement',
  'progression',
];

// ---------- 知识库结构完整性 ----------

describe('知识库 v1 结构', () => {
  it('manifest 声明的证据/类型档位与类型定义一致', () => {
    expect(Object.keys(MANIFEST.evidenceLevels).sort()).toEqual([...EVIDENCE_LEVELS].sort());
    expect(Object.keys(MANIFEST.typeLevels).sort()).toEqual([...RULE_TYPES].sort());
  });

  it('每条规则有唯一 id、合法 type/evidence/domain', () => {
    const ids = new Set<string>();
    for (const r of RULES) {
      expect(ids.has(r.id), `规则 id 重复：${r.id}`).toBe(false);
      ids.add(r.id);
      expect(RULE_TYPES).toContain(r.type);
      expect(EVIDENCE_LEVELS).toContain(r.evidence);
      expect(DOMAINS).toContain(r.domain);
      expect(r.statement.length).toBeGreaterThan(0);
    }
  });

  it('每条规则引用的 source 都存在于 sources.json', () => {
    for (const r of RULES) {
      for (const sid of r.sources) {
        expect(SOURCES_BY_ID[sid], `规则 ${r.id} 引用了不存在的 source：${sid}`).toBeDefined();
      }
    }
  });

  it('fact 型规则必须有出处（无出处的事实不是事实）', () => {
    for (const r of RULES.filter((x) => x.type === 'fact')) {
      expect(r.sources.length, `fact 规则 ${r.id} 缺少 sources`).toBeGreaterThan(0);
    }
  });

  it('source id 唯一', () => {
    const ids = new Set(SOURCES.map((s) => s.id));
    expect(ids.size).toBe(SOURCES.length);
  });
});

// ---------- 与应用数据的交叉校验 ----------

describe('知识库与动作库的一致性', () => {
  it('每个动作都标注难度与进阶增量（KB-PROG-02 的落库要求）', () => {
    for (const e of EXERCISES) {
      expect(e.difficulty, `${e.id} 缺少 difficulty`).toBeDefined();
      expect(e.loadIncrement, `${e.id} 缺少 loadIncrement`).toBeDefined();
    }
  });

  it('小肌群孤立动作不以固定重量增量进阶（+2.5kg 对侧平举是 5-10% 跳跃）', () => {
    const repsOnly = new Set(['lateral-raise', 'pull-up', 'plank']);
    for (const id of repsOnly) {
      const e = EXERCISES.find((x) => x.id === id);
      expect(e?.loadIncrement?.mode, `${id} 应为次数进阶`).toBe('repsOnly');
    }
  });

  it('KB-PROG-02 的增量表参数齐全', () => {
    const prog = RULES.find((r) => r.id === 'KB-PROG-02');
    expect(prog).toBeDefined();
    expect(prog?.params).toMatchObject({
      barbellLower: '+5kg',
      barbellUpper: '+2.5kg',
    });
  });

  it('知识库覆盖的模式组在动作库中存在（horizontal-pull / vertical-push / single-leg / core / biceps / knee-flexion / calf）', () => {
    const groups = new Set(EXERCISES.map((e) => e.substitutionGroupId));
    for (const g of [
      'quad-push',
      'hip-hinge-glute',
      'chest-press',
      'incline-press',
      'vertical-push',
      'vertical-pull',
      'horizontal-pull',
      'single-leg',
      'core',
      'biceps',
      'triceps',
      'knee-flexion',
      'calf',
    ]) {
      expect(groups.has(g), `动作库缺少模式组：${g}`).toBe(true);
    }
  });
});
