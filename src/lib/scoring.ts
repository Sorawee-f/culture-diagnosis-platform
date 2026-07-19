import {
  ARCHETYPES,
  type Archetype,
  type Scores,
  type SurveyAnswer,
  type SurveySummary,
  type SurveyType,
} from "@/types";
import { getSurveyDefinition } from "@/data/surveys";

export function emptyScores(): Scores {
  return { clan: 0, adhocracy: 0, market: 0, hierarchy: 0 };
}

export function calculateSummary(
  answers: SurveyAnswer[],
  surveyType: SurveyType,
): SurveySummary {
  const definition = getSurveyDefinition(surveyType);
  const currentScores = emptyScores();
  const desiredScores = emptyScores();

  for (const answer of answers) {
    const question = definition.questions.find(
      (item) => item.id === answer.questionId,
    );
    if (!question) throw new Error(`Unknown question: ${answer.questionId}`);

    const current = question.options.find(
      (option) => option.id === answer.currentOptionId,
    );
    const desired = question.options.find(
      (option) => option.id === answer.desiredOptionId,
    );
    if (!current || !desired) {
      throw new Error(`Invalid option in ${answer.questionId}`);
    }

    currentScores[current.archetype] += 1;
    desiredScores[desired.archetype] += 1;
  }

  const gaps = ARCHETYPES.reduce((accumulator, key) => {
    accumulator[key] = desiredScores[key] - currentScores[key];
    return accumulator;
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

export function toPercent(score: number, questionCount: number) {
  return Math.round((score / questionCount) * 100);
}
