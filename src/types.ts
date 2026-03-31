export interface Completion {
  stem: string;
  endings: string[];
}

export interface DayEntry {
  date: string;
  week: number;
  isSessionEnd?: boolean;
  type: 'morning' | 'evening';
  completions: Completion[];
  journal?: string;
}

export interface WeekendEntry {
  date: string;
  week: number;
  isSessionEnd?: boolean;
  type: 'weekend';
  completions: Completion[];
  journal?: string;
}

export type Entry = DayEntry | WeekendEntry;

export interface UserProgress {
  currentWeek: number;
  entries: Entry[];
  remindersEnabled: boolean;
  reminderTime: string;
  completedChapters: string[];
  pillarScores?: {
    awareness: number;
    acceptance: number;
    responsibility: number;
    assertiveness: number;
    purposefulness: number;
    integrity: number;
  };
}
