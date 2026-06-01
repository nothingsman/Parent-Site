import React from 'react';
import { useAttendance } from '@/hooks';
import { Child } from '@/types';
import { AttendanceView } from './AttendanceView';

export interface AttendanceModuleProps {
  child: Child;
  dict?: any;
}

export const AttendanceModule = ({ child }: AttendanceModuleProps) => {
  const attendanceQuery = useAttendance(child.id);
  const student = {
    id: child.id,
    name: child.name,
    grade: child.grade,
    section: child.section,
  };
  return (
    <AttendanceView
      student={student}
      attendance={attendanceQuery.data}
      isLoading={attendanceQuery.isLoading}
      isError={attendanceQuery.isError}
      errorMessage={attendanceQuery.error?.message}
    />
  );
};
