import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { BugReport, BugStatus } from '../types';

interface BugFormProps {
  onSubmit: (bug: Omit<BugReport, 'id' | 'status' | 'createdAt' | 'reporterEmail' | 'reporterName'>) => Promise<void>;
  isSubmitting: boolean;
}

export default function BugForm({ onSubmit, isSubmitting }: BugFormProps) {
  const [role, setRole] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<{ data: string; name: string; type: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 2 * 1024 * 1024) {
        setError('File size must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFile({
          data: reader.result as string,
          name: selectedFile.name,
          type: selectedFile.type,
        });
        setError(null);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await onSubmit({
        role,
        title,
        description,
        fileData: file?.data,
        fileName: file?.name,
        fileType: file?.type,
      });
      setSuccess(true);
      setRole('');
      setTitle('');
      setDescription('');
      setFile(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to submit bug report');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
    >
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Report a Bug</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          >
            <option value="">Select a role</option>
            <option value="super_admin">Super Admin</option>
            <option value="nodal_officer">Nodal Officer</option>
            <option value="reporting_officer">Reporting Officer</option>
            <option value="reviewing_officer">Reviewing Officer</option>
            <option value="employee">Employee</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="What's the problem?"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all min-h-[100px]"
            placeholder="Describe the issue in detail..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (Image or File)</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
          >
            {file ? (
              <div className="flex items-center gap-2 text-blue-600">
                <CheckCircle size={20} />
                <span className="text-sm font-medium">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="p-1 hover:bg-blue-100 rounded-full"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <Upload className="text-gray-400 mb-2" size={24} />
                <span className="text-sm text-gray-500">Click to upload or drag and drop</span>
                <span className="text-xs text-gray-400 mt-1">Max size: 2MB</span>
              </>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
            <CheckCircle size={16} />
            <span>Bug report submitted successfully!</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Bug Report'}
        </button>
      </form>
    </motion.div>
  );
}
