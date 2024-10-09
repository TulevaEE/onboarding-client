import React from 'react';
import { useWithdrawalsEligibility } from '../../common/apiHooks';

export const WithdrawalsHeader = () => {
  const { data: eligibility } = useWithdrawalsEligibility();

  if (!eligibility) {
    return null;
  }

  return (
    <div className="pt-3 pb-5">
      <h1 className="mb-4 text-center font-weight-semibold">II ja III samba väljamaksed</h1>
      <div className="lead text-center">
        Oled <span className="font-weight-bold">{eligibility.age}-aastane</span> ja sul on õigus
        kogutud pensionivara <span className="font-weight-bold">soodustingimustel</span> kasutama
        hakata.
      </div>
    </div>
  );
};
