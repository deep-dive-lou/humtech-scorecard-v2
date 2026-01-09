export type Pillar = "operations" | "customer" | "revenue" | "data";

export interface QuestionOption {
  id: string;
  label: string;
  answerId: "A" | "B" | "C" | "D" | "E";
}

export interface Question {
  id: string;
  pillar: Pillar;
  text: string;
  options: QuestionOption[];
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
  currentStep: number;
  email?: string;
  painPoints?: string;
}
