import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { StatusAlert } from '../../../common/statusAlert';
import { usePageTitle } from '../../../common/usePageTitle';

export const SavingsFundWithdrawSuccess: FC = () => {
  usePageTitle('savingsFund.withdraw.pageTitle');

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-5">
      <StatusAlert
        title={<FormattedMessage id="savingsFund.withdraw.success.title" />}
        actions={
          <a href="/account" className="btn btn-outline-primary">
            <FormattedMessage id="common.myAccount" />
          </a>
        }
      >
        <p>
          <FormattedMessage id="savingsFund.withdraw.success.description" />
        </p>
      </StatusAlert>
    </div>
  );
};
