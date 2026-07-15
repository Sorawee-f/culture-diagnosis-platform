import { ARCHETYPE_META } from "@/data/archetypes";
import { ARCHETYPES, type Archetype, type Scores } from "@/types";

export type AggregateResponse = {
  current_scores: Scores;
  desired_scores: Scores;
  gaps: Scores;
  bu: string | null;
  department: string | null;
  section: string | null;
  job_level: string | null;
  submitted_at: string;
};

export function aggregateResponses(rows: AggregateResponse[]) {
  const current = zero();
  const desired = zero();
  const gaps = zero();
  rows.forEach((row) => {
    ARCHETYPES.forEach((key) => {
      current[key] += Number(row.current_scores?.[key] ?? 0);
      desired[key] += Number(row.desired_scores?.[key] ?? 0);
      gaps[key] += Number(row.gaps?.[key] ?? 0);
    });
  });

  const currentRanking = rank(current);
  const desiredRanking = rank(desired);
  const gapRanking = rank(gaps, true);
  return {
    current,
    desired,
    gaps,
    currentRanking,
    desiredRanking,
    gapRanking,
    suggestions: deriveSuggestions(current, desired, gaps, rows.length),
  };
}

function zero(): Scores {
  return { clan: 0, adhocracy: 0, market: 0, hierarchy: 0 };
}

function rank(scores: Scores, signed = false) {
  return ARCHETYPES.map((key) => ({ key, value: scores[key] }))
    .sort((a, b) => signed ? b.value - a.value : b.value - a.value)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

function deriveSuggestions(current: Scores, desired: Scores, gaps: Scores, count: number) {
  if (!count) return [];
  const maxPoints = count * 12;
  const pct = (v: number) => Math.round((v / maxPoints) * 100);

  const build = ARCHETYPES
    .map((key) => ({ key, gap: gaps[key], desiredPct: pct(desired[key]) }))
    .filter((x) => x.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 2)
    .map((x) => ({
      type: "BUILD",
      archetype: x.key,
      title: ARCHETYPE_META[x.key].theme,
      detail: `Desired สูงกว่า Current ${Math.abs(x.gap)} คะแนนรวม (${x.desiredPct}% ของคำตอบ Desired)`,
    }));

  const maintain = ARCHETYPES
    .map((key) => ({ key, currentPct: pct(current[key]), desiredPct: pct(desired[key]) }))
    .filter((x) => x.currentPct >= 25 && x.desiredPct >= 25)
    .sort((a, b) => b.desiredPct - a.desiredPct)
    .slice(0, 1)
    .map((x) => ({
      type: "MAINTAIN",
      archetype: x.key,
      title: `รักษาจุดแข็ง: ${ARCHETYPE_META[x.key].theme}`,
      detail: `Current ${x.currentPct}% และ Desired ${x.desiredPct}%`,
    }));

  const reduce = ARCHETYPES
    .map((key) => ({ key, gap: gaps[key], currentPct: pct(current[key]) }))
    .filter((x) => x.gap < 0)
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 1)
    .map((x) => ({
      type: "REBALANCE",
      archetype: x.key,
      title: x.key === "hierarchy" ? "ลดขั้นตอนที่ไม่จำเป็นและเพิ่มอำนาจตัดสินใจ" : `ปรับสมดุล ${ARCHETYPE_META[x.key].label}`,
      detail: `Current สูงกว่า Desired ${Math.abs(x.gap)} คะแนนรวม`,
    }));

  return [...build, ...maintain, ...reduce];
}

export function archetypeLabel(key: Archetype) {
  return ARCHETYPE_META[key].label;
}
