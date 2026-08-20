/** 知识库类型（src/knowledge/v1，数据在 JSON、出处与证据强度在此约束） */

export type EvidenceLevel = 'strong' | 'moderate' | 'weak' | 'inferred';

/** 产品原则「记录事实、不评判」的落点 */
export type KbRuleType = 'fact' | 'interpretation' | 'convention';

export type KbRuleDomain =
  | 'plan'
  | 'session-design'
  | 'exercise-selection'
  | 'assessment'
  | 'measurement'
  | 'progression';

export interface KbSource {
  id: string;
  kind: 'position-stand' | 'guideline' | 'textbook' | 'meta-analysis' | 'rct' | 'review' | 'tool';
  citation: string;
  verification: 'verified' | 'unverified-detail';
  note?: string;
}

export interface KbRule {
  id: string;
  domain: KbRuleDomain;
  type: KbRuleType;
  evidence: EvidenceLevel;
  /** 引用的 source id 列表；convention/inferred 允许为空 */
  sources: string[];
  /** 面向规则引擎/维护者的规则陈述 */
  statement: string;
  note?: string;
  /** 结构化参数（如进阶增量表） */
  params?: Record<string, string | number>;
  /** 该规则在应用代码中的落点，便于双向维护 */
  implementedIn?: string[];
}

export interface KbManifest {
  kbVersion: string;
  createdAt: string;
  evidenceLevels: Record<EvidenceLevel, string>;
  typeLevels: Record<KbRuleType, string>;
}
