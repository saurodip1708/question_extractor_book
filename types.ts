
export interface Chapter {
  chapterTitle: string;
  startPage: number;
  endPage: number;
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
