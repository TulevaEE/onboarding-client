import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import AccountStatement from './AccountStatement';
import { SectionHeading } from './SectionHeading';
import { TransactionSection } from './TransactionSection/TransactionSection';
import { ApplicationSection } from './ApplicationSection/ApplicationSection';
import { useMe, useSavingsFundBalance } from '../common/apiHooks';

export function LegalEntityAccountPage() {
  const { data: user } = useMe();
  const { data: savingsFundBalance } = useSavingsFundBalance();

  return (
    <section aria-label="legal-entity-account">
      {user && (
        <p className="my-5 m-0 lead">
          <FormattedMessage id="account.greeting" />, {user.role.name}
        </p>
      )}

      <SectionHeading titleId="accountStatement.savingsFund.heading">
        <div className="d-flex flex-wrap column-gap-3 row-gap-2 align-items-baseline justify-content-between">
          <Link to="/savings-fund/payment">
            <FormattedMessage id="accountStatement.savingsFund.deposit" />
          </Link>
          <Link to="/savings-fund/withdraw">
            <FormattedMessage id="accountStatement.savingsFund.withdraw" />
          </Link>
        </div>
      </SectionHeading>
      <AccountStatement funds={savingsFundBalance ? [savingsFundBalance] : []} />

      <ApplicationSection />

      <TransactionSection limit={3} allTransactionsPath="/savings-fund-transactions" />
    </section>
  );
}
