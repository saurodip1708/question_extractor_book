import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface Question {
  questionNumber: number;
  questionText: string;
  questionType: string;
  suggestedMarks: number;
  dokLevel: number;
  bloomsLevel: string;
  difficulty: string;
}

interface QuestionData {
  board: string;
  subject: string;
  chapterTitle: string;
  questions: Question[];
}

export async function generateQuestionsPdf(data: QuestionData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let currentPage = pdfDoc.addPage();
  const { width, height } = currentPage.getSize();
  const margin = 50;
  const maxWidth = width - 2 * margin;
  let yPosition = height - margin;
  
  const fontSize = 10;
  const titleFontSize = 14;
  const headingFontSize = 12;
  const lineHeight = fontSize + 4;
  
  // Helper function to add a new page
  const addNewPage = () => {
    currentPage = pdfDoc.addPage();
    yPosition = height - margin;
  };
  
  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition - requiredSpace < margin) {
      addNewPage();
    }
  };
  
  // Helper function to wrap text
  const wrapText = (text: string, maxWidth: number, fontSize: number, font: any): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };
  
  // Draw header with metadata
  currentPage.drawText(`Board: ${data.board}`, {
    x: margin,
    y: yPosition,
    size: fontSize,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight;
  
  currentPage.drawText(`Subject: ${data.subject}`, {
    x: margin,
    y: yPosition,
    size: fontSize,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= lineHeight;
  
  currentPage.drawText(`Chapter: ${data.chapterTitle}`, {
    x: margin,
    y: yPosition,
    size: titleFontSize,
    font: boldFont,
    color: rgb(0, 0, 0.5),
  });
  yPosition -= lineHeight * 2;
  
  // Horizontal line
  currentPage.drawLine({
    start: { x: margin, y: yPosition },
    end: { x: width - margin, y: yPosition },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });
  yPosition -= lineHeight;
  
  // Total questions count
  currentPage.drawText(`Total Questions: ${data.questions.length}`, {
    x: margin,
    y: yPosition,
    size: fontSize,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  yPosition -= lineHeight * 2;
  
  // Draw each question
  for (const question of data.questions) {
    // Check if we need a new page for this question (estimate ~8 lines per question)
    checkPageBreak(lineHeight * 10);
    
    // Question number
    currentPage.drawText(`Question ${question.questionNumber}`, {
      x: margin,
      y: yPosition,
      size: headingFontSize,
      font: boldFont,
      color: rgb(0, 0, 0.8),
    });
    yPosition -= lineHeight * 1.5;
    
    // Question text (wrapped)
    const questionLines = wrapText(question.questionText, maxWidth, fontSize, font);
    for (const line of questionLines) {
      checkPageBreak(lineHeight);
      currentPage.drawText(line, {
        x: margin,
        y: yPosition,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= lineHeight;
    }
    yPosition -= lineHeight * 0.5;
    
    // Question metadata
    const metadata = [
      `Type: ${question.questionType}`,
      `Marks: ${question.suggestedMarks}`,
      `DOK Level: ${question.dokLevel}`,
      `Bloom's: ${question.bloomsLevel}`,
      `Difficulty: ${question.difficulty}`,
    ];
    
    for (const meta of metadata) {
      checkPageBreak(lineHeight);
      currentPage.drawText(meta, {
        x: margin + 20,
        y: yPosition,
        size: fontSize - 1,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
      yPosition -= lineHeight;
    }
    
    yPosition -= lineHeight * 1.5;
    
    // Separator line
    if (yPosition - lineHeight * 2 > margin) {
      currentPage.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: width - margin, y: yPosition },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.85),
      });
      yPosition -= lineHeight * 2;
    }
  }
  
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
