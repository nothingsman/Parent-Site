import { Child } from '@/types';

export interface HomeworkItem {
  title: string;
  subject: string;
  type: string;
  dueDate: string;
  color: string;
  status: string;
  statusVariant: "emerald" | "amber" | "red" | "blue" | "slate";
}

export interface MockBehaviourLogGroup {
  childId: string;
  entries: Array<{
    id: string;
    type: 'incident' | 'remark';
    title: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    teacherName: string;
    source: string;
    occurredAt: string;
    createdAt: string;
  }>;
}

export interface MockAnnouncement {
  id: string;
  branch: string;
  subject: string;
  message: string;
  scheduled_at: string | null;
  is_urgent: boolean;
  status: 'DRAFT' | 'SENT' | 'SCHEDULED';
  target_roles: 'PARENTS' | 'TEACHERS' | 'BOTH';
  targeted_grades: string[];
  targeted_sections: string[];
  created_at: string;
  updated_at: string;
}

export const PARENT_NAME = 'Bekele';

export const CHILDREN: Child[] = [
  {
    id: "STU-00421",
    branchId: "branch-1",
    branchName: "Main Branch",
    gradeId: "grade-7",
    sectionId: "section-1",
    name: "Sara Bekele",
    initials: "SB",
    grade: "7",
    section: "A",
    overallAvg: 76,
    attendance: 97,
    assignmentsDue: 2,
    missingWork: 1,
    subjects: [
      {
        name: "Mathematics",
        score: 78,
        color: "#3949ab",
        teacher: "Mr. Tesfaye",
      },
      { name: "Physics", score: 74, color: "#7c3aed", teacher: "Ms. Bekele" },
      { name: "Biology", score: 76, color: "#059669", teacher: "Ms. Haile" },
    ],
    attendance_log: [
      { date: "2025-06-02", status: "present" },
      { date: "2025-06-03", status: "present" },
      { date: "2025-06-04", status: "present" },
      { date: "2025-06-05", status: "present" },
      { date: "2025-06-06", status: "present" },
      { date: "2025-05-26", status: "present" },
      { date: "2025-05-27", status: "absent" },
      { date: "2025-05-28", status: "present" },
      { date: "2025-05-29", status: "late" },
      { date: "2025-05-30", status: "present" },
    ],
    homework: [
      {
        id: "HW-1",
        title: "Linear Equations Practice",
        subject: "Mathematics",
        subjectColor: "#3949ab",
        date: "Jun 2",
        score: 7,
        maxScore: 10,
        status: "graded",
        type: "Homework",
      },
      {
        id: "HW-2",
        title: "Newton's Laws Questions",
        subject: "Physics",
        subjectColor: "#7c3aed",
        date: "Jun 1",
        score: null,
        maxScore: 10,
        status: "missing",
        type: "Homework",
      },
    ],
    assignments: [
      {
        id: "ASN-1",
        title: "Chapter 3 Summary — Algebra",
        subject: "Mathematics",
        subjectColor: "#3949ab",
        type: "Homework",
        dueDate: "Jun 3, 2025",
        status: "due",
        score: null,
        maxScore: 20,
        description: "Write a one-page summary of Chapter 3.",
      },
      {
        id: "ASN-2",
        title: "Mid-Term Practice Quiz",
        subject: "Mathematics",
        subjectColor: "#3949ab",
        type: "Quiz",
        dueDate: "Jun 2, 2025",
        status: "graded",
        score: 22,
        maxScore: 30,
        description: "20-question practice quiz for the mid-term.",
      },
      {
        id: "ASN-3",
        title: "Newton's Laws Lab Report",
        subject: "Physics",
        subjectColor: "#7c3aed",
        type: "Lab Report",
        dueDate: "Jun 5, 2025",
        status: "due",
        score: null,
        maxScore: 50,
        description: "Submit the lab report from last Thursday.",
      },
    ],
    messages: [
      {
        id: "M1",
        teacherName: "Mr. Tesfaye",
        teacherInitials: "MT",
        subject: "Mathematics",
        preview: "Sara is working hard this term in Mathematics classes.",
        time: "9:42 AM",
        unread: true,
      },
    ],
    notifications: [
      {
        id: "N1",
        type: "grade",
        title: "Grade posted — Algebra Practice",
        category: "grade",
        time: "Just now",
        read: false,
        detail: "Mathematics · 7/10 · Just now",
      },
      {
        id: "N2",
        type: "urgent",
        title: "Assignment due in 2 days",
        category: "announcement",
        time: "Jun 3",
        read: false,
        detail: "Chapter 3 Summary · Jun 3",
      },
    ],
    schedule: [
      {
        id: "S1",
        time: "7:30 AM",
        subject: "Mathematics",
        teacher: "Mr. Tesfaye",
        room: "Room 12",
        color: "#3949ab",
        type: "Lecture",
      },
      {
        id: "S2",
        time: "9:00 AM",
        subject: "Physics",
        teacher: "Ms. Bekele",
        room: "Room 7",
        color: "#7c3aed",
        type: "Lab",
      },
      {
        id: "S3",
        time: "10:30 AM",
        subject: "Biology",
        teacher: "Ms. Haile",
        room: "Room 9",
        color: "#059669",
        type: "Lecture",
      },
    ],
  },
  {
    id: "STU-00398",
    branchId: "branch-1",
    branchName: "Main Branch",
    gradeId: "grade-4",
    sectionId: "section-2",
    name: "Yonas Bekele",
    initials: "YB",
    grade: "4",
    section: "B",
    overallAvg: 84,
    attendance: 94,
    assignmentsDue: 0,
    missingWork: 0,
    subjects: [
      { name: "English", score: 85, color: "#0891b2", teacher: "Mr. Alemu" },
      {
        name: "Mathematics",
        score: 83,
        color: "#3949ab",
        teacher: "Mr. Tesfaye",
      },
      { name: "Science", score: 84, color: "#059669", teacher: "Ms. Haile" },
    ],
    attendance_log: [
      { date: "2025-06-02", status: "present" },
      { date: "2025-06-03", status: "present" },
      { date: "2025-06-04", status: "present" },
      { date: "2025-06-05", status: "present" },
      { date: "2025-06-06", status: "present" },
    ],
    homework: [
      {
        id: "HW-B1",
        title: "Reading comprehension",
        subject: "English",
        subjectColor: "#0891b2",
        date: "Jun 2",
        score: 8,
        maxScore: 10,
        status: "graded",
        type: "Homework",
      },
      {
        id: "HW-B2",
        title: "Algebra Patterns",
        subject: "Mathematics",
        subjectColor: "#3949ab",
        date: "Jun 1",
        score: 9,
        maxScore: 10,
        status: "graded",
        type: "Homework",
      },
    ],
    assignments: [
      {
        id: "ASN-B1",
        title: "Science Water Cycle Diagram",
        subject: "Science",
        subjectColor: "#059669",
        type: "Project",
        dueDate: "Jun 4, 2025",
        status: "submitted",
        score: null,
        maxScore: 20,
        description: "Draw and label the steps of the water cycle.",
      },
    ],
    messages: [],
    notifications: [
      {
        id: "N-B1",
        type: "grade",
        title: "Science diagram submitted",
        category: "grade",
        time: "Awaiting review",
        read: false,
        detail: "Awaiting review by Ms. Haile",
      },
    ],
    schedule: [
      {
        id: "SB1",
        time: "7:30 AM",
        subject: "Mathematics",
        teacher: "Mr. Tesfaye",
        room: "Room 8",
        color: "#3949ab",
        type: "Lecture",
      },
      {
        id: "SB2",
        time: "9:00 AM",
        subject: "English",
        teacher: "Mr. Alemu",
        room: "Room 2",
        color: "#0891b2",
        type: "Lecture",
      },
      {
        id: "SB3",
        time: "10:30 AM",
        subject: "Science",
        teacher: "Ms. Haile",
        room: "Room 9",
        color: "#059669",
        type: "Lab",
      },
    ],
  },
  {
    id: "STU-00502",
    branchId: "branch-1",
    branchName: "Main Branch",
    gradeId: "grade-10",
    sectionId: "section-3",
    name: "Liya Bekele",
    initials: "LB",
    grade: "10",
    section: "A",
    overallAvg: 89,
    attendance: 95,
    assignmentsDue: 3,
    missingWork: 0,
    subjects: [
      { name: "Chemistry", score: 87, color: "#0891b2", teacher: "Ms. Almaz" },
      { name: "History", score: 92, color: "#d97706", teacher: "Mr. Girma" },
      {
        name: "English Lit",
        score: 88,
        color: "#7c3aed",
        teacher: "Ms. Kidist",
      },
    ],
    attendance_log: [
      { date: "2025-06-02", status: "present" },
      { date: "2025-06-03", status: "present" },
      { date: "2025-06-04", status: "present" },
      { date: "2025-06-05", status: "present" },
      { date: "2025-06-06", status: "present" },
    ],
    homework: [
      {
        id: "HW-C1",
        title: "Stoichiometry Worksheet",
        subject: "Chemistry",
        subjectColor: "#0891b2",
        date: "Jun 2",
        score: 9,
        maxScore: 10,
        status: "graded",
        type: "Homework",
      },
      {
        id: "HW-C2",
        title: "French Revolution Quiz",
        subject: "History",
        subjectColor: "#d97706",
        date: "Jun 1",
        score: 10,
        maxScore: 10,
        status: "graded",
        type: "Homework",
      },
    ],
    assignments: [
      {
        id: "ASN-C1",
        title: "Lab Report: Gas Laws",
        subject: "Chemistry",
        subjectColor: "#0891b2",
        type: "Lab Report",
        dueDate: "Jun 6, 2025",
        status: "due",
        score: null,
        maxScore: 50,
        description: "Submit detailed research on ideal gas laws in lab conditions.",
      },
      {
        id: "ASN-C2",
        title: "Hamlet Essay Draft",
        subject: "English Lit",
        subjectColor: "#7c3aed",
        type: "Essay",
        dueDate: "Jun 5, 2025",
        status: "due",
        score: null,
        maxScore: 30,
        description: "Draft analysis of Hamlet's third soliloquy.",
      },
      {
        id: "ASN-C3",
        title: "WWI Timeline Project",
        subject: "History",
        subjectColor: "#d97706",
        type: "Project",
        dueDate: "Jun 7, 2025",
        status: "due",
        score: null,
        maxScore: 40,
        description: "Create visual timeline of events leading up to first world war.",
      },
    ],
    messages: [
      {
        id: "MC1",
        teacherName: "Ms. Almaz",
        teacherInitials: "MA",
        subject: "Chemistry",
        preview: "Liya is taking exceptionally mature leadership in laboratory practices. Superb work.",
        time: "Just now",
        unread: true,
      },
    ],
    notifications: [
      {
        id: "NC1",
        type: "grade",
        title: "New Lab Report assigned",
        category: "announcement",
        time: "Due Jun 6",
        read: false,
        detail: "Due Jun 6 · Gas Laws",
      },
    ],
    schedule: [
      {
        id: "SC1",
        time: "7:30 AM",
        subject: "Chemistry",
        teacher: "Ms. Almaz",
        room: "Room 14",
        color: "#0891b2",
        type: "Lab",
      },
      {
        id: "SC2",
        time: "9:00 AM",
        subject: "History",
        teacher: "Mr. Girma",
        room: "Room 5",
        color: "#d97706",
        type: "Lecture",
      },
      {
        id: "SC3",
        time: "10:30 AM",
        subject: "English Lit",
        teacher: "Ms. Kidist",
        room: "Room 11",
        color: "#7c3aed",
        type: "Lecture",
      },
    ],
  },
];

export const BEHAVIOUR_LOGS: MockBehaviourLogGroup[] = [
  {
    childId: "STU-00421",
    entries: [
      {
        id: "BL-1",
        type: "incident",
        title: "Classroom disruption",
        description: "Interrupted peers during a lab briefing.",
        severity: "HIGH",
        teacherName: "Ms. Bekele",
        source: "Teacher Incident",
        occurredAt: "2026-06-03T08:10:00Z",
        createdAt: "2026-06-03T08:20:00Z",
      },
      {
        id: "BL-2",
        type: "remark",
        title: "Improved participation",
        description: "Asked thoughtful questions and stayed engaged.",
        severity: "LOW",
        teacherName: "Mr. Tesfaye",
        source: "Teacher Remark",
        occurredAt: "2026-06-04T09:00:00Z",
        createdAt: "2026-06-04T09:10:00Z",
      },
    ],
  },
  {
    childId: "STU-00398",
    entries: [
      {
        id: "BL-3",
        type: "remark",
        title: "Helpful in class",
        description: "Supported classmates during reading time.",
        severity: "LOW",
        teacherName: "Mr. Alemu",
        source: "Teacher Remark",
        occurredAt: "2026-06-02T10:00:00Z",
        createdAt: "2026-06-02T10:05:00Z",
      },
    ],
  },
  {
    childId: "STU-00502",
    entries: [],
  },
];

export const ANNOUNCEMENTS: MockAnnouncement[] = [
  {
    id: "ANN-1",
    branch: "branch-1",
    subject: "Parent meeting this Friday",
    message: "All Grade 7 parents are invited to the branch hall at 3:00 PM.",
    scheduled_at: null,
    is_urgent: false,
    status: "SENT",
    target_roles: "PARENTS",
    targeted_grades: ["grade-7"],
    targeted_sections: [],
    created_at: "2026-06-01T09:00:00Z",
    updated_at: "2026-06-01T09:15:00Z",
  },
  {
    id: "ANN-2",
    branch: "branch-1",
    subject: "Section A transport change",
    message: "Pickup time for Section A will move to 4:15 PM on Thursday.",
    scheduled_at: "2026-06-06T06:30:00Z",
    is_urgent: true,
    status: "SCHEDULED",
    target_roles: "PARENTS",
    targeted_grades: [],
    targeted_sections: ["section-1"],
    created_at: "2026-06-02T07:00:00Z",
    updated_at: "2026-06-02T07:05:00Z",
  },
  {
    id: "ANN-3",
    branch: "branch-1",
    subject: "Branch-wide family day",
    message: "Families are welcome to attend the branch family day next week.",
    scheduled_at: null,
    is_urgent: false,
    status: "SENT",
    target_roles: "PARENTS",
    targeted_grades: [],
    targeted_sections: [],
    created_at: "2026-05-30T11:00:00Z",
    updated_at: "2026-05-31T08:00:00Z",
  },
  {
    id: "ANN-4",
    branch: "branch-1",
    subject: "Grade 10 exam timetable",
    message: "Grade 10 parents should review the updated exam timetable.",
    scheduled_at: null,
    is_urgent: true,
    status: "SENT",
    target_roles: "PARENTS",
    targeted_grades: ["grade-10"],
    targeted_sections: [],
    created_at: "2026-06-03T12:00:00Z",
    updated_at: "2026-06-03T12:00:00Z",
  },
  {
    id: "ANN-5",
    branch: "branch-1",
    subject: "Draft should not show",
    message: "This draft announcement must be excluded.",
    scheduled_at: null,
    is_urgent: false,
    status: "DRAFT",
    target_roles: "PARENTS",
    targeted_grades: ["grade-7"],
    targeted_sections: [],
    created_at: "2026-06-04T12:00:00Z",
    updated_at: "2026-06-04T12:00:00Z",
  },
];

export const HOMEWORK_MAP: Record<string, HomeworkItem[]> = {
  "STU-00421": [
    {
      title: "Solve Quadratic Equations",
      subject: "Mathematics",
      type: "10 questions",
      dueDate: "Due tomorrow",
      color: "#3949ab",
      status: "in progress",
      statusVariant: "amber",
    },
    {
      title: "Gravity & Friction Worksheet",
      subject: "Physics",
      type: "Problem solving",
      dueDate: "Due in 2 days",
      color: "#7c3aed",
      status: "not started",
      statusVariant: "slate",
    },
    {
      title: "Draw Plant Cell Diagram & label organelles",
      subject: "Biology",
      type: "Diagram drawing",
      dueDate: "Due Friday",
      color: "#059669",
      status: "due tomorrow",
      statusVariant: "red",
    },
  ],
  "STU-00398": [
    {
      title: "Adverbs and Adjectives Practice",
      subject: "English",
      type: "Grammar exercise",
      dueDate: "Due tomorrow",
      color: "#0891b2",
      status: "in progress",
      statusVariant: "amber",
    },
    {
      title: "Division Word Problems",
      subject: "Mathematics",
      type: "12 questions",
      dueDate: "Due in 2 days",
      color: "#3949ab",
      status: "not started",
      statusVariant: "slate",
    },
    {
      title: "Water Cycle Stages Poster",
      subject: "Science",
      type: "Drawing + labels",
      dueDate: "Due Friday",
      color: "#059669",
      status: "due tomorrow",
      statusVariant: "red",
    },
  ],
  "STU-00502": [
    {
      title: "Balancing Chemical Equations",
      subject: "Chemistry",
      type: "15 questions",
      dueDate: "Due tomorrow",
      color: "#0891b2",
      status: "in progress",
      statusVariant: "amber",
    },
    {
      title: "French Revolution Timeline",
      subject: "History",
      type: "Reading + summary",
      dueDate: "Due in 2 days",
      color: "#d97706",
      status: "not started",
      statusVariant: "slate",
    },
    {
      title: "Analytical Essay Outline",
      subject: "English Lit",
      type: "Outline draft",
      dueDate: "Due Friday",
      color: "#7c3aed",
      status: "due tomorrow",
      statusVariant: "red",
    },
  ],
};
