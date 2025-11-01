
import React, { useEffect, useRef } from 'react';

interface LogDisplayProps {
  logs: string[];
}

const LogDisplay: React.FC<LogDisplayProps> = ({ logs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="mt-4 w-full">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Live Log</h3>
      <div 
        ref={logContainerRef}
        className="bg-black bg-opacity-50 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm border border-gray-700 scroll-smooth"
      >
        {logs.map((log, index) => (
          <div key={index} className="flex">
            <span className="text-purple-400 mr-2 flex-shrink-0">$</span>
            <p className="text-gray-300 whitespace-pre-wrap break-words">
              {log}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogDisplay;
