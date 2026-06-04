import type { HomeworkEntry } from './assignment';
import type { AssignmentEntry } from './assignment';
import type { MessageEntry } from './message';
import type { NotificationEntry } from './notification';
import type { ScheduleEntry } from './schedule';

export interface Subject {
  name: string;
  score: number;
  color: string;
  teacher: string;
}

export interface AttendanceLogEntry {
  date: string;
  status: 'present' | 'absent' | 'late' | 'no-school' | 'empty' | string;
}

export interface Child {
  id: string;
  branchId: string;
  branchName: string;
  gradeId: string | null;
  sectionId: string | null;
  name: string;
  initials: string;
  grade: string;
  section: string;
  overallAvg: number;
  attendance: number;
  assignmentsDue: number;
  missingWork: number;
  subjects: Subject[];
  attendance_log: AttendanceLogEntry[];
  homework: HomeworkEntry[];
  assignments: AssignmentEntry[];
  messages: MessageEntry[];
  notifications: NotificationEntry[];
  schedule: ScheduleEntry[];
}

// Student type compatible with AttendanceView
export interface Student {
  id?: string;
  name: string;
  grade: string;
  section: string;
  termAttendance?: number;
  daysPresent?: number;
  totalDays?: number;
  absences?: number;
  lates?: number;
}
