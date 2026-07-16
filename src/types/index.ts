export const ARCHETYPES = ["clan", "adhocracy", "market", "hierarchy"] as const;
export type Archetype = (typeof ARCHETYPES)[number];

export type Scores = Record<Archetype, number>;

export type ScenarioOption = {
  id: string;
  label: string;
  archetype: Archetype;
};

export type Scenario = {
  id: string;
  dimension: string;
  title: string;
  prompt: string;
  options: ScenarioOption[];
};

export type SurveyAnswer = {
  scenarioId: string;
  currentOptionId: string;
  desiredOptionId: string;
};

export type SurveySummary = {
  currentScores: Scores;
  desiredScores: Scores;
  gaps: Scores;
  currentTop: Archetype[];
  desiredTop: Archetype[];
};

export type EmployeeSession = {
  role: "employee";
  employeeId: string;
  name: string;
};

export type AdminSession = {
  role: "admin";
  username: string;
};
