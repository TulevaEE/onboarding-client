import { FC, ReactNode, useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { Notice } from './Notice';
import { AccountHolder, accountHolderFor } from '../../flows/savingsAccount/accountHolder';
import { TranslationKey } from '../../translations';
import { createTrackedEvent, createTrackedEventBeforeUnload } from '../api';
import { useMe, useNudge } from '../apiHooks';
import { NudgeContext, NudgeDecision, NudgeFeeComparison } from '../apiModels/nudge';
import styles from './Nudge.module.scss';

type NudgeProps = {
  context: NudgeContext;
  onRecurringPayment?: () => void;
};

export const Nudge: FC<NudgeProps> = ({ context, onRecurringPayment }) => {
  const { data: decision } = useNudge(context);

  if (!decision) {
    return null;
  }

  return (
    <NudgeView decision={decision} context={context} onRecurringPayment={onRecurringPayment} />
  );
};

export const NudgeView: FC<NudgeProps & { decision: NudgeDecision }> = ({
  decision,
  context,
  onRecurringPayment,
}) => {
  const { pathname } = useLocation();
  const { data: user } = useMe();
  const viewTracked = useRef(false);

  const trackedEventData = () => ({
    context,
    key: decision.key,
    tag: decision.tag,
    path: pathname,
    channel: 'SCREEN',
  });
  const track = (type: 'NUDGE_VIEW' | 'NUDGE_CLICK') =>
    (type === 'NUDGE_CLICK'
      ? createTrackedEventBeforeUnload(type, trackedEventData())
      : createTrackedEvent(type, trackedEventData())
    ).catch(() => {});

  useEffect(() => {
    if (decision.key === 'NONE' || viewTracked.current) {
      return;
    }
    viewTracked.current = true;
    track('NUDGE_VIEW');
  }, [decision.key, decision.tag, context, pathname]);

  const onCallToAction = () => track('NUDGE_CLICK');

  switch (decision.key) {
    case 'SECOND_PILLAR_TRANSFER':
      return decision.feeComparison ? (
        <FeeComparisonNudge
          feeComparison={decision.feeComparison}
          onCallToAction={onCallToAction}
        />
      ) : (
        <NudgeNotice
          header="thirdPillarSuccess.suggestion.lowFee.header"
          description="thirdPillarSuccess.suggestion.lowFee.description"
          button="thirdPillarSuccess.suggestion.lowFee.button"
          to="/2nd-pillar-flow"
          onCallToAction={onCallToAction}
        />
      );
    case 'SECOND_PILLAR_PAYMENT_RATE':
      return (
        <NudgeNotice
          header="thirdPillarSuccess.suggestion.paymentRate.header"
          description="thirdPillarSuccess.suggestion.paymentRate.description"
          button="thirdPillarSuccess.suggestion.paymentRate.button"
          to="/2nd-pillar-payment-rate"
          onCallToAction={onCallToAction}
        />
      );
    case 'MEMBERSHIP':
      return (
        <NudgeNotice
          header="thirdPillarSuccess.suggestion.membership.header"
          description="thirdPillarSuccess.suggestion.membership.description"
          button="thirdPillarSuccess.suggestion.membership.button"
          to="/join"
          onCallToAction={onCallToAction}
        />
      );
    case 'THIRD_PILLAR_RECURRING':
      return (
        <NudgeNotice
          header="thirdPillarSuccess.suggestion.recurring.header"
          description="thirdPillarSuccess.suggestion.recurring.description"
          button="thirdPillarSuccess.suggestion.recurring.button"
          to="/3rd-pillar-payment"
          onAction={onRecurringPayment}
          onCallToAction={onCallToAction}
        />
      );
    case 'THIRD_PILLAR_START':
      return (
        <NudgeNotice
          header="nudge.THIRD_PILLAR_START.header"
          description="nudge.THIRD_PILLAR_START.description"
          button="nudge.THIRD_PILLAR_START.button"
          to="/3rd-pillar-flow"
          onCallToAction={onCallToAction}
        />
      );
    case 'THIRD_PILLAR_FEES':
      return (
        <NudgeNotice
          header="nudge.THIRD_PILLAR_FEES.header"
          description="nudge.THIRD_PILLAR_FEES.description"
          button="nudge.THIRD_PILLAR_FEES.button"
          to="/3rd-pillar-flow"
          onCallToAction={onCallToAction}
        />
      );
    case 'THIRD_PILLAR_RAISE':
      return (
        <NudgeNotice
          header="nudge.THIRD_PILLAR_RAISE.header"
          description="nudge.THIRD_PILLAR_RAISE.description"
          button="nudge.THIRD_PILLAR_RAISE.button"
          to="/3rd-pillar-payment"
          onCallToAction={onCallToAction}
        />
      );
    case 'SAVINGS_FUND':
      return (
        <NudgeNotice
          header="nudge.SAVINGS_FUND.header"
          description="nudge.SAVINGS_FUND.description"
          descriptionValues={{ fee: decision.savingsFundFeePercent }}
          button="nudge.SAVINGS_FUND.button"
          to="/savings-fund/onboarding"
          onCallToAction={onCallToAction}
        />
      );
    case 'ACCOUNT_RECURRING':
      return (
        <RecurringPaymentNudge
          accountHolder={user ? accountHolderFor(user) : 'self'}
          onCallToAction={onCallToAction}
        />
      );
    case 'SAVINGS_FUND_RECURRING':
      return <RecurringPaymentNudge accountHolder="self" onCallToAction={onCallToAction} />;
    case 'NONE':
    default:
      return null;
  }
};

const RECURRING_DESCRIPTIONS: Record<AccountHolder, TranslationKey> = {
  self: 'savingsFund.payment.success.recurringNudge.description',
  child: 'savingsFund.payment.success.recurringNudge.description.child',
  company: 'savingsFund.payment.success.recurringNudge.description.company',
};

const RecurringPaymentNudge = ({
  accountHolder,
  onCallToAction,
}: {
  accountHolder: AccountHolder;
  onCallToAction: () => void;
}) => (
  <NudgeNotice
    header="savingsFund.payment.success.recurringNudge.header"
    description={RECURRING_DESCRIPTIONS[accountHolder]}
    button="savingsFund.payment.success.recurringNudge.button"
    to="/savings-fund/payment?type=RECURRING"
    onCallToAction={onCallToAction}
  />
);

const NudgeNotice = ({
  header,
  description,
  descriptionValues,
  button,
  to,
  onAction,
  onCallToAction,
  children,
}: {
  header: TranslationKey;
  description: TranslationKey;
  descriptionValues?: Record<string, number>;
  button: TranslationKey;
  to: string;
  onAction?: () => void;
  onCallToAction: () => void;
  children?: ReactNode;
}) => (
  <Notice>
    <h2 className="text-center mt-3">
      <FormattedMessage id={header} />
    </h2>
    {children}
    <p className="mt-5">
      <FormattedMessage id={description} values={descriptionValues} />
    </p>
    {onAction ? (
      <button
        type="button"
        className="btn btn-primary mt-4"
        onClick={() => {
          onCallToAction();
          onAction();
        }}
      >
        <FormattedMessage id={button} />
      </button>
    ) : (
      <a className="btn btn-primary mt-4 profile-link" href={to} onClick={onCallToAction}>
        <FormattedMessage id={button} />
      </a>
    )}
  </Notice>
);

const FeeComparisonNudge = ({
  feeComparison,
  onCallToAction,
}: {
  feeComparison: NudgeFeeComparison;
  onCallToAction: () => void;
}) => {
  const { currentFeePercent, currentFeeAmount, tulevaFeeAmount, savingsAmount } = feeComparison;
  const maximumFundColumnHeight = 150;
  const maxAmount = Math.max(tulevaFeeAmount, currentFeeAmount);
  const ourFundHeight = (tulevaFeeAmount / maxAmount) * maximumFundColumnHeight;
  const currentFundsHeight = (currentFeeAmount / maxAmount) * maximumFundColumnHeight;

  return (
    <NudgeNotice
      header="thirdPillarSuccess.notice.header"
      description="thirdPillarSuccess.notice.description"
      descriptionValues={{
        currentFundsFee: currentFeePercent,
        currentFundsFeeAmount: currentFeeAmount,
        ourFundFeeAmount: tulevaFeeAmount,
        savingsAmount,
      }}
      button="thirdPillarSuccess.button"
      to="/2nd-pillar-flow"
      onCallToAction={onCallToAction}
    >
      <div>
        <div className="row d-flex justify-content-center align-items-end mt-5">
          <div className="col-md-2 col-5">
            <div className={styles.leftcolumn} style={{ height: ourFundHeight }}>
              <div className={styles.columncontent}>{tulevaFeeAmount}&nbsp;€</div>
            </div>
          </div>
          <div className="col-md-2 col-1" />
          <div className="col-md-2 col-5">
            <div className={styles.rightcolumn} style={{ height: currentFundsHeight }}>
              <div className={styles.columncontent}>{currentFeeAmount}&nbsp;€</div>
            </div>
          </div>
        </div>
        <div className="row d-flex justify-content-center align-items-start my-3">
          <div className="col-md-3 col-5">
            <small className="text-body-secondary">
              <FormattedMessage id="thirdPillarSuccess.ourFund" />
            </small>
          </div>
          <div className="col-md-1 col-1" />
          <div className="col-md-3 col-5">
            <small className="text-body-secondary">
              <FormattedMessage id="thirdPillarSuccess.currentFund" />
            </small>
          </div>
        </div>
      </div>
    </NudgeNotice>
  );
};
