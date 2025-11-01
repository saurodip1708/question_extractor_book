import { useState } from 'react';

interface ApiKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
}

const ApiKeyInput = ({ onApiKeySubmit }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
    }
  };

  return (
    <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to Gemini Book Analyzer</h2>
        <p className="text-gray-400">Please enter your Gemini API key to get started</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-2">
            Gemini API Key *
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key (e.g., AIza...)"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 pr-24 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white px-3 py-1 text-sm"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={!apiKey.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Analyzing
        </button>

        <div className="mt-4 p-4 bg-gray-700 rounded-lg border border-gray-600">
          <p className="text-sm text-gray-300 mb-2">
            <strong>Don't have an API key?</strong>
          </p>
          <p className="text-sm text-gray-400 mb-2">
            Get your free Gemini API key from Google AI Studio
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 text-sm underline"
          >
            Get API Key →
          </a>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Your API key is stored locally in your browser and never sent to any server except Google's Gemini API.
        </p>
      </form>
    </div>
  );
};

export default ApiKeyInput;
