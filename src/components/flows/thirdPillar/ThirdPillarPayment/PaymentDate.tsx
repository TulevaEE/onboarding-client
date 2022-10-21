export const today = () => {
  return new Date().toLocaleDateString('et-EE');
};

export const tenthDayOfMonth = () => {
  const thisDay = new Date();
  let month = thisDay.getMonth();
  if (thisDay.getDate() > 10) {
    month += 1;
  }
  return new Date(thisDay.getFullYear(), month, 10).toLocaleDateString('et-EE');
};
