import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Minus,
  BookOpen,
  Calendar,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import { Card, ErrorMessage, SectionLabel } from '@/components/ui';
import { useStudentAnalytics } from '@/hooks';
import { useTranslation } from '@/lib/i18n';
import { getGradeColorClass, getGradeLetter } from '@/lib/gradeUtils';
import { Child } from '@/types';
import type { StudentAnalyticsHeatmapCell } from '@/types/api';

export interface AnalyticsModuleProps {
  child: Child;
}

type TrendChartRow = {
  milestone: string;
  recordedAt: string | null;
} & Record<string, number | string | null>;

function getRiskBandClasses(riskBand: string): string {
  switch (riskBand) {
    case 'high':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    case 'medium':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'low':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600';
  }
}

function getRiskBandLabel(riskBand: string): string {
  switch (riskBand) {
    case 'high':
      return 'High Risk';
    case 'medium':
      return 'Watch';
    case 'low':
      return 'On Track';
    default:
      return 'Unknown';
  }
}

function getTrendMeta(direction: string, delta: number) {
  if (direction === 'up') {
    return {
      icon: TrendingUp,
      accent: 'text-emerald-600',
      value: `+${delta.toFixed(1)}%`,
      label: 'Improving',
    };
  }

  if (direction === 'down') {
    return {
      icon: TrendingDown,
      accent: 'text-rose-600',
      value: `${delta.toFixed(1)}%`,
      label: 'Declining',
    };
  }

  return {
    icon: Minus,
    accent: 'text-slate-600',
    value: `${delta.toFixed(1)}%`,
    label: 'Steady',
  };
}

function getHeatmapCellClasses(count: number, maxCount: number): string {
  if (count <= 0) {
    return 'bg-slate-50 border border-slate-100';
  }

  const ratio = maxCount <= 0 ? 0 : count / maxCount;
  if (ratio < 0.34) {
    return 'bg-indigo-100 border border-indigo-200/60';
  }
  if (ratio < 0.67) {
    return 'bg-indigo-300 border border-indigo-300/60';
  }
  return 'bg-[#3949ab] border border-[#3949ab]/70 text-white';
}

function formatGeneratedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function buildTrendData(
  series: Array<{
    subject: string;
    points: Array<{ label: string; score: number; recordedAt: string | null }>;
  }>,
): TrendChartRow[] {
  const rowsByLabel = new Map<string, TrendChartRow>();

  for (const subjectSeries of series) {
    for (const point of subjectSeries.points) {
      const existing = rowsByLabel.get(point.label) ?? {
        milestone: point.label,
        recordedAt: point.recordedAt,
      };
      existing[subjectSeries.subject] = point.score;
      rowsByLabel.set(point.label, existing);
    }
  }

  return Array.from(rowsByLabel.values());
}

function groupHeatmapByWeek(cells: StudentAnalyticsHeatmapCell[]): StudentAnalyticsHeatmapCell[][] {
  const grouped = new Map<number, StudentAnalyticsHeatmapCell[]>();

  for (const cell of cells) {
    const week = grouped.get(cell.week) ?? [];
    week.push(cell);
    grouped.set(cell.week, week);
  }

  return Array.from(grouped.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([, weekCells]) => weekCells.sort((left, right) => left.weekday - right.weekday));
}

export const AnalyticsModule = ({ child }: AnalyticsModuleProps) => {
  const { t } = useTranslation();
  const [hoveredHeatmapDay, setHoveredHeatmapDay] = useState<StudentAnalyticsHeatmapCell | null>(null);
  const {
    data,
    isLoading,
    isError,
    error,
  } = useStudentAnalytics(child.id);

  const trendData = useMemo(
    () => buildTrendData(data?.gradeTrend.series ?? []),
    [data?.gradeTrend.series],
  );
  const weeklyHeatmap = useMemo(
    () => groupHeatmapByWeek(data?.submissionHeatmap ?? []),
    [data?.submissionHeatmap],
  );
  const pieData = useMemo(() => {
    if (!data) return [];

    return [
      {
        name: t('analytics.gradedCompleted'),
        value: data.summary.completedAssignments,
        color: '#10b981',
      },
      {
        name: t('analytics.duePending'),
        value: data.summary.pendingAssignments,
        color: '#f59e0b',
      },
      {
        name: t('analytics.missingWork'),
        value: data.summary.missingAssignments,
        color: '#ef4444',
      },
    ].filter((item) => item.value > 0);
  }, [data, t]);
  const maxHeatmapCount = useMemo(
    () => Math.max(0, ...(data?.submissionHeatmap ?? []).map((cell) => cell.submissionCount)),
    [data?.submissionHeatmap],
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-1">
        <Card className="flex items-center gap-3 min-h-32">
          <div className="w-6 h-6 border-2 border-[#3949ab] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">{t('app.loading')}</p>
        </Card>
      </div>
    );
  }

  if (isError && error) {
    return (
      <div className="max-w-7xl mx-auto px-1">
        <ErrorMessage error={error} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-1">
        <Card>
          <p className="text-sm font-medium text-slate-500">
            Analytics data is not available for this student yet.
          </p>
        </Card>
      </div>
    );
  }

  const trendMeta = getTrendMeta(data.summary.trendDirection, data.summary.trendDelta);
  const TrendIcon = trendMeta.icon;
  const gradeClassName = getGradeColorClass(data.summary.overallGrade);
  const classPosition =
    data.summary.classRank && data.summary.classSize
      ? `${data.summary.classRank}/${data.summary.classSize}`
      : 'N/A';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6 max-w-7xl mx-auto px-1"
    >
      <div className="flex flex-col xl:flex-row gap-4 items-stretch">
        <div className="flex-1 bg-gradient-to-br from-[#3949ab]/5 via-white to-indigo-50/20 rounded-2xl border border-indigo-50 p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#3949ab] flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-blue-900/10">
              {child.initials}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black tracking-widest text-[#3949ab] bg-[#3949ab]/8 px-2 py-0.5 rounded-md uppercase">
                {t('analytics.parentInsights')}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-1">
                {t('analytics.academicAnalytics', { name: child.name })}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {t('app.grade')} {child.grade} • {t('app.sec')} {child.section}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {data.analysisWindowLabel} • Updated {formatGeneratedAt(data.generatedAt)}
              </p>
            </div>
          </div>

          {data.summary.headlineInsight && (
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
              <p className="text-sm font-medium text-slate-700">{data.summary.headlineInsight}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 xl:w-[28rem] gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
              {t('analytics.overallGrade')}
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                {data.summary.overallGrade.toFixed(1)}%
              </span>
              <span className={`text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded-md border ${gradeClassName}`}>
                {getGradeLetter(data.summary.overallGrade)}
              </span>
            </div>
            <p className="text-[9px] text-slate-400 mt-1">
              {data.summary.classAverageOverall !== null
                ? `Class average ${data.summary.classAverageOverall.toFixed(1)}%`
                : t('analytics.averageAllModules')}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
              {t('analytics.attendanceRate')}
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-[#3949ab] tracking-tight">
                {data.summary.attendanceRate.toFixed(1)}%
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md uppercase">
                {t('analytics.excellent')}
              </span>
            </div>
            <p className="text-[9px] text-slate-400 mt-1">{t('analytics.drivesInteraction')}</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
              {t('analytics.completed')}
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                {data.summary.assignmentCompletionRate.toFixed(1)}%
              </span>
            </div>
            <p className="text-[9px] text-slate-400 mt-1">
              {data.summary.completedAssignments} completed • {data.summary.pendingAssignments} pending
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
              Class Position
            </span>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                {classPosition}
              </span>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border uppercase ${getRiskBandClasses(data.summary.riskBand)}`}>
                {getRiskBandLabel(data.summary.riskBand)}
              </span>
            </div>
            <p className="text-[9px] text-slate-400 mt-1">
              Missing work {data.summary.missingAssignments}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
              <div>
                <SectionLabel>
                  <TrendingUp size={13} className="text-[#3949ab]" />
                  {t('analytics.performanceOverview')}
                </SectionLabel>
                <h4 className="text-xs text-slate-400 -mt-3.5">
                  {t('analytics.subjectComparison')}
                </h4>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2.5 h-2.5 bg-[#3949ab] rounded" /> {t('analytics.generalScore')}
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2.5 h-2.5 bg-slate-300 rounded" /> {t('analytics.classTarget')}
                </span>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.subjectPerformance}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="subject"
                    stroke="#94a3b8"
                    fontSize={10}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    fontWeight={600}
                    domain={[0, 100]}
                    tickCount={6}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  <Bar dataKey="studentScore" name={t('analytics.studentGrade')} radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {data.subjectPerformance.map((entry, index) => (
                      <Cell key={`${entry.subject}-${index}`} fill={entry.color ?? '#3949ab'} />
                    ))}
                  </Bar>
                  <Bar dataKey="classAverage" name={t('analytics.classTarget')} fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
              <div>
                <SectionLabel>
                  <BookOpen size={13} className="text-[#3949ab]" />
                  {t('analytics.progression')}
                </SectionLabel>
                <h4 className="text-xs text-slate-400 -mt-3.5">
                  {t('analytics.longitudinal')}
                </h4>
              </div>

              <div className={`flex items-center gap-2 text-xs font-bold ${trendMeta.accent}`}>
                <TrendIcon size={14} />
                <span>{trendMeta.label}</span>
                <span>{trendMeta.value}</span>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 15, right: 20, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="milestone"
                    stroke="#94a3b8"
                    fontSize={10}
                    fontWeight={600}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    fontWeight={600}
                    domain={[0, 100]}
                    tickCount={6}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  {data.gradeTrend.series.map((series) => (
                    <Line
                      key={series.subject}
                      type="monotone"
                      dataKey={series.subject}
                      stroke={series.color ?? '#3949ab'}
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: '#ffffff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      connectNulls
                    />
                  ))}
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginTop: '12px' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="flex flex-col justify-between">
            <div>
              <SectionLabel>
                <CheckCircle2 size={13} className="text-emerald-500" />
                {t('analytics.workStats')}
              </SectionLabel>
              <h4 className="text-xs text-slate-400 -mt-3.5">
                {t('analytics.summaryHomework')}
              </h4>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-4 mt-2">
              <div className="relative w-40 h-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                    {data.summary.assignmentCompletionRate.toFixed(1)}%
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#10b981] mt-1">
                    {t('analytics.completed')}
                  </span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-2">
                <div className="bg-slate-50/50 rounded-xl p-2.5 flex items-center justify-between border border-slate-100/50">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-slate-600">{t('analytics.gradedCompleted')}</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                    {data.summary.completedAssignments} {t('analytics.tasks')}
                  </span>
                </div>

                <div className="bg-slate-50/50 rounded-xl p-2.5 flex items-center justify-between border border-slate-100/50">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-semibold text-slate-600">{t('analytics.duePending')}</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md">
                    {data.summary.pendingAssignments} {t('analytics.due')}
                  </span>
                </div>

                <div className="bg-rose-50/30 rounded-xl p-2.5 flex items-center justify-between border border-rose-100/30">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-xs font-semibold text-rose-700">{t('analytics.missingActivity')}</span>
                  </div>
                  <span className="text-xs font-extrabold text-white bg-rose-500 px-2 py-0.5 rounded-md">
                    {data.summary.missingAssignments} {t('analytics.missing')}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-center text-slate-400 mt-4 leading-normal italic px-2">
              {t('analytics.completionNote')}
            </p>
          </Card>

        </div>
      </div>

      <div className="max-w-xl">
        <SectionLabel>
          <Calendar size={13} className="text-[#3949ab]" />
          {t('analytics.submissionFrequencyGrid')}
        </SectionLabel>

        <Card className="flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
              {t('analytics.fourWeekHeatmap')}
            </h4>
            <p className="text-[10px] text-slate-400 mb-4 font-medium">
              {t('analytics.submissionEvents')}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-7 gap-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => (
                <span key={`${label}-${index}`} className="text-[9px] font-black text-slate-400 text-center uppercase block">
                  {label}
                </span>
              ))}
            </div>

            <div className="space-y-1">
              {weeklyHeatmap.map((weekCells, index) => (
                <div key={`week-${index}`} className="grid grid-cols-7 gap-1">
                  {weekCells.map((cell) => (
                    <button
                      key={cell.date}
                      type="button"
                      onMouseEnter={() => setHoveredHeatmapDay(cell)}
                      onMouseLeave={() => setHoveredHeatmapDay(null)}
                      className={`h-9 rounded-md transition-colors ${getHeatmapCellClasses(cell.submissionCount, maxHeatmapCount)}`}
                      aria-label={`${cell.dayLabel} ${cell.date}: ${cell.submissionCount} submissions`}
                    >
                      <span className="text-[10px] font-bold">{new Date(cell.date).getDate()}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>{t('analytics.week1Old')}</span>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-medium uppercase">{t('analytics.less')}</span>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-slate-50 border border-slate-100" />
                <span className="w-3 h-3 rounded bg-indigo-100 border border-indigo-200/60" />
                <span className="w-3 h-3 rounded bg-indigo-300 border border-indigo-300/60" />
                <span className="w-3 h-3 rounded bg-[#3949ab] border border-[#3949ab]/70" />
              </div>
              <span className="text-[8px] font-medium uppercase">{t('analytics.more')}</span>
            </div>
            <span>{t('analytics.week4New')}</span>
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
            {hoveredHeatmapDay
              ? `${hoveredHeatmapDay.dayLabel} ${hoveredHeatmapDay.date}: ${hoveredHeatmapDay.submissionCount} submission(s)`
              : t('analytics.hoverForDetails')}
          </div>
        </Card>
      </div>
    </motion.div>
  );
};
