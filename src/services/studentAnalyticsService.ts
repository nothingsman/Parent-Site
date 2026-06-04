import { apiClient } from '@/lib/apiClient';
import type {
  ApiResponse,
  StudentAnalyticsResponse,
  StudentAnalyticsHeatmapCell,
  StudentAnalyticsSubjectPerformance,
  StudentAnalyticsTrendSeries,
} from '@/types/api';

interface StudentAnalyticsApiSummary {
  overall_grade: number;
  attendance_rate: number;
  assignment_completion_rate: number;
  completed_assignments: number;
  pending_assignments: number;
  missing_assignments: number;
  class_average_overall: number | null;
  class_rank: number | null;
  class_size: number | null;
  risk_band: 'low' | 'medium' | 'high' | 'unknown';
  trend_direction: 'up' | 'down' | 'steady';
  trend_delta: number;
  headline_insight: string | null;
}

interface StudentAnalyticsApiSubjectPerformance {
  subject: string;
  student_score: number;
  class_average: number;
  target_score: number | null;
  teacher_name: string | null;
  color: string | null;
}

interface StudentAnalyticsApiTrendPoint {
  label: string;
  score: number;
  recorded_at: string | null;
}

interface StudentAnalyticsApiTrendSeries {
  subject: string;
  color: string | null;
  points: StudentAnalyticsApiTrendPoint[];
}

interface StudentAnalyticsApiHeatmapCell {
  date: string;
  week: number;
  weekday: number;
  day_label: string;
  submission_count: number;
}

interface StudentAnalyticsApiResponse {
  student_id: string;
  generated_at: string;
  analysis_window_label: string;
  summary: StudentAnalyticsApiSummary;
  subject_performance: StudentAnalyticsApiSubjectPerformance[];
  grade_trend: {
    series: StudentAnalyticsApiTrendSeries[];
  };
  submission_heatmap: StudentAnalyticsApiHeatmapCell[];
  recommended_actions: string[];
}

function mapSubjectPerformance(
  item: StudentAnalyticsApiSubjectPerformance,
): StudentAnalyticsSubjectPerformance {
  return {
    subject: item.subject,
    studentScore: item.student_score,
    classAverage: item.class_average,
    targetScore: item.target_score,
    teacherName: item.teacher_name,
    color: item.color,
  };
}

function mapTrendSeries(item: StudentAnalyticsApiTrendSeries): StudentAnalyticsTrendSeries {
  return {
    subject: item.subject,
    color: item.color,
    points: item.points.map((point) => ({
      label: point.label,
      score: point.score,
      recordedAt: point.recorded_at,
    })),
  };
}

function mapHeatmapCell(item: StudentAnalyticsApiHeatmapCell): StudentAnalyticsHeatmapCell {
  return {
    date: item.date,
    week: item.week,
    weekday: item.weekday,
    dayLabel: item.day_label,
    submissionCount: item.submission_count,
  };
}

export async function getStudentAnalytics(
  childId: string,
): Promise<StudentAnalyticsResponse> {
  const res = await apiClient.get<ApiResponse<StudentAnalyticsApiResponse>>(
    `/api/v1/student-analytics/${childId}/`,
  );
  const data = res.data.data;

  return {
    studentId: data.student_id,
    generatedAt: data.generated_at,
    analysisWindowLabel: data.analysis_window_label,
    summary: {
      overallGrade: data.summary.overall_grade,
      attendanceRate: data.summary.attendance_rate,
      assignmentCompletionRate: data.summary.assignment_completion_rate,
      completedAssignments: data.summary.completed_assignments,
      pendingAssignments: data.summary.pending_assignments,
      missingAssignments: data.summary.missing_assignments,
      classAverageOverall: data.summary.class_average_overall,
      classRank: data.summary.class_rank,
      classSize: data.summary.class_size,
      riskBand: data.summary.risk_band,
      trendDirection: data.summary.trend_direction,
      trendDelta: data.summary.trend_delta,
      headlineInsight: data.summary.headline_insight,
    },
    subjectPerformance: data.subject_performance.map(mapSubjectPerformance),
    gradeTrend: {
      series: data.grade_trend.series.map(mapTrendSeries),
    },
    submissionHeatmap: data.submission_heatmap.map(mapHeatmapCell),
    recommendedActions: data.recommended_actions,
  };
}
