export interface RankInfo {
  id: string;
  name: string;
  zhName: string;
  minSolved: number;
  maxSolved?: number;
  color: string;
}

export interface RankProgress {
  rank: RankInfo;
  nextRank?: RankInfo;
  solvedCount: number;
  progress: number;
  remaining: number;
}

export const RANKS: readonly RankInfo[] = [
  { id: "trainee", name: "Trainee", zhName: "训练者", minSolved: 0, maxSolved: 9, color: "var(--rank-trainee, #9CA3AF)" },
  { id: "pupil", name: "Pupil", zhName: "学徒", minSolved: 10, maxSolved: 29, color: "var(--rank-pupil, #22C55E)" },
  { id: "specialist", name: "Specialist", zhName: "专精者", minSolved: 30, maxSolved: 59, color: "var(--rank-specialist, #06B6D4)" },
  { id: "expert", name: "Expert", zhName: "专家", minSolved: 60, maxSolved: 99, color: "var(--rank-expert, #3B82F6)" },
  { id: "candidate-master", name: "Candidate Master", zhName: "候选大师", minSolved: 100, maxSolved: 149, color: "var(--rank-candidate-master, #A855F7)" },
  { id: "master", name: "Master", zhName: "大师", minSolved: 150, maxSolved: 199, color: "var(--rank-master, #F97316)" },
  { id: "grandmaster", name: "Grandmaster", zhName: "宗师", minSolved: 200, maxSolved: 249, color: "var(--rank-grandmaster, #EF4444)" },
  { id: "legendary", name: "Legendary", zhName: "传奇", minSolved: 250, color: "var(--rank-legendary, #EF4444)" },
];

function normalizeSolvedCount(solvedCount: number): number {
  return Number.isFinite(solvedCount) && solvedCount > 0 ? Math.trunc(solvedCount) : 0;
}

export function getRankBySolvedCount(solvedCount: number): RankInfo {
  const solved = normalizeSolvedCount(solvedCount);
  return RANKS.findLast((rank) => solved >= rank.minSolved) ?? RANKS[0];
}

export function getNextRank(currentRank: RankInfo): RankInfo | undefined {
  const index = RANKS.findIndex((rank) => rank.id === currentRank.id);
  return index >= 0 ? RANKS[index + 1] : undefined;
}

/** Pass the unique solved-lab count, not submission or pass-event totals. */
export function getRankProgress(solvedCount: number): RankProgress {
  const solved = normalizeSolvedCount(solvedCount);
  const rank = getRankBySolvedCount(solved);
  const nextRank = getNextRank(rank);
  if (!nextRank) return { rank, solvedCount: solved, progress: 100, remaining: 0 };

  return {
    rank,
    nextRank,
    solvedCount: solved,
    progress: Math.min(100, Math.max(0, ((solved - rank.minSolved) / (nextRank.minSolved - rank.minSolved)) * 100)),
    remaining: nextRank.minSolved - solved,
  };
}
