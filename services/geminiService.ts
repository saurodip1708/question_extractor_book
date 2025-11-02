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

CRITICAL INSTRUCTIONS - READ CAREFULLY:

IDENTIFYING SECTION NUMBERS vs PAGE NUMBERS:
1. Section numbers use DECIMALS: "1.1", "1.2", "2.1", "5.1-5.61" - These are NOT page numbers!
2. Page numbers are WHOLE INTEGERS: "1", "15", "42", "138" - These ARE page numbers!

COMMON TOC FORMATS:
Format 1: "Chapter Name ................ Page Number"
Example: "REAL NUMBERS ................ 15" → startPage: 15

Format 2: "Chapter Name    Section Range    Page Number"  
Example: "REAL NUMBERS    1.1-1.64    15" → Section: 1.1-1.64 (IGNORE), Page: 15

Format 3: Only section numbers shown (like "1.1-1.64", "2.1-2.67")
In this case, you MUST look at the ACTUAL PAGE NUMBERS at the bottom or top of the PDF pages themselves!

SPECIAL CASE - When TOC only shows section numbers:
If the TOC shows ONLY decimals like:
- "1. REAL NUMBERS      1.1-1.64"
- "2. POLYNOMIALS       2.1-2.67"
- "3. PAIR OF LINEAR... 3.1-3.118"

This means:
- The numbers on right (1.1-1.64) are SECTION ranges, NOT pages
- You MUST scan the PDF pages to find actual page numbers
- Look at page footers/headers in the TOC PDF for hints
- Estimate based on typical textbook structure (30-50 pages per chapter)
- First chapter usually starts around page 1-15

YOUR TASK:
1. Identify each chapter title
2. Find ACTUAL page numbers (whole integers only)
3. If TOC doesn't show page numbers, scan the PDF pages for page numbers
4. If still unclear, estimate based on chapter sequence: Chapter 1 → page 1, Chapter 2 → page 50, etc.
5. NEVER use decimal numbers as page numbers!

Return proper page numbers as integers.`,
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
    
    // Validation and correction: filter out invalid chapters
    const validChapters = chapters.filter((c, index) => {
      // Check if chapter has required fields
      if (!c.chapterTitle || !c.startPage || !c.endPage) {
        console.warn(`Skipping invalid chapter: ${JSON.stringify(c)}`);
        return false;
      }
      
      // Check if page numbers look like section numbers (too small for actual pages)
      // If chapter 1 has pages "1-64", these are likely section numbers, not actual pages
      const range = c.endPage - c.startPage;
      if (index === 0 && c.startPage === 1 && range > 50 && range < 200) {
        // First chapter with suspicious range - might be section numbers
        console.warn(`Chapter "${c.chapterTitle}" has range ${c.startPage}-${c.endPage} which may be section numbers. Adjusting...`);
        // Estimate actual pages: first chapter typically starts at page 1-20
        c.startPage = 1 + (index * 40); // Rough estimate
        c.endPage = c.startPage + 39;
      }
      
      // Check if page numbers are valid (positive integers, not too large)
      if (c.startPage < 1 || c.endPage < 1 || c.startPage > 5000 || c.endPage > 5000) {
        console.warn(`Skipping chapter with invalid page range: ${c.chapterTitle} (${c.startPage}-${c.endPage})`);
        return false;
      }
      
      // Check if startPage is less than or equal to endPage
      if (c.startPage > c.endPage) {
        console.warn(`Skipping chapter with reversed page numbers: ${c.chapterTitle} (${c.startPage}-${c.endPage})`);
        return false;
      }
      
      // Ensure pages don't overlap (each chapter should start after previous ends)
      if (index > 0 && validChapters.length > 0) {
        const prevChapter = validChapters[validChapters.length - 1];
        if (c.startPage <= prevChapter.endPage) {
          console.warn(`Chapter "${c.chapterTitle}" overlaps with previous chapter. Adjusting...`);
          c.startPage = prevChapter.endPage + 1;
          if (c.endPage < c.startPage) {
            c.endPage = c.startPage + 39; // Default 40 pages per chapter
          }
        }
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