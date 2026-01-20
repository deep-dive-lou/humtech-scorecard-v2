export type Pillar = "operations" | "customer" | "revenue" | "data" | "informative";

export interface QuestionOption {
  id: string;
  label: string;
  answerId: "A" | "B" | "C" | "D" | "E";
  hasTextInput?: boolean; // For "Other, please specify" options
}

export interface Question {
  id: string;
  pillar: Pillar;
  text: string;
  options: QuestionOption[];
  isScored?: boolean; // true for q1-q11, false for q12-q14
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
  answers: Record<string, string>; // questionId -> optionId
  otherText: Record<string, string>; // questionId -> text for "Other" options
  currentStep: number;
  email?: string;
  name?: string;
  company?: string;
  mobile?: string; // optional
  title?: string; // optional
  notes?: string; // q15-notes free text
}
