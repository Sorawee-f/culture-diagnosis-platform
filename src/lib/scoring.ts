import { ARCHETYPES, type Archetype, type Scores, type SurveyAnswer, type SurveySummary } from "@/types";
import { SCENARIOS } from "@/data/scenarios";

export function emptyScores(): Scores {
  return { clan: 0, adhocracy: 0, market: 0, hierarchy: 0 };
}

export function calculateSummary(answers: SurveyAnswer[]): SurveySummary {
  const currentScores = emptyScores();
  const desiredScores = emptyScores();

  for (const answer of answers) {
    const scenario = SCENARIOS.find((item) => item.id === answer.scenarioId);
    if (!scenario) throw new Error(`Unknown scenario: ${answer.scenarioId}`);
    const current = scenario.options.find((option) => option.id === answer.currentOptionId);
    const desired = scenario.options.find((option) => option.id === answer.desiredOptionId);
    if (!current || !desired) throw new Error(`Invalid option in ${answer.scenarioId}`);
    currentScores[current.archetype] += 1;
    desiredScores[desired.archetype] += 1;
  }

  const gaps = ARCHETYPES.reduce((acc, key) => {
    acc[key] = desiredScores[key] - currentScores[key];
    return acc;
  }, emptyScores());

  return {
    currentScores,
    desiredScores,
    gaps,
    currentTop: findTop(currentScores),
    desiredTop: findTop(desiredScores),
  };
}

export function findTop(scores: Scores): Archetype[] {
  const max = Math.max(...Object.values(scores));
  return ARCHETYPES.filter((key) => scores[key] === max);
}

export function toPercent(score: number) {
  return Math.round((score / SCENARIOS.length) * 100);
}
