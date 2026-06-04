import { apiClient } from '@/lib/apiClient';
import type { Child } from '@/types/child';
import { getMyStudents } from './parentService';

function toInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

export async function getChildren(): Promise<Child[]> {
  const [studentsRes, summariesRes] = await Promise.all([
    getMyStudents(),
    apiClient.get<Array<{ student: string; attendance_rate: number }>>('/api/attendance-summaries/'),
  ]);

  const summaries = Array.isArray(summariesRes.data)
    ? summariesRes.data
    : Array.isArray((summariesRes.data as { data?: unknown })?.data)
      ? ((summariesRes.data as { data: Array<{ student: string; attendance_rate: number }> }).data)
      : [];

  const attendanceByStudent = new Map(
    summaries.map((s) => [s.student, s.attendance_rate] as const)
  );

  return studentsRes.map((s) => ({
    id: s.id,
    branchId: s.branch,
    branchName: s.branch_name,
    gradeId: s.grade_id,
    sectionId: s.current_section,
    name: `${s.first_name} ${s.last_name}`.trim(),
    initials: toInitials(s.first_name, s.last_name),
    grade: s.grade_name ?? '',
    section: s.section_name ?? '',
    overallAvg: 0,
    attendance: attendanceByStudent.get(s.id) ?? 0,
    assignmentsDue: 0,
    missingWork: 0,
    subjects: [],
    attendance_log: [],
    homework: [],
    assignments: [],
    messages: [],
    notifications: [],
    schedule: [],
  }));
}

export async function getChild(childId: string): Promise<Child> {
  const children = await getChildren();
  const child = children.find((c) => c.id === childId);
  if (!child) throw new Error(`Student not found: ${childId}`);
  return child;
}
