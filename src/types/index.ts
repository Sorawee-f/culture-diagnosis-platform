export const ARCHETYPES = ["clan", "adhocracy", "market", "hierarchy"] as const;
export type Archetype = (typeof ARCHETYPES)[number];

export const SURVEY_TYPES = ["scenario", "simple"] as const;
export type SurveyType = (typeof SURVEY_TYPES)[number];

export const SURVEY_MODES = ["side_by_side", "sequential"] as const;
export type SurveyMode = (typeof SURVEY_MODES)[number];

export type OrderGroup = "scenario_first" | "simple_first";
export type Scores = Record<Archetype, number>;

export type SurveyOption = {
  id: string;
  label: string;
  archetype: Archetype;
};

export type SurveyQuestion = {
  id: string;
  dimension: string;
  dimensionKey: string;
  title: string;
  prompt: string;
  options: SurveyOption[];
};

export type SurveyDefinition = {
  type: SurveyType;
  name: string;
  shortName: string;
  description: string;
  itemLabel: string;
  questions: SurveyQuestion[];
};

export type SurveyAnswer = {
  questionId: string;
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

export type SurveyExperienceRatings = {
  easyToUnderstand: number;
  reflectsReality: number;
  currentDesiredClear: number;
  appropriateLength: number;
  suitableForAllLevels: number;
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
