/**
 * 统计聚合。全是纯函数,不 import vscode —— 这样能直接用 node:test 跑单测。
 *
 * countPassed 和 navFor 都因为宿主文件 import 了 vscode 而测不了,heatmap 的
 * 日期分桶和色阶分档是最容易出 off-by-one 的地方,必须能测；章节统计也覆盖 Project。
 */

export interface ActivityEvent {
  at: string;
  kind: "submit" | "pass";
  labName: string;
  labType: "program" | "quiz" | "project";
}

export interface Counters {
  submissions: number;
  passes: number;
  labsAttempted: number;
  labsPassed: number;
}

export interface HeatmapCell {
  /** 本地日期 YYYY-MM-DD。 */
  date: string;
  count: number;
  /** 0 表示无活动,1-4 为强度分档。 */
  level: 0 | 1 | 2 | 3 | 4;
}

export interface Heatmap {
  cells: HeatmapCell[];
  max: number;
  total: number;
}

export interface TrendPoint {
  date: string;
  cumulativePasses: number;
}

export interface ChapterBar {
  chapter: number;
  chapterTitle: string;
  passed: number;
  total: number;
}

/** 本地时区的 YYYY-MM-DD。不能截 ISO 字符串 —— 那是 UTC,非 UTC 时区会错一天。 */
export function localDateKey(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function countActivity(events: readonly ActivityEvent[]): Counters {
  const submitted = new Set<string>();
  const passed = new Set<string>();
  let submissions = 0;
  let passes = 0;

  for (const event of events) {
    if (event.kind === "submit") {
      submissions += 1;
      submitted.add(event.labName);
    } else {
      passes += 1;
      passed.add(event.labName);
    }
  }

  // 通过过的题一定提交过,但历史回填可能只留下 pass,所以合并进去保证不少算。
  for (const name of passed) submitted.add(name);

  return { submissions, passes, labsAttempted: submitted.size, labsPassed: passed.size };
}

/**
 * 把 [from, to] 每一天都建一格,即使没有活动 —— heatmap 需要连续网格,
 * 缺失的日子必须是 level 0 的空格子,不能跳过。
 */
export function buildHeatmap(
  events: readonly ActivityEvent[],
  kind: "submit" | "pass",
  from: Date,
  to: Date,
): Heatmap {
  const counts = new Map<string, number>();
  for (const event of events) {
    if (event.kind !== kind) continue;
    const key = localDateKey(event.at);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const cells: HeatmapCell[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  let max = 0;
  let total = 0;

  while (cursor <= end) {
    const pad = (n: number) => String(n).padStart(2, "0");
    const key = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`;
    const count = counts.get(key) ?? 0;
    if (count > max) max = count;
    total += count;
    cells.push({ date: key, count, level: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const cell of cells) cell.level = intensity(cell.count, max);
  return { cells, max, total };
}

/**
 * 色阶分档。相对最大值分四档 —— 固定阈值对不同强度的用户都不合适:
 * 一天 2 次的人全是浅色,一天 50 次的人全是深色。
 */
export function intensity(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (max <= 1) return 1;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

/** 累计通过数随时间的变化。单调不减 —— 累计量不会掉下来。 */
export function buildTrend(events: readonly ActivityEvent[]): TrendPoint[] {
  const perDay = new Map<string, number>();
  for (const event of events) {
    if (event.kind !== "pass") continue;
    const key = localDateKey(event.at);
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }

  const points: TrendPoint[] = [];
  let running = 0;
  for (const date of [...perDay.keys()].sort()) {
    running += perDay.get(date) ?? 0;
    points.push({ date, cumulativePasses: running });
  }
  return points;
}

/**
 * 从 v1 的提交历史回填活动事件。schema 迁移的核心逻辑。
 *
 * 抽成纯函数是因为这段代码能毁掉用户积累的进度数据 —— 它必须能测。
 * 放在 progress.ts 里就测不了(那个文件 import 了 vscode)。
 *
 * 只回填代码题:选择题的 v1 数据只有一个会被覆盖的 answeredAt,
 * 回填出来的数会误导人,不如从迁移之后重新记。
 */
export function backfillEvents(
  labs: Record<string, { history?: { at: string; verdict: string; score: number; maxScore: number }[] }>,
): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const [labName, progress] of Object.entries(labs)) {
    for (const entry of progress.history ?? []) {
      events.push({ at: entry.at, kind: "submit", labName, labType: "program" });
      // maxScore > 0 这个 guard 不能省:编译错误时 cases 为空、score 和 maxScore
      // 都是 0,只比 score === maxScore 会把 CE 当成通过。
      if (entry.verdict === "AC" && entry.maxScore > 0 && entry.score === entry.maxScore) {
        events.push({ at: entry.at, kind: "pass", labName, labType: "program" });
      }
    }
  }

  return events.sort((a, b) => a.at.localeCompare(b.at));
}

/**
 * 生成用于预览图表效果的假数据。只在 dsaMastery.stats.mockData 打开时使用。
 *
 * 用固定 seed 的线性同余,不用 Math.random —— 每次打开面板看到同一张图,
 * 否则没法判断样式改动的效果(图形一直在变,分不清是改动还是随机)。
 *
 * 形状刻意做得像真实做题:工作日多、周末少,中间有几天完全空着。
 */
export function mockEvents(days: number, endDate: Date): ActivityEvent[] {
  let seed = 20260901;
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const events: ActivityEvent[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - offset);
    const weekend = day.getDay() === 0 || day.getDay() === 6;
    const roll = next();

    // 周末和约三成的工作日留空,让 heatmap 有疏密对比而不是糊成一片。
    if (roll < (weekend ? 0.75 : 0.3)) continue;

    const submits = 1 + Math.floor(next() * (weekend ? 3 : 6));
    for (let i = 0; i < submits; i += 1) {
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9 + Math.floor(next() * 12)).toISOString();
      const labName = `mock-lab-${Math.floor(next() * 60)}`;
      events.push({ at, kind: "submit", labName, labType: next() < 0.75 ? "program" : "quiz" });
      // 约四成提交通过 —— 通过图比提交图稀疏,两个面板才有区别。
      if (next() < 0.4) {
        events.push({ at, kind: "pass", labName, labType: "program" });
      }
    }
  }
  return events.sort((a, b) => a.at.localeCompare(b.at));
}

/**
 * 章节分布。按 lab 的 type 去对应的进度表查 —— 和 countPassed 同一个道理,
 * 三种题型的进度存在不同的状态路径里。
 */
export function buildChapterBars(
  chapters: readonly { chapter: number; chapterTitle: string; labs: readonly { id?: string; name: string; type: "program" | "quiz" | "project" }[] }[],
  isPassed: (name: string, type: "program" | "quiz" | "project") => boolean,
): ChapterBar[] {
  return chapters.map((chapter) => ({
    chapter: chapter.chapter,
    chapterTitle: chapter.chapterTitle,
    passed: chapter.labs.filter((lab) => isPassed(lab.id ?? lab.name, lab.type)).length,
    total: chapter.labs.length,
  }));
}
