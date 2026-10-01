const AUTOMATIC_RENEWALS_PER_PAGE_VIEW = 5;

export type AutomaticRenewalAllowance = { take: () => boolean };

export const automaticRenewalAllowance = (): AutomaticRenewalAllowance => {
  let renewalsLeft = AUTOMATIC_RENEWALS_PER_PAGE_VIEW;
  return {
    take: () => {
      if (renewalsLeft === 0) {
        return false;
      }
      renewalsLeft -= 1;
      return true;
    },
  };
};
