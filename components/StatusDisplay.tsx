
import React from 'react';
import { LoadingSpinner, ErrorIcon, CheckCircleIcon } from './icons';
import type { ProcessingState } from '../types';

interface StatusDisplayProps {
  state: ProcessingState;
  message: string;
  error: string | null;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ state, message, error }) => {
  const getIcon = () => {
    switch (state) {
      case 'error':
        return <ErrorIcon className="w-10 h-10 text-red-500" />;
      case 'done':
        return <CheckCircleIcon className="w-10 h-10 text-green-500" />;
      default:
        return <LoadingSpinner className="w-10 h-10 text-purple-400" />;
    }
  };

  const getTextColor = () => {
    switch (state) {
        case 'error':
            return 'text-red-400';
        case 'done':
            return 'text-green-400';
        default:
            return 'text-gray-300';
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-800/50 rounded-lg">
      <div className="mb-4">{getIcon()}</div>
      <p className={`text-lg font-semibold ${getTextColor()}`}>{message}</p>
      {state === 'error' && error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
    </div>
  );
};

export default StatusDisplay;
