
import React from 'react';

interface ResultsViewProps {
  onReset: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ onReset }) => {
  return (
    <div className="space-y-4 text-center">
      <h2 className="text-2xl font-bold text-white">Analysis Complete!</h2>
      <p className="text-gray-400">All chapters have been processed and downloaded to your device.</p>
      <div className="flex justify-center mt-4">
        <button
          onClick={onReset}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
        >
          Analyze Another Book
        </button>
      </div>
    </div>
  );
};

export default ResultsView;
