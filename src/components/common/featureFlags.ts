export const isSavingsFundWithdrawalEnabled = (): boolean => {
  const enableDate = new Date('2026-02-01T00:00:00');
  return new Date() >= enableDate;
};
