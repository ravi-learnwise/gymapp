export function monthToDateRange(refDate = new Date()) {
  const start = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
  const end = new Date(refDate);
  return {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10),
  };
}
