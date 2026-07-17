import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import AccountStatement from './AccountStatement';
import { SectionHeading } from './SectionHeading';
import { TransactionSection } from './TransactionSection/TransactionSection';
import { ApplicationSection } from './ApplicationSection/ApplicationSection';
import { useMe, useSavingsFundBalance, useSourceFunds } from '../common/apiHooks';

export function RepresentedPartyAccountPage() {
  const { data: user } = useMe();
  const { data: savingsFundBalance, isLoading: savingsFundBalanceLoading } =
    useSavingsFundBalance();

  // Only a represented person (e.g. a parent viewing a child) can have a third pillar;
  // a represented legal entity (company) never does, so skip the request for them.
  const isRepresentedPerson = user?.role.type === 'PERSON';
  const { data: sourceFunds } = useSourceFunds(undefined, undefined, {
    enabled: isRepresentedPerson,
  });
  const thirdPillarFunds = (sourceFunds ?? []).filter((fund) => fund.pillar === 3);
  const showThirdPillar = isRepresentedPerson && thirdPillarFunds.length > 0;

  // While the balance loads (e.g. right after a role switch), pass undefined so
  // AccountStatement shimmers instead of rendering an empty zero-balance table.
  const loadedSavingsFunds = savingsFundBalance ? [savingsFundBalance] : [];
  const savingsFunds = savingsFundBalanceLoading ? undefined : loadedSavingsFunds;

  return (
    <section aria-label="represented-party-account">
      {user && (
        <p className="my-5 m-0 lead">
          <FormattedMessage id="account.legalEntity.greeting" values={{ name: user.role.name }} />
        </p>
      )}

      {showThirdPillar && (
        <>
          <SectionHeading titleId="accountStatement.thirdPillar.heading" />
          <AccountStatement funds={thirdPillarFunds} />
        </>
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
      <AccountStatement funds={savingsFunds} showProfit />

      <ApplicationSection />

      <TransactionSection limit={3} allTransactionsPath="/savings-fund-transactions" />
    </section>
  );
}
