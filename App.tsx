import { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { getChapterListFromPdfText, getQuestionsFromChapterText } from './services/geminiService';
import { extractText, sliceSingleChapterPdf } from './services/pdfService';
import FileUpload from './components/FileUpload';
import StatusDisplay from './components/StatusDisplay';
import ResultsView from './components/ResultsView';
import MetadataForm from './components/MetadataForm';
import ApiKeyInput from './components/ApiKeyInput';
import { GithubIcon, SparklesIcon } from './components/icons';
import type { ProcessingState, BookMetadata } from './types';
import LogDisplay from './components/LogDisplay';
import { PDFDocument } from 'pdf-lib';
import saveAs from 'file-saver';

const API_KEY_STORAGE = 'gemini_api_key';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<BookMetadata>({ board: '', subject: '' });
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [ai, setAi] = useState<GoogleGenAI | null>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem(API_KEY_STORAGE);
    if (storedKey) {
      setApiKey(storedKey);
      setAi(new GoogleGenAI({ apiKey: storedKey }));
    }
  }, []);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const handleApiKeySubmit = (key: string) => {
    localStorage.setItem(API_KEY_STORAGE, key);
    setApiKey(key);
    setAi(new GoogleGenAI({ apiKey: key }));
  };

  const handleClearApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE);
    setApiKey(null);
    setAi(null);
    resetState();
  };

  const resetState = () => {
    setFile(null);
    setProcessingState('idle');
    setProgressMessage('');
    setError(null);
    setLogs([]);
    setMetadata({ board: '', subject: '' });
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      resetState();
      setFile(selectedFile);
    }
  };
  
  const processBook = useCallback(async () => {
    if (!file || !ai) return;
    
    if (!metadata.board || !metadata.subject) {
      setError('Please select board and enter subject before analyzing.');
      return;
    }

    setLogs([]);
    addLog('Process started.');
    addLog(`Board: ${metadata.board}, Subject: ${metadata.subject}`);
    setProcessingState('loading_pdf');
    setProgressMessage('Loading PDF and extracting table of contents...');
    setError(null);

    try {
      addLog("Extracting text from first 20 pages for Table of Contents analysis.");
      const tocText = await extractText(file, 1, 20);
      addLog("Text extraction complete.");

      setProcessingState('analyzing_toc');
      setProgressMessage('Analyzing table of contents with Gemini...');
      addLog("Sending text to Gemini 2.5 Flash for chapter detection.");
      const chapters = await getChapterListFromPdfText(ai, tocText);
      if (!chapters || chapters.length === 0) {
        throw new Error("Could not identify chapters from the book's first 20 pages.");
      }
      addLog(`Gemini identified ${chapters.length} chapters.`);


      // Download chapter list immediately
      addLog("Generating and downloading chapters.txt file.");
      const chapterListContent = chapters.map(c => `${c.chapterTitle}: Pages ${c.startPage} - ${c.endPage}`).join('\n');
      const chapterListBlob = new Blob([chapterListContent], { type: 'text/plain;charset=utf-8' });
      saveAs(chapterListBlob, 'chapters.txt');
      addLog("chapters.txt downloaded successfully.");
      setProgressMessage('Chapter list downloaded. Processing individual chapters...');

      setProcessingState('processing_chapters');
      
      addLog("Loading full PDF document into memory for slicing...");
      const existingPdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      addLog("PDF loaded.");

      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const chapterIndex = i + 1;
        
        setProgressMessage(`Slicing Chapter ${chapterIndex}/${chapters.length}: "${chapter.chapterTitle}"`);
        addLog(`Slicing Chapter ${chapterIndex}: "${chapter.chapterTitle}" (pages ${chapter.startPage}-${chapter.endPage}).`);
        const chapterPdfData = await sliceSingleChapterPdf(pdfDoc, chapter);

        if (!chapterPdfData) {
            console.warn(`Could not slice chapter ${chapterIndex}, page range might be invalid.`);
            addLog(`Skipping Chapter ${chapterIndex} - page range seems invalid or empty.`);
            continue;
        }
        addLog(`Slicing complete. Chapter size: ${Math.round(chapterPdfData.length / 1024)} KB.`);


        setProgressMessage(`Analyzing Chapter ${chapterIndex}/${chapters.length}: "${chapter.chapterTitle}"`);
        addLog(`Sending chapter PDF to Gemini 2.5 Flash for multimodal analysis.`);
        const analysisContent = await getQuestionsFromChapterText(ai, chapterPdfData, metadata.board, metadata.subject);
        addLog(`Received analysis from Gemini.`);

        const safeFileName = chapter.chapterTitle.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '_');
        const analysisFileName = `${chapterIndex}_${safeFileName}.md`;
        
        addLog(`Downloading Markdown file: ${analysisFileName}`);
        const analysisBlob = new Blob([analysisContent], { type: 'text/markdown;charset=utf-t' });
        saveAs(analysisBlob, analysisFileName);
      }

      setProcessingState('done');
      setProgressMessage('Processing complete! All files have been downloaded.');
      addLog("All chapters have been processed and downloaded. Task finished.");

    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || 'An unknown error occurred during processing.';
      setError(errorMessage);
      addLog(`ERROR: ${errorMessage}`);
      setProcessingState('error');
    }
  }, [file, addLog, metadata, ai]);


  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
             <SparklesIcon className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Gemini Book Analyzer</h1>
          </div>
          <p className="text-lg text-gray-400">Upload a PDF book to extract chapters and generate question analysis.</p>
        </header>

        {!apiKey ? (
          <ApiKeyInput onApiKeySubmit={handleApiKeySubmit} />
        ) : (
          <main className="bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 border border-gray-700">
            <div className="flex justify-end">
              <button
                onClick={handleClearApiKey}
                className="text-sm text-gray-400 hover:text-red-400 transition-colors"
              >
                Change API Key
              </button>
            </div>
            {processingState === 'idle' && (
            <FileUpload onFileChange={handleFileChange} />
          )}

          {file && processingState === 'idle' && (
            <>
              <div className="text-center">
                <p className="mb-4 text-green-400">File ready: <span className="font-semibold">{file.name}</span></p>
              </div>
              
              <MetadataForm metadata={metadata} onMetadataChange={setMetadata} />
              
              <button
                onClick={processBook}
                disabled={!metadata.board || !metadata.subject}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <SparklesIcon className="w-5 h-5" />
                Analyze Book
              </button>
              
              {(!metadata.board || !metadata.subject) && (
                <p className="text-sm text-yellow-400 text-center">
                  Please select board and enter subject to continue
                </p>
              )}
            </>
          )}

          {processingState !== 'idle' && processingState !== 'done' && (
            <>
              <StatusDisplay 
                state={processingState} 
                message={progressMessage}
                error={error}
              />
              <LogDisplay logs={logs} />
            </>
          )}

          {processingState === 'done' && (
            <ResultsView onReset={resetState} />
          )}

           {processingState === 'error' && (
            <div className="text-center">
               <button
                onClick={resetState}
                className="mt-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
              >
                Try Again
              </button>
            </div>
            )}
          </main>
        )}
        
        <footer className="text-center mt-8 text-gray-500">
           <a href="https://github.com/google/genai-js" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-purple-400 transition-colors">
            <GithubIcon className="w-5 h-5" />
            <span>Powered by Gemini 2.5 Flash</span>
          </a>
        </footer>
      </div>
    </div>
  );
}