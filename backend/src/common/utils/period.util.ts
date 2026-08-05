export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export function periodRange(period: ReportPeriod, refDate = new Date()) {
  const end = new Date(refDate);
  end.setHours(23, 59, 59, 999);

  const start = new Date(refDate);
  start.setHours(0, 0, 0, 0);

  switch (period) {
    case 'daily':
      break;
    case 'weekly': {
      const day = start.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - diff);
      break;
    }
    case 'monthly':
      start.setDate(1);
      break;
    case 'yearly':
      start.setMonth(0, 1);
      break;
  }

  return { start, end };
}
