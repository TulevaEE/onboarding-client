import React from 'react';
import { SuccessNotice } from '../common/SuccessNotice/SuccessNotice';

export const SecondPillarPaymentRateSuccess = () => (
  <div className="row mt-5">
    <div className="col-12 px-0">
      <SuccessNotice>
        <h2 className="text-center mt-3">Muudatus tehtud</h2>
        <p className="mt-5">Alates 1. jaanuar 2025 panustad II sambasse x% brutopalgast.</p>
        <a className="btn btn-primary mt-4 profile-link" href="/account">
          Minu konto
        </a>
      </SuccessNotice>
    </div>
  </div>
);
