import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bug, Shield, User, LogOut, LayoutDashboard, PlusCircle, Github, ExternalLink, AlertTriangle } from 'lucide-react';
import { auth, db, signInWithGoogle, logout, handleFirestoreError, OperationType, testConnection } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { BugReport, BugStatus } from './types';
import BugForm from './components/BugForm';
import BugList from './components/BugList';

testConnection();

const DEVELOPER_EMAILS = ['noilakin14@gmail.com']; // The user's email from context

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<any, any> {
  state: any = { hasError: false, error: null };
  props: any;

  constructor(props: any) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center border border-red-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-6">
              {this.state.error?.message.startsWith('{') 
                ? 'A database error occurred. Please check your permissions.' 
                : 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'view' | 'report'>('view');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setBugs([]);
      return;
    }

    const path = 'bugs';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bugData: BugReport[] = [];
      snapshot.forEach((doc) => {
        bugData.push({ id: doc.id, ...doc.data() } as BugReport);
      });
      setBugs(bugData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  const handleReportBug = async (bugData: Omit<BugReport, 'id' | 'status' | 'createdAt' | 'reporterEmail' | 'reporterName'>) => {
    if (!user) return;
    setIsSubmitting(true);
    const path = 'bugs';
    try {
      await addDoc(collection(db, path), {
        ...bugData,
        status: 'pending',
        createdAt: Date.now(),
        reporterEmail: user.email,
        reporterName: user.displayName || 'Anonymous',
      });
      setActiveTab('view');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: BugStatus) => {
    const path = `bugs/${id}`;
    try {
      const bugRef = doc(db, 'bugs', id);
      await updateDoc(bugRef, { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDeleteBug = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this bug report?')) {
      const path = `bugs/${id}`;
      try {
        await deleteDoc(doc(db, 'bugs', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const isDeveloper = user ? DEVELOPER_EMAILS.includes(user.email || '') : false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center border border-gray-100"
        >
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Bug size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ILIOS BugTracker</h1>
          <p className="text-gray-500 mb-8">Sign in to report or manage bug reports for the development team.</p>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <Bug size={24} />
            <span className="hidden sm:inline">ILIOS BugTracker</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
              {isDeveloper ? (
                <Shield size={14} className="text-blue-600" />
              ) : (
                <User size={14} className="text-gray-500" />
              )}
              <span className="text-xs font-semibold text-gray-700">{user.displayName}</span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar / Navigation */}
          <aside className="w-full md:w-64 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('view')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'view'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'text-gray-600 hover:bg-white hover:shadow-sm'
              }`}
            >
              <LayoutDashboard size={20} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'report'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'text-gray-600 hover:bg-white hover:shadow-sm'
              }`}
            >
              <PlusCircle size={20} />
              Report Bug
            </button>
            
            <div className="mt-auto pt-8 border-t border-gray-200 hidden md:block">
              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Role Info</h4>
                <p className="text-sm text-gray-600">
                  {isDeveloper 
                    ? 'You are logged in as a Developer. You can update bug statuses.' 
                    : 'You are logged in as a Tester. You can submit bug reports.'}
                </p>
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'view' ? (
                <motion.div
                  key="view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <BugList
                    bugs={bugs}
                    onUpdateStatus={handleUpdateStatus}
                    onDelete={handleDeleteBug}
                    isDeveloper={isDeveloper}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="report"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <BugForm onSubmit={handleReportBug} isSubmitting={isSubmitting} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center text-gray-400 text-sm">
        <p>ILIOS DIGITAL</p>
      </footer>
    </div>
  );
}
