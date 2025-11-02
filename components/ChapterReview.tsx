import { useState } from 'react';
import type { Chapter } from '../types';

interface ChapterReviewProps {
  chapters: Chapter[];
  onConfirm: (chapters: Chapter[]) => void;
  onCancel: () => void;
}

const ChapterReview = ({ chapters: initialChapters, onConfirm, onCancel }: ChapterReviewProps) => {
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [errors, setErrors] = useState<{ [key: number]: string }>({});

  const handleChapterChange = (index: number, field: 'chapterTitle' | 'startPage' | 'endPage', value: string | number) => {
    const newChapters = [...chapters];
    if (field === 'chapterTitle') {
      newChapters[index][field] = value as string;
    } else {
      const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
      if (!isNaN(numValue) && numValue >= 0) {
        newChapters[index][field] = numValue;
      }
    }
    setChapters(newChapters);
    
    // Clear error for this chapter
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);
  };

  const validateChapters = (): boolean => {
    const newErrors: { [key: number]: string } = {};
    
    chapters.forEach((chapter, index) => {
      if (!chapter.chapterTitle.trim()) {
        newErrors[index] = 'Chapter title is required';
      } else if (chapter.startPage <= 0 || chapter.endPage <= 0) {
        newErrors[index] = 'Please set valid page numbers (must be greater than 0)';
      } else if (chapter.startPage >= chapter.endPage) {
        newErrors[index] = 'Start page must be less than end page';
      } else if (index > 0 && chapter.startPage <= chapters[index - 1].endPage) {
        newErrors[index] = 'Chapter overlaps with previous chapter';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (validateChapters()) {
      onConfirm(chapters);
    }
  };

  const handleDelete = (index: number) => {
    setChapters(chapters.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
        <h3 className="text-xl font-semibold text-white mb-2">Set Page Numbers for Chapters</h3>
        <p className="text-gray-300 text-sm">
          AI has detected {chapters.length} chapters. <strong className="text-yellow-400">Please manually set the page numbers</strong> for each chapter.
          <br />
          <span className="text-gray-400">💡 Look at your book's table of contents or page footers to find the correct page numbers.</span>
        </p>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {chapters.map((chapter, index) => (
          <div 
            key={index} 
            className={`bg-gray-700 p-4 rounded-lg border ${errors[index] ? 'border-red-500' : 'border-gray-600'}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white">
                {index + 1}
              </div>
              
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Chapter Title
                  </label>
                  <input
                    type="text"
                    value={chapter.chapterTitle}
                    onChange={(e) => handleChapterChange(index, 'chapterTitle', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Start Page
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={chapter.startPage || ''}
                      onChange={(e) => handleChapterChange(index, 'startPage', e.target.value)}
                      placeholder="e.g., 1"
                      className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      End Page
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={chapter.endPage || ''}
                      onChange={(e) => handleChapterChange(index, 'endPage', e.target.value)}
                      placeholder="e.g., 50"
                      className="w-full bg-gray-800 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
                    />
                  </div>
                </div>
                
                {errors[index] && (
                  <p className="text-red-400 text-sm">{errors[index]}</p>
                )}
              </div>
              
              <button
                onClick={() => handleDelete(index)}
                className="flex-shrink-0 text-red-400 hover:text-red-300 p-2"
                title="Delete chapter"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleConfirm}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
        >
          Confirm & Continue
        </button>
        <button
          onClick={onCancel}
          className="px-6 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-all duration-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ChapterReview;
