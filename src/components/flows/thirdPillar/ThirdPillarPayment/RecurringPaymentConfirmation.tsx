import React from 'react';
import { useHistory } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

export const RecurringPaymentConfirmation = () => {
  const history = useHistory();

  return (
    <div className="col-12 col-md-11 col-lg-8 mx-auto text-center py-5">
      <h1 className="mb-4">
        <FormattedMessage id="thirdPillarPayment.confirmation.title.recurring" />
      </h1>
      <div className="d-flex gap-2 justify-content-center">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => history.replace('/3rd-pillar-recurring-success')}
        >
          <FormattedMessage id="thirdPillarPayment.confirmation.yes" />
        </button>
        <button type="button" className="btn btn-outline-primary" onClick={() => history.goBack()}>
          <FormattedMessage id="thirdPillarPayment.confirmation.showDetails" />
        </button>
      </div>
    </div>
  );
};
