import { FC } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import {
  usePendingApplications,
  useSavingsFundPaymentCancellation,
} from '../../../common/apiHooks';
import { Application, SavingsFundPaymentApplication } from '../../../common/apiModels';
import { Card } from '../../../common/card/Card';
import { Euro } from '../../../common/Euro';
import { formatDateTime } from '../../../common/dateFormatter';
import { StatusAlert } from '../../../common/statusAlert';
import { usePageTitle } from '../../../common/usePageTitle';

const isSavingsFundPaymentApplication = (
  application: Application,
): application is SavingsFundPaymentApplication => application.type === 'SAVING_FUND_PAYMENT';

const SavingsFundPaymentCancellation: FC = () => {
  usePageTitle('savingsFund.paymentCancellation.pageTitle');
  const { paymentId } = useParams<{ paymentId: string }>();
  const { data: applications } = usePendingApplications();
  const {
    mutate: cancelPayment,
    isPending: cancelling,
    isSuccess: cancellationSuccess,
    isError: cancellationError,
  } = useSavingsFundPaymentCancellation();

  if (!applications) {
    return null;
  }

  const application = applications
    .filter(isSavingsFundPaymentApplication)
    .find((app) => app.details.paymentId === paymentId);

  if (!application) {
    return null;
  }

  const renderCancellationConfirmation = () => (
    <>
      <h1 className="m-0 text-center">
        <FormattedMessage id="savingsFund.paymentCancellation.title" />
      </h1>

      <Card
        title={
          <FormattedMessage
            id="applications.type.savingFundPayment.title"
            values={{ amountWithCurrency: <Euro amount={application.details.amount} /> }}
          />
        }
        description={
          <FormattedMessage
            id="applications.type.savingFundPayment.cancellationNotice"
            values={{
              cancellationDeadline: (
                <strong>{formatDateTime(application.details.cancellationDeadline)}</strong>
              ),
            }}
          />
        }
      />

      <div className="border-top d-flex justify-content-between align-items-center ">
        <Link to="/account" className="btn btn-outline-primary btn-lg mt-4">
          <FormattedMessage id="common.back" />
        </Link>
        <button
          type="button"
          className="btn btn-primary btn-lg mt-4"
          disabled={cancelling}
          onClick={() => cancelPayment({ paymentId })}
        >
          <FormattedMessage id="common.cancel" />
        </button>
      </div>

      {cancellationError && !cancelling ? (
        <div className="alert alert-danger" role="alert">
          <FormattedMessage id="savingsFund.paymentCancellation.error" />
        </div>
      ) : null}
    </>
  );

  const renderCancellationSuccess = () => (
    <StatusAlert
      title={<FormattedMessage id="savingsFund.paymentCancellation.success.title" />}
      actions={
        <a href="/account" className="btn btn-outline-primary">
          <FormattedMessage id="common.myAccount" />
        </a>
      }
    >
      <p>
        <FormattedMessage id="savingsFund.paymentCancellation.success.description" />
      </p>
    </StatusAlert>
  );

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-5">
      {cancellationSuccess ? renderCancellationSuccess() : renderCancellationConfirmation()}
    </div>
  );
};

export default SavingsFundPaymentCancellation;
