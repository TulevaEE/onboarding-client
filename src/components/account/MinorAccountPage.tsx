import { FormattedMessage } from 'react-intl';
import AccountStatement from './AccountStatement';
import { SectionHeading } from './SectionHeading';
import { TransactionSection } from './TransactionSection/TransactionSection';
import { ActionHint, ActionHints } from './ActionHints/ActionHints';
import { useMe, useSavingsFundBalanceOrFail, useSourceFunds } from '../common/apiHooks';
import { usePageTitle } from '../common/usePageTitle';
import { PII_CLASS } from '../tracking/piiMarkup';

const failedWithoutData = (query: { isError: boolean; data: unknown }) =>
  query.isError && query.data === undefined;

const savingsFundHints: ActionHint[] = [
  { label: 'accountStatement.savingsFund.deposit', text: 'account.minor.depositHint' },
  { label: 'accountStatement.savingsFund.withdraw', text: 'account.minor.withdrawHint' },
];

export function MinorAccountPage() {
  usePageTitle('pageTitle.accountPage');
  const { data: user } = useMe();
  const savingsFundBalance = useSavingsFundBalanceOrFail();
  const sourceFunds = useSourceFunds();

  const portfolioQueriesThatFailed = [savingsFundBalance, sourceFunds].filter(failedWithoutData);
  const thirdPillarFunds = (sourceFunds.data ?? []).filter((fund) => fund.pillar === 3);
  const savingsFunds = savingsFundBalance.data ? [savingsFundBalance.data] : undefined;
  const showsSavingsFund = savingsFundBalance.isLoading || !!savingsFundBalance.data;

  return (
    <>
      <div className="my-5">
        <p className={`lead mb-3 ${PII_CLASS}`}>
          <FormattedMessage id="account.minor.greeting" values={{ name: user?.firstName }} />
        </p>
        <p className="mb-0 text-pretty">
          <FormattedMessage id="account.minor.intro" />
        </p>
      </div>

      <h2 className="mt-5 mb-4">
        <FormattedMessage id="account.minor.portfolio.heading" />
      </h2>

      {portfolioQueriesThatFailed.length > 0 && (
        <div
          role="alert"
          className="alert alert-danger d-flex flex-wrap gap-3 align-items-center justify-content-between"
        >
          <span>
            <FormattedMessage id="account.minor.portfolio.unavailable" />
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => portfolioQueriesThatFailed.forEach((query) => query.refetch())}
          >
            <FormattedMessage id="myMoney.retry" />
          </button>
        </div>
      )}

      {showsSavingsFund && (
        <>
          <SectionHeading titleId="accountStatement.savingsFund.heading">
            <ActionHints hints={savingsFundHints} />
          </SectionHeading>
          <AccountStatement funds={savingsFunds} showProfit />
        </>
      )}

      {thirdPillarFunds.length > 0 && (
        <>
          <SectionHeading titleId="accountStatement.thirdPillar.heading" />
          <AccountStatement funds={thirdPillarFunds} showProfit />
        </>
      )}

      <TransactionSection
        limit={3}
        pillar={null}
        allTransactionsPath="/savings-fund-transactions"
      />
    </>
  );
}
