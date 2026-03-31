/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  BookOpen, 
  Layout, 
  CheckCircle2, 
  Settings, 
  BrainCircuit, 
  ChevronRight, 
  ChevronLeft,
  Moon,
  Sun,
  Bell,
  Info,
  Award,
  History,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Sparkles,
  RefreshCw,
  Feather,
  Flame,
  LogIn,
  LogOut,
  User as UserIcon,
  AlertCircle,
  Heart,
  Shield,
  Zap,
  Target,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { PILLARS_DATA } from './data/pillars';
import { PROGRAM_DATA } from './data/program';
import { CHAPTERS, Chapter } from './data/chapters';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, BarChart, Bar
} from 'recharts';
import { QUOTES } from './data/quotes';
import { UserProgress, Entry, Completion, DayEntry, WeekendEntry } from './types';
import { GoogleGenAI } from "@google/genai";
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, orderBy, limit, addDoc, getDocs, writeBatch } from 'firebase/firestore';

// --- Context & Types ---

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// --- Error Boundary ---

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) errorMessage = `Firestore Error: ${parsed.error}`;
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 max-w-md w-full text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Error</h2>
            <p className="text-gray-500 mb-6 text-sm">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-amber-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-700 transition-colors"
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

// --- Components ---

const QuoteOfTheDay = () => {
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  return (
    <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-3xl mb-8 relative overflow-hidden">
      <div className="absolute -top-4 -left-4 opacity-5 text-amber-900 pointer-events-none">
        <BookOpen size={120} />
      </div>
      <p className="text-lg font-serif italic text-amber-900 mb-3 relative z-10">
        "{quote.text}"
      </p>
      <p className="text-xs font-bold text-amber-600 uppercase tracking-widest relative z-10">
        — {quote.author}
      </p>
    </div>
  );
};

const BreathingExercise = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [timer, setTimer] = useState(4);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timer === 0) {
      if (phase === 'inhale') {
        setPhase('hold');
        setTimer(4);
      } else if (phase === 'hold') {
        setPhase('exhale');
        setTimer(4);
      } else if (phase === 'exhale') {
        onComplete();
      }
    }
  }, [timer, phase, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        animate={{
          scale: phase === 'inhale' ? [1, 1.5] : phase === 'hold' ? 1.5 : [1.5, 1],
        }}
        transition={{ duration: 4, ease: "easeInOut" }}
        className="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center mb-8 shadow-inner"
      >
        <div className="w-16 h-16 bg-amber-500 rounded-full opacity-20 animate-pulse" />
      </motion.div>
      <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2 capitalize">{phase}</h3>
      <p className="text-gray-500 font-medium">{timer} seconds</p>
    </div>
  );
};

const Navbar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const tabs = [
    { id: 'foundation', label: 'Learn', icon: BookOpen },
    { id: 'exercises', label: 'Practice', icon: Target },
    { id: 'insights', label: 'Insights', icon: BrainCircuit },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="max-w-md mx-auto flex justify-around md:max-w-4xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center p-2 rounded-lg transition-colors",
              activeTab === tab.id ? "text-amber-600" : "text-gray-500 hover:text-amber-400"
            )}
          >
            <tab.icon size={20} />
            <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

const FoundationPage = ({ progress, setProgress, onFinish }: { progress: UserProgress, setProgress: (p: UserProgress) => void, onFinish: () => void }) => {
  const { user } = useAuth();
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const chapter = CHAPTERS[currentChapterIndex];
  
  const completedChapters = progress.completedChapters || [];
  
  const IconMap: Record<string, any> = {
    Sparkles, Award, Sun, Heart, Shield, Zap, Target, CheckCircle2, UserIcon, Feather
  };
  const ChapterIcon = IconMap[chapter.icon] || Sparkles;

  const handleComplete = async () => {
    if (!completedChapters.includes(chapter.id)) {
      const newCompleted = [...completedChapters, chapter.id];
      const newProgress = { ...progress, completedChapters: newCompleted };
      setProgress(newProgress);
      
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid), { completedChapters: newCompleted });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
        }
      }
    }
    
    if (currentChapterIndex < CHAPTERS.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
    } else {
      onFinish();
    }
  };

  const progressPercentage = (completedChapters.length / CHAPTERS.length) * 100;

  return (
    <div className="pb-24 pt-8 px-6 max-w-4xl mx-auto min-h-[80vh] flex flex-col">
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-amber-600 uppercase tracking-widest">Foundation Course</h2>
          <span className="text-xs font-bold text-gray-400">{Math.round(progressPercentage)}% Complete</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            className="h-full bg-amber-500"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={chapter.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1 flex flex-col"
        >
          <div className={cn(
            "w-20 h-20 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-amber-100/50",
            `bg-${chapter.color}-50 text-${chapter.color}-600`
          )}>
            <ChapterIcon size={32} />
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold text-amber-600 mb-2">{chapter.subtitle}</h3>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-gray-900 leading-tight">
              {chapter.title}
            </h1>
          </div>

          <div className="prose prose-lg prose-amber max-w-none text-gray-600 leading-relaxed mb-12">
            <ReactMarkdown>{chapter.content}</ReactMarkdown>
          </div>

          <div className="mt-auto pt-8 border-t border-gray-100 space-y-8">
            <div className="flex justify-center gap-2">
              {CHAPTERS.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    i === currentChapterIndex ? "w-6 bg-amber-500" : 
                    completedChapters.includes(CHAPTERS[i].id) ? "bg-amber-200" : "bg-gray-100"
                  )} 
                />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                disabled={currentChapterIndex === 0}
                onClick={() => setCurrentChapterIndex(currentChapterIndex - 1)}
                className="flex items-center gap-2 text-gray-400 font-bold hover:text-gray-600 disabled:opacity-0 transition-all"
              >
                <ChevronLeft size={20} /> Previous
              </button>
              
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 bg-amber-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-100"
              >
                {currentChapterIndex === CHAPTERS.length - 1 ? "Finish" : "Next"} <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};


const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className="fixed bottom-24 left-4 right-4 bg-gray-900 text-white p-4 rounded-xl shadow-lg z-50 flex justify-between items-center md:bottom-8 md:left-auto md:right-8 md:w-80"
  >
    <span className="text-sm font-medium">{message}</span>
    <button onClick={onClose} className="text-gray-400 hover:text-white">
      <Trash2 size={16} />
    </button>
  </motion.div>
);

const ExercisePage = ({ progress, setProgress }: { progress: UserProgress, setProgress: (p: UserProgress) => void }) => {
  const { user } = useAuth();
  const [activeWeek, setActiveWeek] = useState(progress.currentWeek);
  const [showWeekSelector, setShowWeekSelector] = useState(false);
  const [view, setView] = useState<'morning' | 'evening' | 'weekend'>(() => {
    const day = new Date().getDay();
    if (day === 0 || day === 6) return 'weekend';
    const hour = new Date().getHours();
    return hour < 12 ? 'morning' : 'evening';
  });
  const [currentAnswers, setCurrentAnswers] = useState<string[]>([]);
  const [activeStemIndex, setActiveStemIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem('exercise_tutorial_seen');
  });
  const [tutorialStep, setTutorialStep] = useState(0);
  const [isBreathing, setIsBreathing] = useState(true);
  const [journalText, setJournalText] = useState("");
  const [showJournal, setShowJournal] = useState(false);

  const tutorialSteps = [
    {
      title: "Sentence Completion",
      content: "This practice helps you access your subconscious. Read the 'stem' in italics above.",
      target: "stem"
    },
    {
      title: "Adding Endings",
      content: "Type at least 3 different endings. Don't overthink—just write whatever comes to mind and press Enter.",
      target: "input"
    },
    {
      title: "Saving Progress",
      content: "Once you have at least 3 endings, click 'Next Stem' to move forward or 'Complete Session' to finish.",
      target: "button"
    }
  ];

  const nextTutorialStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      completeTutorial();
    }
  };

  const completeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('exercise_tutorial_seen', 'true');
  };

  const calculateStreak = () => {
    if (!progress.entries.length) return 0;
    
    const sortedDates = [...new Set(progress.entries.map(e => format(parseISO(e.date), 'yyyy-MM-dd')))]
      .sort((a, b) => b.localeCompare(a));
    
    let streak = 0;
    let currentDate = new Date();
    
    // Check if the most recent entry is today or yesterday
    const todayStr = format(currentDate, 'yyyy-MM-dd');
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
    
    if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) {
      return 0;
    }
    
    let checkDate = parseISO(sortedDates[0]);
    streak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(checkDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = format(prevDate, 'yyyy-MM-dd');
      
      if (sortedDates[i] === prevDateStr) {
        streak++;
        checkDate = parseISO(sortedDates[i]);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const streak = calculateStreak();

  const weekData = PROGRAM_DATA.find(w => w.week === activeWeek) || PROGRAM_DATA[0];
  const stems = view === 'morning' ? weekData.morningStems : view === 'evening' ? weekData.eveningStems : [weekData.weekendStem];
  const currentStem = stems[activeStemIndex];

  const handleAddAnswer = (answer: string) => {
    if (!answer.trim()) return;
    if (currentAnswers.length >= 10) {
      setToast("Maximum 10 endings reached.");
      return;
    }
    setCurrentAnswers([...currentAnswers, answer]);
  };

  const handleDeleteAnswer = (index: number) => {
    setCurrentAnswers(currentAnswers.filter((_, i) => i !== index));
  };

  const handleUpdateAnswer = (index: number, newValue: string) => {
    if (!newValue.trim()) return;
    const updated = [...currentAnswers];
    updated[index] = newValue;
    setCurrentAnswers(updated);
    setEditingIndex(null);
  };

  const handleSaveEntry = async () => {
    const entryDate = new Date();
    const isSessionEnd = activeStemIndex === stems.length - 1;

    const newEntry: Entry = {
      date: entryDate.toISOString(),
      week: activeWeek,
      type: view,
      completions: [{ stem: currentStem, endings: currentAnswers }],
      isSessionEnd,
      journal: journalText
    };

    const updatedEntries = [...progress.entries, newEntry];
    
    let nextWeek = progress.currentWeek;
    
    if (isSessionEnd) {
      // Count how many completed sessions exist for the current week in the updated entries
      const completedSessionsInCurrentWeek = updatedEntries.filter(e => 
        e.week === activeWeek && e.isSessionEnd
      ).length;

      if (completedSessionsInCurrentWeek >= 7) {
        nextWeek = Math.min(31, progress.currentWeek + 1);
        setActiveWeek(nextWeek); // Update local active week too
      }
    }

    const newProgress = { ...progress, entries: updatedEntries, currentWeek: nextWeek };
    setProgress(newProgress);

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { currentWeek: nextWeek });
        await addDoc(collection(db, 'users', user.uid, 'entries'), newEntry);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/entries`);
      }
    }
    
    if (activeStemIndex < stems.length - 1) {
      setActiveStemIndex(activeStemIndex + 1);
      setCurrentAnswers([]);
      setToast("Progress saved. Next stem...");
    } else {
      setToast(nextWeek > progress.currentWeek 
        ? "Week completed! Moving to next week's exercises." 
        : "Session completed! Great work on your self-esteem.");
      setActiveStemIndex(0);
      setCurrentAnswers([]);
      setJournalText("");
      setShowJournal(false);
      setIsBreathing(true); // Reset for next time
    }
  };

  if (isBreathing) {
    return (
      <div className="pb-20 pt-12 px-6 max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Center Yourself</h2>
        <p className="text-gray-500 mb-12">Take a moment to breathe before you begin your reflections.</p>
        <BreathingExercise onComplete={() => setIsBreathing(false)} />
        <button 
          onClick={() => setIsBreathing(false)}
          className="mt-12 text-amber-600 font-bold hover:text-amber-700 transition-colors"
        >
          Skip Breathing
        </button>
      </div>
    );
  }

  return (
    <div className="pb-20 pt-4 px-4 max-w-2xl mx-auto">
      <AnimatePresence>
        {showTutorial && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl relative"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                  <Info size={24} />
                </div>
                <button 
                  onClick={completeTutorial}
                  className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                >
                  Skip
                </button>
              </div>
              
              <h3 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                {tutorialSteps[tutorialStep].title}
              </h3>
              <p className="text-gray-500 leading-relaxed mb-8">
                {tutorialSteps[tutorialStep].content}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {tutorialSteps.map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === tutorialStep ? "w-6 bg-amber-500" : "w-1.5 bg-gray-200"
                      )} 
                    />
                  ))}
                </div>
                <button 
                  onClick={nextTutorialStep}
                  className="bg-amber-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-100"
                >
                  {tutorialStep === tutorialSteps.length - 1 ? "Get Started" : "Next"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => setActiveWeek(Math.max(1, activeWeek - 1))}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          onClick={() => setShowWeekSelector(true)}
          className="text-center group"
        >
          <h2 className="text-xl font-bold group-hover:text-amber-600 transition-colors">Week {activeWeek}</h2>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-sans group-hover:text-amber-400 transition-colors flex items-center justify-center gap-1">
            Change Week <ChevronRight size={10} className="rotate-90" />
          </p>
        </button>
        <button 
          onClick={() => setActiveWeek(Math.min(31, activeWeek + 1))}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <AnimatePresence>
        {showWeekSelector && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWeekSelector(false)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed inset-x-4 bottom-8 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[400px] bg-white rounded-[2.5rem] z-[70] shadow-2xl overflow-hidden p-6"
            >
              <h3 className="text-lg font-bold mb-4 px-2">Select Week</h3>
              <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto p-2">
                {PROGRAM_DATA.map((w) => (
                  <button
                    key={w.week}
                    onClick={() => { setActiveWeek(w.week); setShowWeekSelector(false); }}
                    className={cn(
                      "aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all",
                      activeWeek === w.week ? "bg-amber-600 text-white shadow-lg shadow-amber-100" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                    )}
                  >
                    {w.week}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {showTutorial && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-gray-100"
            >
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {tutorialSteps[tutorialStep].title}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-8">
                {tutorialSteps[tutorialStep].content}
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    if (tutorialStep < tutorialSteps.length - 1) {
                      setTutorialStep(tutorialStep + 1);
                    } else {
                      completeTutorial();
                    }
                  }}
                  className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-100"
                >
                  {tutorialStep === tutorialSteps.length - 1 ? "Got it!" : "Next Tip"}
                </button>
                <button 
                  onClick={completeTutorial}
                  className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-all"
                >
                  Skip Tutorial
                </button>
              </div>
              <div className="mt-6 flex justify-center gap-1.5">
                {tutorialSteps.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "h-1 rounded-full transition-all",
                      i === tutorialStep ? "w-6 bg-amber-500" : "w-1.5 bg-gray-200"
                    )} 
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
        {(['morning', 'evening', 'weekend'] as const).map((v) => (
          <button
            key={v}
            onClick={() => { setView(v); setActiveStemIndex(0); setCurrentAnswers([]); }}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all",
              view === v ? "bg-white text-amber-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {v}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeWeek}-${view}-${activeStemIndex}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest font-sans">
              Step {activeStemIndex + 1} of {stems.length}
            </div>
            <div className="flex gap-1">
              {stems.map((_, i) => (
                <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i === activeStemIndex ? "bg-amber-500" : "bg-gray-200")} />
              ))}
            </div>
          </div>
          
          <h3 className="text-2xl font-serif font-bold text-gray-800 mb-8 leading-tight italic">
            "{currentStem}"
          </h3>

          <div className="space-y-3 mb-8 min-h-[100px]">
            {currentAnswers.map((ans, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={i} 
                className="flex items-center gap-3 bg-amber-50/50 p-4 rounded-2xl text-sm text-gray-700 border border-amber-100/50 group"
              >
                <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-amber-600 text-white rounded-full text-[10px] font-bold">
                  {i + 1}
                </span>
                
                {editingIndex === i ? (
                  <div className="flex-1 flex gap-2">
                    <input 
                      autoFocus
                      className="flex-1 bg-white border border-amber-200 rounded-lg px-2 py-1 outline-none text-sm"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateAnswer(i, editingValue);
                        if (e.key === 'Escape') setEditingIndex(null);
                      }}
                    />
                    <button onClick={() => handleUpdateAnswer(i, editingValue)} className="text-green-600 hover:text-green-700">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditingIndex(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 leading-relaxed">{ans}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setEditingIndex(i); setEditingValue(ans); }}
                        className="p-1 text-gray-400 hover:text-amber-600 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteAnswer(i)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
            {currentAnswers.length === 0 && (
              <div className="h-24 flex items-center justify-center text-gray-300 text-sm italic border-2 border-dashed border-gray-50 rounded-2xl">
                Your endings will appear here...
              </div>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Type your ending..."
              className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all pr-14 text-gray-800"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddAnswer(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
            <button 
              onClick={(e) => {
                const input = e.currentTarget.previousSibling as HTMLInputElement;
                handleAddAnswer(input.value);
                input.value = '';
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-amber-600 text-white hover:bg-amber-700 rounded-xl transition-colors shadow-md shadow-amber-100"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="mt-10 flex items-center justify-between">
            <div className="text-xs text-gray-400 font-medium">
              {currentAnswers.length}/10 endings (min 3)
            </div>
            <button
              disabled={currentAnswers.length < 3}
              onClick={handleSaveEntry}
              className={cn(
                "px-8 py-4 rounded-2xl font-bold transition-all shadow-lg",
                currentAnswers.length >= 3 
                  ? "bg-amber-600 text-white hover:bg-amber-700 shadow-amber-100" 
                  : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
              )}
            >
              {activeStemIndex === stems.length - 1 ? "Complete Session" : "Next Stem"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 pt-8 border-t border-gray-100">
        {!showJournal ? (
          <button 
            onClick={() => setShowJournal(true)}
            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold hover:border-amber-200 hover:text-amber-600 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Add free-form reflection
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Journal Reflection</h4>
              <button onClick={() => setShowJournal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <textarea
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              placeholder="What else is on your mind? How do these stems make you feel?"
              className="w-full h-40 p-6 bg-gray-50 rounded-3xl border-none focus:ring-2 focus:ring-amber-500/20 text-gray-700 leading-relaxed resize-none"
            />
          </div>
        )}
      </div>

      <div className="mt-16">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 rounded-[2.5rem] text-white mb-12 shadow-xl shadow-amber-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Flame size={120} />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="text-amber-100 text-xs font-bold uppercase tracking-widest mb-2">Current Streak</div>
              <div className="text-5xl font-serif font-bold flex items-baseline gap-2">
                {streak} <span className="text-xl font-sans font-medium text-amber-100">Days</span>
              </div>
            </div>
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Flame size={32} />
            </div>
          </div>
          <div className="mt-6 text-sm text-amber-50/80 font-medium">
            {streak === 0 ? "Start your journey today!" : 
             streak === 1 ? "Great start! Keep it up tomorrow." : 
             "You're on fire! Consistency is key to growth."}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <History size={22} className="text-amber-500" />
            Your Journey
          </h3>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
            {progress.entries.length} Sessions
          </span>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {progress.entries.slice(-5).reverse().map((entry, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 flex justify-between items-center hover:border-amber-100 transition-colors group">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  entry.type === 'morning' ? "bg-amber-50 text-amber-500" : 
                  entry.type === 'evening' ? "bg-amber-100 text-amber-600" : "bg-amber-200 text-amber-700"
                )}>
                  {entry.type === 'morning' ? <Sun size={20} /> : 
                   entry.type === 'evening' ? <Moon size={20} /> : <Award size={20} />}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-800 capitalize">{entry.type} Reflection</div>
                  <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{format(parseISO(entry.date), 'MMMM do, yyyy')}</div>
                </div>
              </div>
              <div className="text-xs font-bold text-gray-400 group-hover:text-amber-600 transition-colors">
                {entry.completions[0].endings.length} Endings
              </div>
            </div>
          ))}
          {progress.entries.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-3xl bg-white/50">
              <BookOpen size={32} className="mx-auto mb-3 opacity-20" />
              Your growth story starts here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const InsightsPage = ({ progress }: { progress: UserProgress }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prepare data for the radar chart
  const radarData = [
    { subject: 'Awareness', A: progress.pillarScores?.awareness || 50, fullMark: 100 },
    { subject: 'Acceptance', A: progress.pillarScores?.acceptance || 50, fullMark: 100 },
    { subject: 'Responsibility', A: progress.pillarScores?.responsibility || 50, fullMark: 100 },
    { subject: 'Assertiveness', A: progress.pillarScores?.assertiveness || 50, fullMark: 100 },
    { subject: 'Purpose', A: progress.pillarScores?.purposefulness || 50, fullMark: 100 },
    { subject: 'Integrity', A: progress.pillarScores?.integrity || 50, fullMark: 100 },
  ];

  // Prepare data for the progress chart (sessions per week)
  const sessionsPerWeek = Array.from({ length: progress.currentWeek }, (_, i) => {
    const weekNum = i + 1;
    const count = progress.entries.filter(e => e.week === weekNum && e.isSessionEnd).length;
    return { name: `W${weekNum}`, sessions: count };
  });

  const generateInsights = async () => {
    if (progress.entries.length < 3) {
      setError("Please complete at least 3 sessions to generate meaningful insights. You've completed " + progress.entries.length + " so far.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      
      const dataSummary = progress.entries.map(e => {
        return `Type: ${e.type}\nStems & Endings:\n${e.completions.map(c => `- ${c.stem}\n  ${c.endings.join('\n  ')}`).join('\n')}`;
      }).join('\n\n---\n\n');

      const prompt = `
        You are a psychological assistant trained in the principles of Nathaniel Branden's "The Six Pillars of Self-Esteem".
        Below are a user's responses to sentence-completion exercises.
        Analyze these responses to identify:
        1. Recurring themes or patterns.
        2. Potential psychological blockages or limiting beliefs.
        3. Areas of strength or growth.
        4. Actionable advice based on the Six Pillars.

        User Data:
        ${dataSummary}

        Provide a compassionate, insightful, and structured synthesis. Use Markdown for formatting.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      if (!response.text) {
        throw new Error("The AI returned an empty response. Please try again.");
      }

      setInsight(response.text);
    } catch (err: any) {
      console.error("Error generating insights:", err);
      setError(err.message || "Failed to generate insights. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20 pt-4 px-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
          <BrainCircuit size={24} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
      </div>
      <p className="text-gray-500 mb-8">Synthesizing your journey to understand blockages and growth.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">Pillar Radar Map</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="55%" data={radarData} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
                <PolarGrid stroke="#f3f4f6" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 9 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Pillars"
                  dataKey="A"
                  stroke="#d97706"
                  fill="#f59e0b"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-[10px] text-gray-400 text-center leading-relaxed">
            This map represents your perceived strength in each of the six pillars of self-esteem.
          </p>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">Weekly Progress</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionsPerWeek}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 10 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 10 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#fff7ed' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sessions" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-[10px] text-gray-400 text-center leading-relaxed">
            Number of completed sessions per week. Aim for 7 sessions to advance.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold mb-1">Analysis Error</p>
            <p>{error}</p>
            {progress.entries.length >= 3 && (
              <button 
                onClick={generateInsights}
                className="mt-2 text-xs font-bold underline hover:text-red-700"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      )}

      {!insight && !loading && (
        <div className="bg-gradient-to-br from-amber-600 to-orange-600 p-8 rounded-[2.5rem] text-center text-white shadow-xl shadow-amber-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={120} />
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Zap size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Ready to analyze your progress?</h3>
            <p className="text-amber-100 mb-8 text-sm max-w-xs mx-auto">
              Our AI will review your {progress.entries.length} sessions to help you identify subconscious patterns and growth areas.
            </p>
            <button 
              onClick={generateInsights}
              className="bg-white text-amber-600 px-10 py-4 rounded-2xl font-bold hover:bg-amber-50 transition-all shadow-lg shadow-black/5 active:scale-95"
            >
              Generate Synthesis
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-gray-100 border-dashed">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-amber-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-amber-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-900 font-bold mb-1">Analyzing your reflections</p>
          <p className="text-gray-400 text-sm animate-pulse">This may take a few moments...</p>
        </div>
      )}

      {insight && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm prose prose-amber max-w-none"
        >
          <div className="flex items-center gap-2 mb-6 not-prose">
            <div className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-widest">
              AI Synthesis
            </div>
            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
              Generated {new Date().toLocaleDateString()}
            </div>
          </div>
          <ReactMarkdown>{insight}</ReactMarkdown>
          <div className="mt-10 pt-8 border-t flex justify-between items-center not-prose">
            <button 
              onClick={() => setInsight(null)}
              className="text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} />
              Clear Analysis
            </button>
            <button 
              onClick={generateInsights}
              className="bg-amber-50 text-amber-600 px-6 py-2 rounded-xl text-sm font-bold hover:bg-amber-100 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const SettingsPage = ({ progress, setProgress }: { progress: UserProgress, setProgress: (p: UserProgress) => void }) => {
  const { user, signIn, logout } = useAuth();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleToggleReminders = async () => {
    const newProgress = { ...progress, remindersEnabled: !progress.remindersEnabled };
    setProgress(newProgress);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { remindersEnabled: newProgress.remindersEnabled });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const handleTimeChange = async (time: string) => {
    const newProgress = { ...progress, reminderTime: time };
    setProgress(newProgress);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { reminderTime: time });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const handleClearData = async () => {
    const resetProgress = {
      currentWeek: 1,
      entries: [],
      remindersEnabled: false,
      reminderTime: '08:00',
      completedChapters: []
    };
    setProgress(resetProgress);
    localStorage.removeItem('pillars_progress');
    
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          currentWeek: 1,
          remindersEnabled: false,
          reminderTime: '08:00',
          completedChapters: []
        });
        // Clear entries in Firestore
        const entriesRef = collection(db, 'users', user.uid, 'entries');
        const snapshot = await getDocs(entriesRef);
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      }
    }
    setShowClearConfirm(false);
  };

  const progressPercentage = (progress.completedChapters.length / CHAPTERS.length) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-24 pt-8 px-6 max-w-2xl mx-auto"
    >
      <div className="mb-12">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Profile & Settings</h1>
        <p className="text-gray-500">Manage your journey and preferences.</p>
      </div>

      <div className="space-y-6">
        {/* Progress Overview */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-orange-100 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <Trophy size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Learning Progress</h3>
              <p className="text-sm text-gray-500">{progress.completedChapters.length} of {CHAPTERS.length} chapters completed</p>
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              className="h-full bg-amber-500"
            />
          </div>
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest text-center">
            {Math.round(progressPercentage)}% Complete
          </p>
        </div>

        {/* Account Section */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-orange-100 shadow-sm">
          <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-6">Account</h3>
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={user.photoURL || ''} alt="" className="w-12 h-12 rounded-full border-2 border-amber-100" />
                <div>
                  <p className="font-bold text-gray-900">{user.displayName}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                title="Sign Out"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-6">Sign in to sync your progress across devices.</p>
              <button 
                onClick={signIn}
                className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-100"
              >
                <LogIn size={20} /> Sign in with Google
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-orange-100 shadow-sm">
          <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-6">Notifications</h3>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-900">Daily Reminders</p>
                <p className="text-sm text-gray-500">Stay consistent with your practice</p>
              </div>
            </div>
            <button 
              onClick={handleToggleReminders}
              className={cn(
                "w-14 h-8 rounded-full transition-all relative",
                progress.remindersEnabled ? "bg-amber-600" : "bg-gray-200"
              )}
            >
              <motion.div 
                animate={{ x: progress.remindersEnabled ? 24 : 4 }}
                className="absolute top-1 left-0 w-6 h-6 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>

          {progress.remindersEnabled && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-4 border-t border-gray-50"
            >
              <label className="block text-sm font-bold text-gray-700 mb-2">Reminder Time</label>
              <input 
                type="time" 
                value={progress.reminderTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </motion.div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-red-100 shadow-sm">
          <h3 className="text-xs font-bold text-red-600 uppercase tracking-widest mb-6">Danger Zone</h3>
          <button 
            onClick={() => setShowClearConfirm(true)}
            className="w-full flex items-center justify-center gap-2 text-red-600 bg-red-50 px-6 py-4 rounded-2xl font-bold hover:bg-red-100 transition-all"
          >
            <Trash2 size={20} /> Clear All Data
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showClearConfirm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearConfirm(false)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[400px] bg-white rounded-[2.5rem] z-[70] shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">Are you sure?</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">This will permanently delete all your entries and reset your progress. This action cannot be undone.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleClearData}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  Clear Data
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Main App ---

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const LandingPage = ({ onStart }: { onStart: () => void }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      {/* Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-50 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-50 rounded-full blur-3xl opacity-50" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 max-w-2xl"
      >
        <div className="mb-8 inline-block p-4 bg-amber-600 rounded-[2rem] text-white shadow-2xl shadow-amber-200/50 transform -rotate-6">
          <Sparkles size={48} />
        </div>
        
        <h1 className="text-6xl md:text-8xl font-serif font-bold text-gray-900 mb-6 tracking-tight leading-none">
          Pillars of <span className="text-amber-600 italic">Esteem</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-500 mb-12 leading-relaxed font-light">
          A transformative journey into the science of self-worth. Based on the principles of Nathaniel Branden's <span className="font-medium text-gray-900">Six Pillars of Self-Esteem</span>.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left">
          {[
            { icon: BrainCircuit, title: "Insights", desc: "AI-powered analysis of your reflections." },
            { icon: Target, title: "Practice", desc: "Daily sentence completion exercises." },
            { icon: BookOpen, title: "Foundation", desc: "Learn the core pillars of self-worth." }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="p-6 bg-gray-50 rounded-3xl border border-gray-100"
            >
              <feature.icon className="text-amber-600 mb-3" size={24} />
              <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        <QuoteOfTheDay />
        
        <button 
          onClick={onStart}
          className="group relative inline-flex items-center justify-center px-10 py-5 font-bold text-white transition-all duration-200 bg-amber-600 font-pj rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-600 shadow-xl shadow-amber-200 hover:bg-amber-700"
        >
          Begin Your Journey
          <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
        </button>
        
        <p className="mt-8 text-xs text-gray-400 uppercase tracking-widest font-medium">
          No credit card required • Free forever
        </p>
      </motion.div>
    </div>
  );
};

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('foundation');
  const [showLanding, setShowLanding] = useState(() => {
    return !localStorage.getItem('landing_seen');
  });
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('pillars_progress');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        completedChapters: parsed.completedChapters || []
      };
    }
    return {
      currentWeek: 1,
      entries: [],
      remindersEnabled: false,
      reminderTime: '08:00',
      completedChapters: []
    };
  });

  // Sync with Firestore when logged in
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    
    // 1. Fetch/Initialize User Profile
    const unsubProfile = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProgress(prev => ({
          ...prev,
          currentWeek: data.currentWeek || 1,
          remindersEnabled: data.remindersEnabled || false,
          reminderTime: data.reminderTime || '08:00',
          completedChapters: data.completedChapters || []
        }));
      } else {
        // Initialize profile if it doesn't exist
        setDoc(userRef, {
          currentWeek: progress.currentWeek,
          remindersEnabled: progress.remindersEnabled,
          reminderTime: progress.reminderTime,
          completedChapters: progress.completedChapters
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

    // 2. Fetch Entries
    const entriesRef = collection(db, 'users', user.uid, 'entries');
    const q = query(entriesRef, orderBy('date', 'asc'));
    const unsubEntries = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => doc.data() as Entry);
      setProgress(prev => ({ ...prev, entries }));
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/entries`));

    return () => {
      unsubProfile();
      unsubEntries();
    };
  }, [user]);

  // Local storage fallback/sync for guests
  useEffect(() => {
    if (!user) {
      localStorage.setItem('pillars_progress', JSON.stringify(progress));
    }
  }, [progress, user]);

  const handleStart = () => {
    setShowLanding(false);
    localStorage.setItem('landing_seen', 'true');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (showLanding) {
    return <LandingPage onStart={handleStart} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'foundation': return <FoundationPage progress={progress} setProgress={setProgress} onFinish={() => setActiveTab('exercises')} />;
      case 'exercises': return <ExercisePage progress={progress} setProgress={setProgress} />;
      case 'insights': return <InsightsPage progress={progress} />;
      case 'settings': return <SettingsPage progress={progress} setProgress={setProgress} />;
      default: return <FoundationPage progress={progress} setProgress={setProgress} onFinish={() => setActiveTab('exercises')} />;
    }
  };

  return (
    <div className="min-h-screen bg-orange-50/30 font-sans text-gray-900 md:pt-16">
      <header className="bg-white/80 backdrop-blur-md border-b border-orange-100 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amber-600 p-1.5 rounded-lg text-white shadow-lg shadow-amber-100">
              <Trophy size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Pillars of Esteem</h1>
              {user && (
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Welcome back, {user.displayName?.split(' ')[0]}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTab('settings')}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all border-2",
                activeTab === 'settings' ? "border-amber-500 bg-amber-50 text-amber-600" : "border-transparent bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon size={20} />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {renderContent()}
      </main>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

