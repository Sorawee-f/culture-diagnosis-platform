import type { Archetype } from "@/types";

export const ARCHETYPE_META: Record<Archetype, {
  label: string;
  thai: string;
  description: string;
  theme: string;
}> = {
  clan: {
    label: "Clan",
    thai: "ร่วมมือและดูแลกัน",
    description: "Teamwork, Trust, Belonging",
    theme: "Cross-team Collaboration & Trust",
  },
  adhocracy: {
    label: "Adhocracy",
    thai: "กล้าคิด กล้าทดลอง",
    description: "Innovation, Agility, Experimentation",
    theme: "Agility, Innovation & Experimentation",
  },
  market: {
    label: "Market",
    thai: "มุ่งเป้าหมายและผลลัพธ์",
    description: "Result, Accountability, Customer Impact",
    theme: "Ownership, Accountability & Result Focus",
  },
  hierarchy: {
    label: "Hierarchy",
    thai: "มีระบบและมาตรฐาน",
    description: "Clarity, Process, Consistency",
    theme: "Role Clarity & Operating Discipline",
  },
};
