import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, Redirect, useParams } from 'react-router-dom';
import { ApplicationCard } from '../../../account/ApplicationSection/ApplicationCards';
import {
  usePendingApplications,
  useSavingsFundWithdrawalCancellation,
} from '../../../common/apiHooks';
import { Application, SavingsFundWithdrawalApplication } from '../../../common/apiModels';
import { StatusAlert } from '../../../common/statusAlert';
import { usePageTitle } from '../../../common/usePageTitle';

const isSavingsFundWithdrawalApplication = (
  application: Application,
): application is SavingsFundWithdrawalApplication => application.type === 'SAVING_FUND_WITHDRAWAL';

export const SavingsFundWithdrawCancellation: FC = () => {
  usePageTitle('savingsFund.withdrawalCancellation.pageTitle');
  const { withdrawalId } = useParams<{ withdrawalId: string }>();
  const { data: applications, isLoading } = usePendingApplications();
  const {
    mutate: cancelWithdrawal,
    isPending: cancelling,
    isSuccess: cancellationSuccess,
    isError: cancellationError,
  } = useSavingsFundWithdrawalCancellation();

  if (isLoading) {
    return null;
  }

  const application = applications
    ?.filter(isSavingsFundWithdrawalApplication)
    .find((app) => app.details.id === withdrawalId);

  if (!application) {
    return <Redirect to="/account" />;
  }

  const renderCancellationConfirmation = () => (
    <>
      <h1 className="m-0 text-center">
        <FormattedMessage id="savingsFund.withdrawalCancellation.title" />
      </h1>

      <ApplicationCard application={application} />

      <div className="border-top d-flex justify-content-between align-items-center ">
        <Link to="/account" className="btn btn-outline-primary btn-lg mt-4">
          <FormattedMessage id="common.back" />
        </Link>
        <button
          type="button"
          className="btn btn-primary btn-lg mt-4"
          disabled={cancelling}
          onClick={() => cancelWithdrawal({ id: withdrawalId })}
        >
          <FormattedMessage id="common.cancel" />
        </button>
      </div>

      {cancellationError && !cancelling ? (
        <div className="alert alert-danger" role="alert">
          <FormattedMessage id="savingsFund.withdrawalCancellation.error" />
        </div>
      ) : null}
    </>
  );

  const renderCancellationSuccess = () => (
    <StatusAlert
      title={<FormattedMessage id="savingsFund.withdrawalCancellation.success.title" />}
      actions={
        <a href="/account" className="btn btn-outline-primary">
          <FormattedMessage id="common.myAccount" />
        </a>
      }
    >
      <FormattedMessage id="savingsFund.withdrawalCancellation.success.description" />
    </StatusAlert>
  );

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-5">
      {cancellationSuccess ? renderCancellationSuccess() : renderCancellationConfirmation()}
    </div>
  );
};
