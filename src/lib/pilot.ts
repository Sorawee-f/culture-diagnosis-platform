import type { OrderGroup, SurveyType } from "@/types";

export function getPilotOrder(employeeId: string): SurveyType[] {
  const checksum = Array.from(employeeId).reduce(
    (sum, character, index) => sum + character.charCodeAt(0) * (index + 1),
    0,
  );
  return checksum % 2 === 0 ? ["scenario", "simple"] : ["simple", "scenario"];
}

export function getOrderGroup(employeeId: string): OrderGroup {
  return getPilotOrder(employeeId)[0] === "scenario"
    ? "scenario_first"
    : "simple_first";
}

export function surveyTypeLabel(type: SurveyType) {
  return type === "scenario" ? "Scenario-Based Survey" : "Simplified Culture Survey";
}
