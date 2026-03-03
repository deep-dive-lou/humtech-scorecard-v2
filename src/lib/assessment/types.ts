export type Pillar = "lead_engagement_speed" | "appointment_reliability_conversion" | "operational_focus_time_efficiency" | "systems_automation_maturity" | "revenue_protection_leakage" | "informative";

export type InputType = "radio" | "numeric";

export interface NumericConfig {
  min: number;
  max: number;
  step?: number;
  unit: "percent" | "currency" | "integer";
  currencySymbol?: string;
  placeholder?: string;
  hint?: string;
  fallbackOption: {
    id: string;
    label: string;
    answerId: string;
  };
  fallbackDisclaimer: string;
}

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
  inputType?: InputType; // defaults to "radio" if absent
  numericConfig?: NumericConfig; // config when inputType === "numeric"
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
  numericValues: Record<string, number | null>; // questionId -> numeric value
  numericFallbacks: Record<string, boolean>; // questionId -> true if fallback selected
  currentStep: number;
  email?: string;
  name?: string;
  company?: string;
  revenueRange5to500m?: "yes" | "no";
  mobile?: string; // optional
  title?: string; // optional
  notes?: string; // q16_additional_notes free text
}