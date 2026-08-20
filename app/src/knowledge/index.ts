/**
 * 知识库 v1 加载入口。
 * 数据在 v1/*.json（版本化、带出处）；出处与规则约束在 types.ts。
 * 修改规则或出处 = 升 kbVersion 并在 v1 下同步修改 JSON。
 */
import manifestJson from './v1/manifest.json';
import rulesJson from './v1/rules.json';
import sourcesJson from './v1/sources.json';
import type { EvidenceLevel, KbManifest, KbRule, KbRuleType, KbSource } from './types';

export const MANIFEST: KbManifest = manifestJson as KbManifest;

/** 未断言的 JSON 数组结构（vitest/tsc 对 JSON 导入的推断不满足接口的字面量类型） */
const RULES_UNTYPED = rulesJson.rules as unknown as KbRule[];
const SOURCES_UNTYPED = sourcesJson.sources as unknown as KbSource[];

export const RULES: readonly KbRule[] = RULES_UNTYPED;
export const SOURCES: readonly KbSource[] = SOURCES_UNTYPED;

export const SOURCES_BY_ID: Readonly<Record<string, KbSource>> = Object.fromEntries(
  SOURCES.map((s) => [s.id, s]),
);

export const RULES_BY_ID: Readonly<Record<string, KbRule>> = Object.fromEntries(
  RULES.map((r) => [r.id, r]),
);

export function rulesByType(type: KbRuleType): readonly KbRule[] {
  return RULES.filter((r) => r.type === type);
}

export function rulesByEvidence(evidence: EvidenceLevel): readonly KbRule[] {
  return RULES.filter((r) => r.evidence === evidence);
}

export type { KbRule, KbSource, KbManifest, EvidenceLevel, KbRuleType };
