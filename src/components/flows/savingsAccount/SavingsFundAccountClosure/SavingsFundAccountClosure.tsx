import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, Redirect } from 'react-router-dom';
import { useCloseSavingsFundAccount, useSavingsFundAccountClosure } from '../../../common/apiHooks';
import { StatusAlert } from '../../../common/statusAlert';
import { usePageTitle } from '../../../common/usePageTitle';

export const SavingsFundAccountClosure: FC = () => {
  usePageTitle('savingsFund.accountClosure.pageTitle');
  const { data: accountClosure, isLoading } = useSavingsFundAccountClosure(true);
  const {
    mutate: closeAccount,
    isPending: closing,
    isSuccess: closed,
    isError: closingFailed,
  } = useCloseSavingsFundAccount();

  if (isLoading) {
    return null;
  }

  if (!closed && !accountClosure?.closable) {
    return <Redirect to="/account" />;
  }

  const renderConfirmation = () => (
    <>
      <h1 className="m-0 text-center text-balance">
        <FormattedMessage id="savingsFund.accountClosure.title" />
      </h1>

      <p className="m-0 text-pretty">
        <FormattedMessage id="savingsFund.accountClosure.description" />
      </p>

      <div className="border-top d-flex justify-content-between align-items-center">
        <Link to="/account" className="btn btn-outline-primary btn-lg mt-4">
          <FormattedMessage id="common.back" />
        </Link>
        <button
          type="button"
          className="btn btn-primary btn-lg mt-4"
          disabled={closing}
          onClick={() => closeAccount()}
        >
          <FormattedMessage id="savingsFund.status.closeAccount.label" />
        </button>
      </div>

      {closingFailed && !closing ? (
        <div className="alert alert-danger" role="alert">
          <FormattedMessage id="savingsFund.accountClosure.error" />
        </div>
      ) : null}
    </>
  );

  const renderSuccess = () => (
    <StatusAlert
      title={<FormattedMessage id="savingsFund.accountClosure.success.title" />}
      actions={
        <a href="/account" className="btn btn-outline-primary">
          <FormattedMessage id="common.myAccount" />
        </a>
      }
    >
      <FormattedMessage id="savingsFund.accountClosure.success.description" />
    </StatusAlert>
  );

  return (
    <div className="col-12 col-md-10 col-lg-7 mx-auto d-flex flex-column gap-5">
      {closed ? renderSuccess() : renderConfirmation()}
    </div>
  );
};
