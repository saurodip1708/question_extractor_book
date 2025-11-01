import { BookMetadata } from '../types';

interface MetadataFormProps {
  metadata: BookMetadata;
  onMetadataChange: (metadata: BookMetadata) => void;
}

const MetadataForm = ({ metadata, onMetadataChange }: MetadataFormProps) => {
  const handleBoardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onMetadataChange({ ...metadata, board: e.target.value });
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMetadataChange({ ...metadata, subject: e.target.value });
  };

  return (
    <div className="space-y-4 bg-gray-700 p-6 rounded-lg border border-gray-600">
      <h3 className="text-xl font-semibold text-white mb-4">Book Information</h3>
      
      <div>
        <label htmlFor="board" className="block text-sm font-medium text-gray-300 mb-2">
          Select Board *
        </label>
        <select
          id="board"
          value={metadata.board}
          onChange={handleBoardChange}
          className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          required
        >
          <option value="">Choose a board...</option>
          <option value="CBSE">CBSE</option>
          <option value="ICSE">ICSE</option>
          <option value="State Board">State Board</option>
          <option value="IB">IB (International Baccalaureate)</option>
          <option value="Cambridge">Cambridge</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
          Subject *
        </label>
        <input
          type="text"
          id="subject"
          value={metadata.subject}
          onChange={handleSubjectChange}
          placeholder="e.g., Mathematics, Science, English"
          className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500"
          required
        />
      </div>
    </div>
  );
};

export default MetadataForm;
