export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const getDaysBetween = (startDate, endDate) => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const formatDate = (date) => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const getWeeksBetween = (startDate, endDate) => {
  return Math.ceil(getDaysBetween(startDate, endDate) / 7);
};

export const getMonthsBetween = (startDate, endDate) => {
  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
  return months - startDate.getMonth() + endDate.getMonth() + 1;
};

export function generateDateRange(start, end, mode) {
  const range = [];
  const current = new Date(start);

  if (mode === 'day') {
    while (current <= end) {
      range.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  } else if (mode === 'week') {
    // Start from the Monday of the first week
    const firstMonday = new Date(current);
    firstMonday.setDate(firstMonday.getDate() - firstMonday.getDay() + 1);
    let weekStart = new Date(firstMonday);
    while (weekStart <= end) {
      range.push(new Date(weekStart));
      weekStart.setDate(weekStart.getDate() + 7);
    }
  } else if (mode === 'month') {
    const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
    while (monthStart <= end) {
      range.push(new Date(monthStart));
      monthStart.setMonth(monthStart.getMonth() + 1);
    }
  }
  return range;
}
