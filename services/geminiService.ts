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

IMPORTANT INSTRUCTIONS FOR PAGE NUMBERS:
1. Look at the table of contents carefully - the ACTUAL PAGE NUMBERS are typically shown on the RIGHT SIDE of each chapter entry
2. IGNORE section numbers like "1.1", "1.2", "2.1", etc. - these are NOT page numbers, they are section/subsection numbers
3. For example, if you see:
   "1. REAL NUMBERS                1.1-1.64"
   - Chapter title: "REAL NUMBERS"
   - Section range: 1.1-1.64 (IGNORE THIS)
   - Look for the actual page number on the far right
4. Some books show page ranges like "1-64" which means the chapter starts on page 1 and ends on page 64
5. Extract ONLY whole number page numbers (integers), not decimal numbers
6. If you see a format like "5.1-5.61" on the right side, this likely means pages 5.1 to 5.61 - extract the integer part: start=5, end=61 (or estimate based on pattern)

Your task:
- Identify each chapter by its title
- Find the ACTUAL starting page number (rightmost number, typically an integer)
- Find the ACTUAL ending page number
- Ignore "Preface", "Introduction", or similar non-chapter sections

Look at the visual layout of the table of contents to determine where the actual page numbers are positioned.`,
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
                            description: 'The starting page number of the chapter.',
                        },
                        endPage: {
                            type: Type.INTEGER,
                            description: 'The ending page number of the chapter.',
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
    
    // Validation: filter out invalid chapters
    const validChapters = chapters.filter(c => {
      // Check if chapter has required fields
      if (!c.chapterTitle || !c.startPage || !c.endPage) {
        console.warn(`Skipping invalid chapter: ${JSON.stringify(c)}`);
        return false;
      }
      
      // Check if page numbers are valid (positive integers, not decimals)
      if (c.startPage < 1 || c.endPage < 1 || c.startPage > 10000 || c.endPage > 10000) {
        console.warn(`Skipping chapter with invalid page range: ${c.chapterTitle} (${c.startPage}-${c.endPage})`);
        return false;
      }
      
      // Check if startPage is less than or equal to endPage
      if (c.startPage > c.endPage) {
        console.warn(`Skipping chapter with reversed page numbers: ${c.chapterTitle} (${c.startPage}-${c.endPage})`);
        return false;
      }
      
      return true;
    });
    
    if (validChapters.length === 0) {
        throw new Error("No valid chapters found. Please check if the PDF has a proper table of contents.");
    }
    
    return validChapters;
  } catch (error) {
    console.error("Error getting chapter list from Gemini:", error);
    throw new Error("Failed to analyze the book's table of contents with Gemini.");
  }
}

export async function getQuestionsFromChapterPdf(ai: GoogleGenAI, chapterPdfData: Uint8Array, board: string, subject: string): Promise<string> {
  try {
    const base64Pdf = uint8ArrayToBase64(chapterPdfData);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              text: `You are a pedagogical expert. Analyze the following PDF of a book chapter. Your task is to extract all questions present in this chapter. 
This includes text-based questions AND questions presented as images (e.g., diagrams, charts, figures that require interpretation).

- For text-based questions, provide the full text.
- For image-based questions, provide a detailed description of the image and what it is asking.

For every question you find (both text and image-based), determine its difficulty level (Easy, Medium, or Hard) and its corresponding Bloom's Taxonomy level (Remembering, Understanding, Applying, Analyzing, Evaluating, Creating).

Format the output as a single Markdown file. Use the following structure for each question:
\`\`\`markdown
### Question [Number]

**Question:** [The full text of the question, or a detailed description of the image-based question]

**Difficulty:** [Easy/Medium/Hard]

**Bloom's Level:** [Remembering/Understanding/Applying/Analyzing/Evaluating/Creating]
\`\`\`
If no questions are found in the chapter, return a single message: 'No questions found in this chapter.'`
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

    // Add board and subject metadata to the top of the markdown
    const responseText = response.text || '';
    const markdownWithMetadata = `---
**Board:** ${board}
**Subject:** ${subject}
---

${responseText}`;

    return markdownWithMetadata;
  } catch (error) {
    console.error("Error getting questions from Gemini:", error);
    throw new Error("Failed to analyze the chapter content with Gemini.");
  }
}