import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { useMe } from '../common/apiHooks';
import { usePageTitle } from '../common/usePageTitle';
import { Shimmer } from '../common/shimmer/Shimmer';
import { LabelledCopyButton } from '../common/CopyButton';
import { PII_CLASS } from '../tracking/piiMarkup';

const PensionAccountNumber = ({ pensionAccountNumber }: { pensionAccountNumber: string }) => (
  <>
    <div className="card p-4 d-flex flex-row flex-wrap align-items-center justify-content-between gap-3">
      <span className={`fs-2 fw-semibold user-select-all ${PII_CLASS}`}>
        {pensionAccountNumber}
      </span>
      <LabelledCopyButton
        textToCopy={pensionAccountNumber}
        className="btn btn-primary d-inline-flex align-items-center gap-2"
      />
    </div>
    <p className="mt-3 text-body-secondary">
      <FormattedMessage id="pensionAccountNumber.otherNames" />
    </p>

    <h2 id="pension-account-number-occasions" className="h5 mt-5">
      <FormattedMessage id="pensionAccountNumber.whenNeeded" />
    </h2>
    <ul aria-labelledby="pension-account-number-occasions">
      <li>
        <FormattedMessage id="pensionAccountNumber.whenNeeded.insuranceContract" />
      </li>
      <li>
        <FormattedMessage id="pensionAccountNumber.whenNeeded.employer" />{' '}
        <Link to="/3rd-pillar-employer" className="text-nowrap">
          <FormattedMessage id="pensionAccountNumber.whenNeeded.employerLink" />
        </Link>
      </li>
      <li>
        <FormattedMessage id="pensionAccountNumber.whenNeeded.bankTransfer" />
      </li>
      <li>
        <FormattedMessage id="pensionAccountNumber.whenNeeded.mistakenContribution" />
      </li>
    </ul>
  </>
);

export const PensionAccountNumberPage = () => {
  usePageTitle('pageTitle.pensionAccountNumber');
  const { data: user } = useMe();

  if (!user) {
    return <Shimmer height={120} />;
  }

  return (
    <section className="col-sm-10 col-md-8 col-lg-6 mx-auto mt-5 text-pretty">
      <h1 className="mb-4">
        <FormattedMessage id="pensionAccountNumber.title" />
      </h1>
      {user.pensionAccountNumber ? (
        <PensionAccountNumber pensionAccountNumber={user.pensionAccountNumber} />
      ) : (
        <p>
          <FormattedMessage id="pensionAccountNumber.noAccountYet" />
        </p>
      )}
    </section>
  );
};
