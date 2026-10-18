import { FormattedMessage } from 'react-intl';
import { useHistory, useLocation } from 'react-router-dom';
import { captureException } from '@sentry/browser';
import { createTrackedEvent } from '../../common/api';
import { usePageTitle } from '../../common/usePageTitle';
import { flowPath, successPath } from './insuranceTransferPaths';

export const InsuranceTransferSent = () => {
  usePageTitle('pageTitle.thirdPillarInsurance');
  const history = useHistory();
  const { search, state } = useLocation();

  const recordSent = () => {
    createTrackedEvent('CLICK', {
      target: 'insurance-transfer-sent',
      insurer: new URLSearchParams(search).get('insurer'),
    }).catch(captureException);
    history.push(successPath);
  };

  const showSteps = () => history.replace({ pathname: `${flowPath}/request`, search, state });

  return (
    <div className="col-12 col-md-11 col-lg-8 mx-auto text-center py-5">
      <h1 className="mb-4 text-balance">
        <FormattedMessage id="insuranceTransfer.sentQuestion.title" />
      </h1>
      <div className="d-flex flex-column flex-sm-row-reverse justify-content-center gap-2">
        <button type="button" className="btn btn-primary" onClick={recordSent}>
          <FormattedMessage id="insuranceTransfer.sentQuestion.yes" />
        </button>
        <button type="button" className="btn btn-outline-primary" onClick={showSteps}>
          <FormattedMessage id="insuranceTransfer.sentQuestion.showSteps" />
        </button>
      </div>
    </div>
  );
};
