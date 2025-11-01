import type { Chapter } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, PDFPage } from 'pdf-lib';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

// Set up pdf.js worker using a stable CDN URL. The Vite-specific `?url` import
// is not a standard browser feature and can fail. Hardcoding the URL from the
// import map makes this more robust.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://aistudiocdn.com/pdfjs-dist@5.4.296/build/pdf.worker.mjs';


async function getPdfDocument(source: File | Uint8Array): Promise<PDFDocumentProxy> {
    const data = source instanceof File ? await source.arrayBuffer() : source;
    return pdfjsLib.getDocument(data).promise;
}

export async function extractText(file: File, startPage: number, endPage: number): Promise<string> {
  const pdf = await getPdfDocument(file);
  const maxPage = Math.min(endPage, pdf.numPages);
  let fullText = '';

  for (let i = startPage; i <= maxPage; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n\n';
  }
  return fullText;
}

export async function sliceSingleChapterPdf(
  pdfDoc: PDFDocument, // This is a loaded PDFLib.PDFDocument
  chapter: Chapter
): Promise<Uint8Array | null> {
  const totalPages = pdfDoc.getPageCount();

  const newPdf = await PDFDocument.create();
  const start = Math.max(1, chapter.startPage);
  const end = Math.min(totalPages, chapter.endPage);

  if (start > end) return null;

  const pageIndices: number[] = [];
  for (let i = start; i <= end; i++) {
    pageIndices.push(i - 1); // pdf-lib is 0-indexed
  }

  if (pageIndices.length > 0) {
    const copiedPages: PDFPage[] = await newPdf.copyPages(pdfDoc, pageIndices);
    copiedPages.forEach((page: PDFPage) => newPdf.addPage(page));
    return await newPdf.save();
  }

  return null;
}
