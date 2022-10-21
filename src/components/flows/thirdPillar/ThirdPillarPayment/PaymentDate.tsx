export function today(): string {
  return new Date().toLocaleDateString('et-EE');
}

export function tenthDayOfMonth(): string {
  const thisDay = new Date();
  let month = thisDay.getMonth();
  if (thisDay.getDate() > 10) {
    month += 1;
  }
  return new Date(thisDay.getFullYear(), month, 10).toLocaleDateString('et-EE');
}
