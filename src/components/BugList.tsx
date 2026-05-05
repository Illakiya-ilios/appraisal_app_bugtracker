import { motion, AnimatePresence } from 'motion/react';
import { Download, CheckCircle, Clock, AlertCircle, Trash2, ExternalLink } from 'lucide-react';
import { BugReport, BugStatus } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface BugListProps {
  bugs: BugReport[];
  onUpdateStatus: (id: string, status: BugStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isDeveloper: boolean;
}

export default function BugList({ bugs, onUpdateStatus, onDelete, isDeveloper }: BugListProps) {
  const getStatusIcon = (status: BugStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={18} />;
      case 'in-progress':
        return <Clock className="text-blue-500" size={18} />;
      case 'pending':
        return <AlertCircle className="text-amber-500" size={18} />;
    }
  };

  const getStatusColor = (status: BugStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-100';
      case 'in-progress':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  const handleDownload = (bug: BugReport) => {
    if (!bug.fileData || !bug.fileName) return;
    const link = document.createElement('a');
    link.href = bug.fileData;
    link.download = bug.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Bug Reports ({bugs.length})</h2>
        <div className="flex gap-2 text-xs font-medium uppercase tracking-wider text-gray-400">
          <span className="flex items-center gap-1"><AlertCircle size={12} /> Pending</span>
          <span className="flex items-center gap-1"><Clock size={12} /> In Progress</span>
          <span className="flex items-center gap-1"><CheckCircle size={12} /> Completed</span>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {bugs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200"
          >
            <p className="text-gray-500">No bug reports found. Everything looks good!</p>
          </motion.div>
        ) : (
          bugs.map((bug) => (
            <motion.div
              layout
              key={bug.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(bug.status)}`}>
                      {bug.status.replace('-', ' ')}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 leading-tight">{bug.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{bug.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      By <span className="text-gray-600 font-medium">{bug.reporterName}</span>
                    </span>
                    {bug.role && (
                      <>
                        <span>•</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium capitalize">{bug.role.replace('_', ' ')}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{formatDistanceToNow(bug.createdAt)} ago</span>
                    {bug.fileName && (
                      <>
                        <span>•</span>
                        <button
                          onClick={() => handleDownload(bug)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        >
                          <Download size={14} />
                          {bug.fileName}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isDeveloper && (
                    <div className="flex flex-col gap-1">
                      <select
                        value={bug.status}
                        onChange={(e) => onUpdateStatus(bug.id, e.target.value as BugStatus)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending">Set Pending</option>
                        <option value="in-progress">Set In Progress</option>
                        <option value="completed">Set Completed</option>
                      </select>
                      <button
                        onClick={() => onDelete(bug.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Report"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
