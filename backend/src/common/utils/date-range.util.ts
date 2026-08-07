export function monthToDateRange(refDate = new Date()) {
  const start = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(refDate);
  end.setHours(23, 59, 59, 999);
  return {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10),
  };
}

export function parseDateRange(dateFrom?: string, dateTo?: string) {
  const defaults = monthToDateRange();
  const fromStr = dateFrom ?? defaults.dateFrom;
  const toStr = dateTo ?? defaults.dateTo;

  const start = new Date(fromStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(toStr);
  end.setHours(23, 59, 59, 999);

  return { start, end, dateFrom: fromStr, dateTo: toStr };
}
