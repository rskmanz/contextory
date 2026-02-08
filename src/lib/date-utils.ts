// Shared date utilities for Gantt and timeline views

export const DAY_WIDTH = 40;
export const ROW_HEIGHT = 40;

/** Format date as YYYY-MM-DD */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/** Parse YYYY-MM-DD string to Date */
export const parseDate = (dateStr: string): Date => {
  return new Date(dateStr + 'T00:00:00');
};

/** Get number of days between two dates */
export const getDaysBetween = (start: Date, end: Date): number => {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

/** Add days to a date, returning new Date */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
