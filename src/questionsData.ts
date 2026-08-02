export interface Question {
  id: string;
  category: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  difficulty?: string;
  isActive?: boolean;
}

export const staticQuestions: Question[] = [];
