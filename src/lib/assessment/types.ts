export type Pillar = "lead_engagement_speed" | "appointment_reliability_conversion" | "operational_focus_time_efficiency" | "systems_automation_maturity" | "revenue_protection_leakage" | "informative";

export interface QuestionOption {
  id: string;
  label: string;
  answerId: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J";
  hasTextInput?: boolean; // For "Other, please specify" options
}

export interface Question {
  id: string;
  pillar: Pillar;
  text: string;
  options: QuestionOption[];
  isScored?: boolean; // true for q1-q12, false for q13-q15
  isMultiSelect?: boolean; // true for questions allowing multiple selections
}

export interface AssessmentConfig {
  pillars: {
    id: Pillar;
    name: string;
  }[];
  questions: Question[];
}

export interface Answer {
  questionId: string;
  optionId: string;
}

export interface AssessmentState {
  answers: Record<string, string>; // questionId -> optionId (single-select)
  multiSelectAnswers: Record<string, string[]>; // questionId -> optionId[] (multi-select)
  otherText: Record<string, string>; // questionId -> text for "Other" options
  currentStep: number;
  email?: string;
  name?: string;
  company?: string;
  revenueRange5to500m?: "yes" | "no";
  mobile?: string; // optional
  title?: string; // optional
  notes?: string; // q16_additional_notes free text
}
