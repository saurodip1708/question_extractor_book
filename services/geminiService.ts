import type { GoogleGenAI } from '@google/genai';
import { Type } from '@google/genai';
import type { Chapter } from '../types';

// Helper function to convert Uint8Array to Base64
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function getChapterListFromPdf(ai: GoogleGenAI, pdfData: Uint8Array): Promise<Chapter[]> {
  try {
    const base64Pdf = uint8ArrayToBase64(pdfData);
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              text: `You are an expert document analyzer. Analyze the following PDF pages which contain the table of contents of a book.

YOUR TASK:
Extract ONLY the chapter titles/names from the table of contents. Do NOT extract page numbers - the user will add them manually later.

INSTRUCTIONS:
1. Look at the table of contents in the PDF
2. Identify all chapter titles
3. Extract just the chapter names (ignore section numbers like 1.1, 1.2, and page numbers)
4. Return clean chapter titles without any numbers or page references
5. Maintain the order of chapters as they appear in the TOC

Example:
If the TOC shows:
- "1. REAL NUMBERS      1.1-1.64      Page 1"
- "2. POLYNOMIALS       2.1-2.67      Page 50"

You should extract:
- "REAL NUMBERS"
- "POLYNOMIALS"

Return only the chapter titles. The user will manually set page numbers in the next step.`,
            },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Pdf,
              }
            }
          ]
        },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        chapterTitle: {
                            type: Type.STRING,
                            description: 'The title of the chapter.',
                        },
                        startPage: {
                            type: Type.INTEGER,
                            description: 'Default to 0 - user will set this manually.',
                        },
                        endPage: {
                            type: Type.INTEGER,
                            description: 'Default to 0 - user will set this manually.',
                        },
                    },
                    required: ['chapterTitle', 'startPage', 'endPage'],
                },
            },
        },
    });

    const jsonText = response.text?.trim() || '';
    if (!jsonText) {
      throw new Error("Gemini returned an empty response.");
    }
    const chapters = JSON.parse(jsonText) as Chapter[];
    
    // Set default page numbers to 0 (user will fill them in)
    const chaptersWithDefaults = chapters.map((c) => ({
      chapterTitle: c.chapterTitle,
      startPage: 0,
      endPage: 0,
    }));
    
    if (chaptersWithDefaults.length === 0) {
        throw new Error("No chapters found. Please check if the PDF has a proper table of contents.");
    }
    
    return chaptersWithDefaults;
  } catch (error) {
    console.error("Error getting chapter list from Gemini:", error);
    throw new Error("Failed to analyze the book's table of contents with Gemini.");
  }
}

export async function getQuestionsFromChapterPdf(ai: GoogleGenAI, chapterPdfData: Uint8Array, board: string, subject: string, chapterTitle: string): Promise<{ board: string; subject: string; chapterTitle: string; questions: any[] }> {
  try {
    const base64Pdf = uint8ArrayToBase64(chapterPdfData);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              text: `You are a pedagogical expert. Analyze the following PDF of a book chapter. Your task is to extract all questions present in this chapter. 
This includes text-based questions AND questions presented as images (e.g., diagrams, charts, figures that require interpretation).

For EACH question you find, provide:
1. **Question Number** (sequential: 1, 2, 3...)
2. **Question Text** (full text, or detailed description if image-based)
3. **Question Type**: One of these categories:
   - MCQ (Multiple Choice Question)
   - Very Short Answer (1 mark, 1-2 lines)
   - Short Answer (2-3 marks, 30-50 words)
   - Long Answer (4-6 marks, 80-120 words)
   - Case Based (passage/data followed by questions)
   - Assertion-Reason (both statements given)
   - Fill in the Blanks
   - True/False
   - Match the Following

4. **Suggested Marks** (1, 2, 3, 4, 5, 6, etc. - based on question complexity and type)

5. **DOK Level** (Depth of Knowledge - 1 to 4):
   - Level 1: Recall & Reproduction (memorization, facts, definitions)
   - Level 2: Skills & Concepts (explain, classify, compare, estimate)
   - Level 3: Strategic Thinking (reasoning, planning, justifying, hypothesizing)
   - Level 4: Extended Thinking (investigation, research, multiple steps, real-world application)

6. **Bloom's Taxonomy Level**:
   - Remembering (recall facts)
   - Understanding (explain ideas)
   - Applying (use in new situations)
   - Analyzing (break down, examine relationships)
   - Evaluating (make judgments, critique)
   - Creating (produce new ideas, design solutions)

7. **Difficulty**: Easy, Medium, or Hard

Be thorough and accurate in your classification. If no questions are found, return an empty array.`
            },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Pdf,
              }
            }
          ]
        },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                questionNumber: {
                                    type: Type.INTEGER,
                                    description: 'Sequential question number',
                                },
                                questionText: {
                                    type: Type.STRING,
                                    description: 'Full text of the question or description if image-based',
                                },
                                questionType: {
                                    type: Type.STRING,
                                    description: 'Type of question: MCQ, Very Short Answer, Short Answer, Long Answer, Case Based, Assertion-Reason, Fill in the Blanks, True/False, Match the Following',
                                },
                                suggestedMarks: {
                                    type: Type.INTEGER,
                                    description: 'Suggested marks for the question (1-6)',
                                },
                                dokLevel: {
                                    type: Type.INTEGER,
                                    description: 'Depth of Knowledge level (1-4)',
                                },
                                bloomsLevel: {
                                    type: Type.STRING,
                                    description: 'Blooms Taxonomy level: Remembering, Understanding, Applying, Analyzing, Evaluating, Creating',
                                },
                                difficulty: {
                                    type: Type.STRING,
                                    description: 'Difficulty level: Easy, Medium, Hard',
                                },
                            },
                            required: ['questionNumber', 'questionText', 'questionType', 'suggestedMarks', 'dokLevel', 'bloomsLevel', 'difficulty'],
                        },
                    },
                },
                required: ['questions'],
            },
        },
    });

    const jsonText = response.text?.trim() || '';
    if (!jsonText) {
      throw new Error("Gemini returned an empty response for questions.");
    }
    
    const data = JSON.parse(jsonText);
    
    return {
      board,
      subject,
      chapterTitle,
      questions: data.questions || [],
    };
  } catch (error) {
    console.error("Error getting questions from Gemini:", error);
    throw new Error("Failed to analyze the chapter content with Gemini.");
  }
}