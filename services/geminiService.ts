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

export async function getQuestionsFromChapterPdf(ai: GoogleGenAI, chapterPdfData: Uint8Array, board: string, subject: string, chapterTitle: string): Promise<string> {
  try {
    const base64Pdf = uint8ArrayToBase64(chapterPdfData);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              text: `You are a pedagogical expert. Analyze the following PDF of a book chapter. Your task is to extract all questions present in this chapter. 
This includes text-based questions AND questions presented as images (e.g., diagrams, charts, figures that require interpretation).

For EACH question you find, provide the information in markdown format as follows:

### Question [Number]

**Question:** [The full text of the question, or detailed description if image-based. Keep all mathematical symbols as-is: √, π, ×, ÷, etc.]

**Type:** [MCQ / Very Short Answer / Short Answer / Long Answer / Case Based / Assertion-Reason / Fill in the Blanks / True-False / Match the Following]

**Suggested Marks:** [1-6 based on complexity]

**DOK Level:** [1-4]
- Level 1: Recall & Reproduction
- Level 2: Skills & Concepts
- Level 3: Strategic Thinking
- Level 4: Extended Thinking

**Bloom's Taxonomy:** [Remembering / Understanding / Applying / Analyzing / Evaluating / Creating]

**Difficulty:** [Easy / Medium / Hard]

---

Be thorough and accurate in your classification. Preserve all mathematical notation and special characters exactly as they appear. If no questions are found, return: "No questions found in this chapter."`
            },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Pdf,
              }
            }
          ]
        },
    });

    const responseText = response.text || 'No questions found in this chapter.';
    
    // Add metadata header
    const markdownWithMetadata = `# Question Bank

**Board:** ${board}
**Subject:** ${subject}
**Chapter:** ${chapterTitle}

---

${responseText}`;
    
    return markdownWithMetadata;
  } catch (error) {
    console.error("Error getting questions from Gemini:", error);
    throw new Error("Failed to analyze the chapter content with Gemini.");
  }
}