import { FormattedMessage } from 'react-intl';
import AccountStatement from './AccountStatement';
import { SectionHeading } from './SectionHeading';
import { TransactionSection } from './TransactionSection/TransactionSection';
import { useMe, useSavingsFundBalanceOrFail, useSourceFunds } from '../common/apiHooks';
import { usePageTitle } from '../common/usePageTitle';
import { PII_CLASS } from '../tracking/piiMarkup';
import { TranslationKey } from '../translations';
import { useMyGifts } from '../flows/savingsAccount/GiftLink/api/giftLink.api';
import { GiftList } from '../flows/savingsAccount/GiftLink/ReceivedGifts';

const failedWithoutData = (query: { isError: boolean; data: unknown }) =>
  query.isError && query.data === undefined;

const unavailableMessage = (
  savingsFundFailed: boolean,
  thirdPillarFailed: boolean,
): TranslationKey => {
  if (savingsFundFailed && thirdPillarFailed) {
    return 'account.minor.portfolio.unavailable';
  }
  return savingsFundFailed
    ? 'account.minor.portfolio.unavailable.savingsFund'
    : 'account.minor.portfolio.unavailable.thirdPillar';
};

export function MinorAccountPage() {
  usePageTitle('pageTitle.accountPage');
  const { data: user } = useMe();
  const savingsFundBalance = useSavingsFundBalanceOrFail();
  const sourceFunds = useSourceFunds();
  const { data: gifts = [] } = useMyGifts();

  const savingsFundFailed = failedWithoutData(savingsFundBalance);
  const thirdPillarFailed = failedWithoutData(sourceFunds);
  const thirdPillarFunds = (sourceFunds.data ?? []).filter((fund) => fund.pillar === 3);
  const savingsFunds = savingsFundBalance.data ? [savingsFundBalance.data] : undefined;
  const showsSavingsFund = savingsFundBalance.isLoading || !!savingsFundBalance.data;
  const hasNoSavingsFund = savingsFundBalance.isSuccess && !savingsFundBalance.data;
  const hasNoAccountYet =
    hasNoSavingsFund && sourceFunds.isSuccess && thirdPillarFunds.length === 0;

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

      {hasNoAccountYet ? (
        <div className="card p-4">
          <h2 className="h3 mb-2">
            <FormattedMessage id="account.minor.empty.title" />
          </h2>
          <p className="m-0">
            <FormattedMessage id="account.minor.empty.body" />
          </p>
        </div>
      ) : (
        <>
          <h2 className="mt-5 mb-4">
            <FormattedMessage id="account.minor.portfolio.heading" />
          </h2>

          {(savingsFundFailed || thirdPillarFailed) && (
            <div
              role="alert"
              className="alert alert-danger d-flex flex-wrap gap-3 align-items-center justify-content-between"
            >
              <span>
                <FormattedMessage id={unavailableMessage(savingsFundFailed, thirdPillarFailed)} />
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => {
                  if (savingsFundFailed) {
                    savingsFundBalance.refetch();
                  }
                  if (thirdPillarFailed) {
                    sourceFunds.refetch();
                  }
                }}
              >
                <FormattedMessage id="myMoney.retry" />
              </button>
            </div>
          )}

          {showsSavingsFund && (
            <>
              <SectionHeading titleId="accountStatement.savingsFund.heading" />
              <AccountStatement funds={savingsFunds} showProfit />
            </>
          )}

          {thirdPillarFunds.length > 0 && (
            <>
              <SectionHeading titleId="accountStatement.thirdPillar.heading" />
              <AccountStatement funds={thirdPillarFunds} showProfit />
            </>
          )}

          {gifts.length > 0 && (
            <>
              <SectionHeading titleId="account.minor.gifts.title" />
              <GiftList gifts={gifts} />
            </>
          )}

          {!hasNoSavingsFund && (
            <TransactionSection
              limit={3}
              pillar={null}
              allTransactionsPath="/savings-fund-transactions"
              emptyMessageId="account.minor.transactions.none"
            />
          )}
        </>
      )}
    </>
  );
}
