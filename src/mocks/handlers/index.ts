import { childrenHandlers } from './children';
import { assignmentsHandlers } from './assignments';
import { attendanceHandlers } from './attendance';
import { behaviourHandlers } from './behaviour';
import { calendarHandlers } from './calendar';
import { gradesHandlers } from './grades';
import { messagesHandlers } from './messages';
import { announcementsHandlers } from './announcements';
import { notificationsHandlers } from './notifications';
import { scheduleHandlers } from './schedule';

export const handlers = [
  ...childrenHandlers,
  ...assignmentsHandlers,
  ...attendanceHandlers,
  ...behaviourHandlers,
  ...calendarHandlers,
  ...gradesHandlers,
  ...messagesHandlers,
  ...announcementsHandlers,
  ...notificationsHandlers,
  ...scheduleHandlers,
];
