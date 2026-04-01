import { Answer } from "@/scripts/test/if_answer";

export interface QuestionItem {
  question: string;
  answers: Answer[];
  correct: string;
  _id: number;
}
