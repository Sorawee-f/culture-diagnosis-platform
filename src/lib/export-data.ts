import { ARCHETYPE_META } from "@/data/archetypes";
import { SCENARIO_QUESTIONS } from "@/data/surveys";
import type { Scores, SurveyAnswer } from "@/types";

export type ExportParticipant = {
  employee_id: string;
  name: string | null;
  surname: string | null;
  nickname: string | null;
  bu: string | null;
  department: string | null;
  section: string | null;
  job_level: string | null;
  status: string;
  completed: boolean;
  submitted_at: string | null;
  duration_seconds: number | null;
  answers: SurveyAnswer[] | null;
  current_scores: Scores | null;
  desired_scores: Scores | null;
  gaps: Scores | null;
};

export function participantStatusRows(participants: ExportParticipant[]) {
  return participants.map((p) => ({
    employeeId: p.employee_id,
    name: [p.name, p.surname].filter(Boolean).join(" "),
    nickname: p.nickname ?? "",
    BU: p.bu ?? "",
    department: p.department ?? "",
    section: p.section ?? "",
    jobLevel: p.job_level ?? "",
    status: p.completed ? "Completed" : "Pending",
    submittedAt: p.submitted_at ?? "",
    durationSeconds: p.duration_seconds ?? "",
  }));
}

export function responseLongRows(participants: ExportParticipant[]) {
  const rows: Record<string, string | number>[] = [];
  for (const participant of participants.filter((p) => p.answers?.length)) {
    const answers = new Map((participant.answers ?? []).map((answer) => [answer.questionId, answer]));
    for (const question of SCENARIO_QUESTIONS) {
      const answer = answers.get(question.id);
      const current = question.options.find((option) => option.id === answer?.currentOptionId);
      const desired = question.options.find((option) => option.id === answer?.desiredOptionId);
      rows.push({
        employeeId: participant.employee_id,
        name: [participant.name, participant.surname].filter(Boolean).join(" "),
        nickname: participant.nickname ?? "",
        BU: participant.bu ?? "",
        department: participant.department ?? "",
        section: participant.section ?? "",
        jobLevel: participant.job_level ?? "",
        submittedAt: participant.submitted_at ?? "",
        durationSeconds: participant.duration_seconds ?? "",
        questionId: question.id,
        workplaceDimension: question.dimension,
        scenarioTitle: question.title,
        question: question.prompt,
        currentOption: current?.label ?? "",
        currentArchetype: current ? ARCHETYPE_META[current.archetype].label : "",
        desiredOption: desired?.label ?? "",
        desiredArchetype: desired ? ARCHETYPE_META[desired.archetype].label : "",
      });
    }
  }
  return rows;
}

export function responseWideRows(participants: ExportParticipant[]) {
  return participants
    .filter((p) => p.answers?.length)
    .map((participant) => {
      const answers = new Map((participant.answers ?? []).map((answer) => [answer.questionId, answer]));
      const row: Record<string, string | number> = {
        employeeId: participant.employee_id,
        name: [participant.name, participant.surname].filter(Boolean).join(" "),
        nickname: participant.nickname ?? "",
        BU: participant.bu ?? "",
        department: participant.department ?? "",
        section: participant.section ?? "",
        jobLevel: participant.job_level ?? "",
        submittedAt: participant.submitted_at ?? "",
        durationSeconds: participant.duration_seconds ?? "",
      };
      for (const question of SCENARIO_QUESTIONS) {
        const answer = answers.get(question.id);
        const current = question.options.find((option) => option.id === answer?.currentOptionId);
        const desired = question.options.find((option) => option.id === answer?.desiredOptionId);
        row[`${question.id}_Current`] = current?.label ?? "";
        row[`${question.id}_Current_Archetype`] = current ? ARCHETYPE_META[current.archetype].label : "";
        row[`${question.id}_Desired`] = desired?.label ?? "";
        row[`${question.id}_Desired_Archetype`] = desired ? ARCHETYPE_META[desired.archetype].label : "";
      }
      if (participant.current_scores) {
        for (const [key, value] of Object.entries(participant.current_scores)) row[`CurrentScore_${key}`] = value;
      }
      if (participant.desired_scores) {
        for (const [key, value] of Object.entries(participant.desired_scores)) row[`DesiredScore_${key}`] = value;
      }
      if (participant.gaps) {
        for (const [key, value] of Object.entries(participant.gaps)) row[`Gap_${key}`] = value;
      }
      return row;
    });
}
