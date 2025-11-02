
export interface Chapter {
  chapterTitle: string;
  startPage: number;
  endPage: number;
}

export interface Question {
  questionNumber: number;
  questionText: string;
  questionType: 'MCQ' | 'Short Answer' | 'Long Answer' | 'Case Based' | 'Very Short Answer' | 'Assertion-Reason' | 'Fill in the Blanks' | 'True/False' | 'Match the Following';
  suggestedMarks: number;
  dokLevel: 1 | 2 | 3 | 4; // Depth of Knowledge: 1=Recall, 2=Skill/Concept, 3=Strategic Thinking, 4=Extended Thinking
  bloomsLevel: 'Remembering' | 'Understanding' | 'Applying' | 'Analyzing' | 'Evaluating' | 'Creating';
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export type ProcessingState =
  | 'idle'
  | 'loading_pdf'
  | 'analyzing_toc'
  | 'reviewing_chapters'
  | 'processing_chapters'
  | 'done'
  | 'error';

export interface BookMetadata {
  board: string;
  subject: string;
}
