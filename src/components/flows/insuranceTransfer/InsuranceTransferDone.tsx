import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { SuccessNotice2 } from '../common/SuccessNotice2/SuccessNotice2';
import { usePageTitle } from '../../common/usePageTitle';
import { ACCOUNT_PATH } from '../../paths';

export const InsuranceTransferDone = () => {
  usePageTitle('pageTitle.thirdPillarInsurance');
  return (
    <SuccessNotice2 className="text-pretty">
      <h2 className="my-3">
        <FormattedMessage id="insuranceTransfer.done.title" />
      </h2>
      <p>
        <FormattedMessage id="insuranceTransfer.done.message" />
      </p>
      <Link className="btn btn-outline-primary mt-3" to={ACCOUNT_PATH}>
        <FormattedMessage id="thirdPillarSuccess.button.account" />
      </Link>
    </SuccessNotice2>
  );
};
