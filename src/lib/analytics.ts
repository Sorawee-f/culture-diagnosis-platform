import { ARCHETYPE_META } from "@/data/archetypes";
import { getSurveyDefinition } from "@/data/surveys";
import {
  ARCHETYPES,
  type Archetype,
  type Scores,
  type SurveyAnswer,
  type SurveyType,
} from "@/types";

export type AggregateResponse = {
  survey_type: SurveyType;
  answers: SurveyAnswer[];
  current_scores: Scores;
  desired_scores: Scores;
  gaps: Scores;
  duration_seconds: number | null;
  bu: string | null;
  department: string | null;
  section: string | null;
  job_level: string | null;
  submitted_at: string;
};

export function aggregateResponses(
  rows: AggregateResponse[],
  surveyType: SurveyType,
) {
  const definition = getSurveyDefinition(surveyType);
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

  const maxPoints = Math.max(1, rows.length * definition.questions.length);
  const currentPct = toPercentScores(current, maxPoints);
  const desiredPct = toPercentScores(desired, maxPoints);
  const gapPct = ARCHETYPES.reduce((accumulator, key) => {
    accumulator[key] = round1(desiredPct[key] - currentPct[key]);
    return accumulator;
  }, zero());

  const durations = rows
    .map((row) => Number(row.duration_seconds))
    .filter((value) => Number.isFinite(value) && value > 0);

  return {
    responseCount: rows.length,
    current,
    desired,
    gaps,
    currentPct,
    desiredPct,
    gapPct,
    averageDurationSeconds: durations.length
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
      : 0,
    currentRanking: rank(currentPct),
    desiredRanking: rank(desiredPct),
    gapRanking: rank(gapPct, true),
    suggestions: deriveSuggestions(currentPct, desiredPct, gapPct, rows.length),
    dimensions: aggregateDimensions(rows, surveyType),
  };
}

function aggregateDimensions(rows: AggregateResponse[], surveyType: SurveyType) {
  const definition = getSurveyDefinition(surveyType);
  return definition.questions.map((question) => {
    const current = zero();
    const desired = zero();

    rows.forEach((row) => {
      const answer = row.answers?.find((item) => item.questionId === question.id);
      if (!answer) return;
      const currentOption = question.options.find(
        (option) => option.id === answer.currentOptionId,
      );
      const desiredOption = question.options.find(
        (option) => option.id === answer.desiredOptionId,
      );
      if (currentOption) current[currentOption.archetype] += 1;
      if (desiredOption) desired[desiredOption.archetype] += 1;
    });

    const denominator = Math.max(1, rows.length);
    const currentPct = toPercentScores(current, denominator);
    const desiredPct = toPercentScores(desired, denominator);

    return {
      id: question.id,
      dimension: question.dimension,
      title: question.title,
      currentPct,
      desiredPct,
      currentTop: topKeys(currentPct),
      desiredTop: topKeys(desiredPct),
    };
  });
}

function zero(): Scores {
  return { clan: 0, adhocracy: 0, market: 0, hierarchy: 0 };
}

function toPercentScores(scores: Scores, denominator: number): Scores {
  return ARCHETYPES.reduce((accumulator, key) => {
    accumulator[key] = round1((scores[key] / denominator) * 100);
    return accumulator;
  }, zero());
}

function rank(scores: Scores, signed = false) {
  return ARCHETYPES.map((key) => ({ key, value: scores[key] }))
    .sort((a, b) => (signed ? b.value - a.value : b.value - a.value))
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

function topKeys(scores: Scores) {
  const max = Math.max(...ARCHETYPES.map((key) => scores[key]));
  return ARCHETYPES.filter((key) => scores[key] === max);
}

function deriveSuggestions(
  currentPct: Scores,
  desiredPct: Scores,
  gapPct: Scores,
  count: number,
) {
  if (!count) return [];

  const build = ARCHETYPES.map((key) => ({
    key,
    gap: gapPct[key],
    desiredPct: desiredPct[key],
  }))
    .filter((item) => item.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 2)
    .map((item) => ({
      type: "BUILD",
      archetype: item.key,
      title: ARCHETYPE_META[item.key].theme,
      detail: `Desired สูงกว่า Current ${item.gap} จุดเปอร์เซ็นต์`,
    }));

  const maintain = ARCHETYPES.map((key) => ({
    key,
    currentPct: currentPct[key],
    desiredPct: desiredPct[key],
  }))
    .filter((item) => item.currentPct >= 25 && item.desiredPct >= 25)
    .sort((a, b) => b.desiredPct - a.desiredPct)
    .slice(0, 1)
    .map((item) => ({
      type: "MAINTAIN",
      archetype: item.key,
      title: `รักษาจุดแข็ง: ${ARCHETYPE_META[item.key].theme}`,
      detail: `Current ${item.currentPct}% และ Desired ${item.desiredPct}%`,
    }));

  const reduce = ARCHETYPES.map((key) => ({
    key,
    gap: gapPct[key],
    currentPct: currentPct[key],
  }))
    .filter((item) => item.gap < 0)
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 1)
    .map((item) => ({
      type: "REBALANCE",
      archetype: item.key,
      title:
        item.key === "hierarchy"
          ? "ลดขั้นตอนที่ไม่จำเป็นและเพิ่มอำนาจตัดสินใจ"
          : `ปรับสมดุล ${ARCHETYPE_META[item.key].label}`,
      detail: `Current สูงกว่า Desired ${Math.abs(item.gap)} จุดเปอร์เซ็นต์`,
    }));

  return [...build, ...maintain, ...reduce];
}

export function compareAggregates(
  scenario: ReturnType<typeof aggregateResponses>,
  simple: ReturnType<typeof aggregateResponses>,
) {
  const currentDifference = zero();
  const desiredDifference = zero();
  const gapDifference = zero();

  ARCHETYPES.forEach((key) => {
    currentDifference[key] = round1(simple.currentPct[key] - scenario.currentPct[key]);
    desiredDifference[key] = round1(simple.desiredPct[key] - scenario.desiredPct[key]);
    gapDifference[key] = round1(simple.gapPct[key] - scenario.gapPct[key]);
  });

  const currentMad = meanAbsoluteDifference(scenario.currentPct, simple.currentPct);
  const desiredMad = meanAbsoluteDifference(scenario.desiredPct, simple.desiredPct);
  const gapDirectionMatch = ARCHETYPES.filter(
    (key) => Math.sign(scenario.gapPct[key]) === Math.sign(simple.gapPct[key]),
  ).length;

  return {
    currentDifference,
    desiredDifference,
    gapDifference,
    currentMeanAbsoluteDifference: currentMad,
    desiredMeanAbsoluteDifference: desiredMad,
    currentTopMatch:
      scenario.currentRanking[0]?.key === simple.currentRanking[0]?.key,
    desiredTopMatch:
      scenario.desiredRanking[0]?.key === simple.desiredRanking[0]?.key,
    gapDirectionMatchCount: gapDirectionMatch,
    gapDirectionMatchPercent: Math.round((gapDirectionMatch / ARCHETYPES.length) * 100),
  };
}

function meanAbsoluteDifference(a: Scores, b: Scores) {
  return round1(
    ARCHETYPES.reduce((sum, key) => sum + Math.abs(a[key] - b[key]), 0) /
      ARCHETYPES.length,
  );
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export function archetypeLabel(key: Archetype) {
  return ARCHETYPE_META[key].label;
}
