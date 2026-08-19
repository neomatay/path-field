/**
 * 本地优先存储层（ROADMAP_v0_2.md 第 7 节）
 * IndexedDB（经 idb）+ 一键 JSON 导出/导入。
 * 数据安全约定：iOS 会清理未安装 PWA 的站点数据 —— UI 须引导"添加到主屏幕"，并在训练结束提示导出。
 */
import { openDB, type IDBPDatabase } from 'idb';
import type {
  BodyMetric,
  CurrentState,
  Decision,
  Evidence,
  Mission,
  Program,
  Review,
  SafetyCheck,
  Session,
} from '../core/types';

const DB_NAME = 'path-field';
const DB_VERSION = 2;

/** 对象仓与主键；所有记录以 id 为主键，索引按查询需要补 */
export const STORES = [
  'safetyChecks',
  'currentStates',
  'missions',
  'programs',
  'sessions',
  'evidence',
  'reviews',
  'decisions',
  'bodyMetrics',
] as const;

export type StoreName = (typeof STORES)[number];

export interface PathFieldSnapshot {
  exportedAt: string;
  version: 2;
  safetyChecks: SafetyCheck[];
  currentStates: CurrentState[];
  missions: Mission[];
  programs: Program[];
  sessions: Session[];
  evidence: Evidence[];
  reviews: Review[];
  decisions: Decision[];
  bodyMetrics: BodyMetric[];
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const store of STORES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        }
      },
    });
  }
  return dbPromise;
}

export async function put<T extends { id: string }>(store: StoreName, value: T): Promise<T> {
  const db = await getDB();
  await db.put(store, value);
  return value;
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  const db = await getDB();
  return db.getAll(store) as Promise<T[]>;
}

export async function get<T>(store: StoreName, id: string): Promise<T | undefined> {
  const db = await getDB();
  return db.get(store, id) as Promise<T | undefined>;
}

export async function remove(store: StoreName, id: string): Promise<void> {
  const db = await getDB();
  await db.delete(store, id);
}

// ---------- 导出 / 导入 ----------

export async function exportSnapshot(): Promise<PathFieldSnapshot> {
  const [safetyChecks, currentStates, missions, programs, sessions, evidence, reviews, decisions, bodyMetrics] =
    await Promise.all(STORES.map((s) => getAll(s)));
  return {
    exportedAt: new Date().toISOString(),
    version: 2,
    safetyChecks: safetyChecks as SafetyCheck[],
    currentStates: currentStates as CurrentState[],
    missions: missions as Mission[],
    programs: programs as Program[],
    sessions: sessions as Session[],
    evidence: evidence as Evidence[],
    reviews: reviews as Review[],
    decisions: decisions as Decision[],
    bodyMetrics: bodyMetrics as BodyMetric[],
  };
}

export function downloadSnapshot(snapshot: PathFieldSnapshot): void {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `path-field-export-${snapshot.exportedAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** 导入为合并写入（同 id 覆盖）；不删除本地已有数据。兼容 v1 导出（无 bodyMetrics 字段）。 */
export async function importSnapshot(snapshot: PathFieldSnapshot): Promise<void> {
  const version = snapshot.version as number
  if (version !== 1 && version !== 2) {
    throw new Error(`不支持的导出版本：${version}`);
  }
  const db = await getDB();
  const tx = db.transaction(STORES as unknown as string[], 'readwrite');
  for (const store of STORES) {
    const records = (snapshot as unknown as Record<string, Array<{ id: string }>>)[store] ?? [];
    const os = tx.objectStore(store);
    for (const record of records) os.put(record);
  }
  await tx.done;
}
