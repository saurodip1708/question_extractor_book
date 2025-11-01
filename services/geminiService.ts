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

export async function getChapterListFromPdfText(ai: GoogleGenAI, text: string): Promise<Chapter[]> {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an expert document analyzer. Analyze the following text from the first 20 pages of a book, which likely contains the table of contents. Extract the chapter titles and their corresponding starting and ending page numbers. Provide the output in the specified JSON format. Ignore introductory sections like 'Preface' or 'Introduction' if they don't have clear page ranges or are not structured like a chapter. Here is the text:\n\n${text}`,
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
    // Simple validation
    if (!Array.isArray(chapters) || chapters.some(c => !c.chapterTitle || !c.startPage || !c.endPage)) {
        throw new Error("Gemini returned an invalid chapter list format.");
    }
    return chapters;
  } catch (error) {
    console.error("Error getting chapter list from Gemini:", error);
    throw new Error("Failed to analyze the book's table of contents with Gemini.");
  }
}

export async function getQuestionsFromChapterText(ai: GoogleGenAI, chapterPdfData: Uint8Array, board: string, subject: string): Promise<string> {
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