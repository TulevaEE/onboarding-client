import { FC, ReactNode, useEffect, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { Notice } from './Notice';
import { AccountHolder, accountHolderFor } from '../../flows/savingsAccount/accountHolder';
import { TranslationKey } from '../../translations';
import { useMe, useNudge, useSourceFunds } from '../apiHooks';
import { isTulevaIsin } from '../utils';
import { formatDateYear } from '../dateFormatter';
import { NudgeContext, NudgeDecision, NudgeFeeComparison } from '../apiModels/nudge';
import styles from './Nudge.module.scss';
import { NudgeEventType, trackNudgeEvent } from './tracking';

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
  const trackedView = useRef<string | null>(null);

  const trackedEventData = () => ({
    context,
    key: decision.key,
    tag: decision.tag,
    path: pathname,
    channel: 'SCREEN',
  });
  const track = (type: NudgeEventType) => trackNudgeEvent(type, trackedEventData());

  const viewIdentity = [context, decision.key, decision.tag, pathname].join('|');
  useEffect(() => {
    if (decision.key === 'NONE' || trackedView.current === viewIdentity) {
      return;
    }
    trackedView.current = viewIdentity;
    track('NUDGE_VIEW');
  }, [viewIdentity]);

  const onCallToAction = () => track('NUDGE_CLICK');

  switch (decision.key) {
    case 'SECOND_PILLAR_START':
      return (
        <NudgeNotice
          header="nudge.SECOND_PILLAR_START.header"
          description="nudge.SECOND_PILLAR_START.description"
          button="nudge.SECOND_PILLAR_START.button"
          to="/2nd-pillar-flow"
          onCallToAction={onCallToAction}
        />
      );
    case 'SECOND_PILLAR_REJOIN':
      return (
        <NudgeNotice
          header="nudge.SECOND_PILLAR_REJOIN.header"
          description="nudge.SECOND_PILLAR_REJOIN.description"
          descriptionValues={{
            ...REJOIN_EXAMPLE,
            total: REJOIN_EXAMPLE.fromNetSalary + REJOIN_EXAMPLE.taxWin,
            deadline: formatDateYear(decision.secondPillarRejoinDeadline),
          }}
          button="nudge.SECOND_PILLAR_REJOIN.button"
          to="/2nd-pillar-rejoin"
          onCallToAction={onCallToAction}
        >
          <ComparisonFigure
            alternatives
            left={{
              segments: [{ amount: REJOIN_EXAMPLE.fromNetSalary }],
              title: (
                <FormattedMessage
                  id="nudge.SECOND_PILLAR_REJOIN.perMonth"
                  values={{ amount: REJOIN_EXAMPLE.fromNetSalary }}
                />
              ),
              subtitle: <FormattedMessage id="nudge.SECOND_PILLAR_REJOIN.toBankAccount" />,
            }}
            right={{
              segments: [
                { amount: REJOIN_EXAMPLE.fromNetSalary },
                {
                  amount: REJOIN_EXAMPLE.taxWin,
                  tone: 'gain',
                  label: (
                    <FormattedMessage
                      id="nudge.SECOND_PILLAR_REJOIN.taxWin"
                      values={{ amount: REJOIN_EXAMPLE.taxWin }}
                    />
                  ),
                },
              ],
              title: (
                <FormattedMessage
                  id="nudge.SECOND_PILLAR_REJOIN.perMonth"
                  values={{ amount: REJOIN_EXAMPLE.fromNetSalary + REJOIN_EXAMPLE.taxWin }}
                />
              ),
              subtitle: <FormattedMessage id="nudge.SECOND_PILLAR_REJOIN.toSecondPillarAccount" />,
            }}
            caption={
              <FormattedMessage
                id="nudge.SECOND_PILLAR_REJOIN.caption"
                values={{ grossSalary: REJOIN_EXAMPLE.grossSalary }}
              />
            }
          />
        </NudgeNotice>
      );
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
    case 'SAVINGS_FUND_RECURRING':
      return (
        <RecurringPaymentNudge
          accountHolder={user ? accountHolderFor(user) : 'self'}
          onCallToAction={onCallToAction}
        />
      );
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
  descriptionValues?: Record<string, number | string>;
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

type Segment = { amount: number; tone?: 'gain' | 'positive' | 'negative'; label?: ReactNode };
type ComparisonBar = { segments: Segment[]; title: ReactNode; subtitle: ReactNode };

const MAXIMUM_BAR_HEIGHT = 150;
const MINIMUM_BAR_HEIGHT = 6;
const MINIMUM_LABELLED_SEGMENT_HEIGHT = 40;

const ComparisonFigure = ({
  left,
  right,
  alternatives = false,
  costs = false,
  caption,
}: {
  left: ComparisonBar;
  right: ComparisonBar;
  alternatives?: boolean;
  costs?: boolean;
  caption?: ReactNode;
}) => {
  const totalOf = (bar: ComparisonBar) =>
    bar.segments.reduce((sum, segment) => sum + segment.amount, 0);
  const largest = Math.max(totalOf(left), totalOf(right), 1);
  const heightOf = (segment: Segment) =>
    Math.max(MINIMUM_BAR_HEIGHT, (segment.amount / largest) * MAXIMUM_BAR_HEIGHT);

  const column = (bar: ComparisonBar) => (
    <div className={`${styles.column} ${costs ? styles.costs : ''}`}>
      <div className={styles.bar} style={{ height: MAXIMUM_BAR_HEIGHT }}>
        {(costs ? bar.segments : [...bar.segments].reverse()).map((segment) => (
          <div
            key={segment.tone ?? 'base'}
            className={segment.tone ? styles[segment.tone] : styles.base}
            style={{ height: heightOf(segment) }}
          >
            {heightOf(segment) >= MINIMUM_LABELLED_SEGMENT_HEIGHT && segment.label}
          </div>
        ))}
      </div>
      <div className={styles.baseline} />
      <div className={styles.title}>{bar.title}</div>
      <div className={styles.subtitle}>{bar.subtitle}</div>
    </div>
  );

  return (
    <figure className={styles.figure}>
      <div className={styles.columns}>
        {column(left)}
        <div className={styles.divider}>
          {alternatives && (
            <span className={styles.or}>
              <FormattedMessage id="nudge.comparison.or" />
            </span>
          )}
        </div>
        {column(right)}
      </div>
      {caption && <figcaption className="text-body-secondary mt-3 mb-0">{caption}</figcaption>}
    </figure>
  );
};

const cost = (amount: number) => (amount > 0 ? <>&minus;{amount}&nbsp;€</> : <>0&nbsp;€</>);

const REJOIN_EXAMPLE = { grossSalary: 2000, fromNetSalary: 94, taxWin: 106 };

const FeeComparisonNudge = ({
  feeComparison,
  onCallToAction,
}: {
  feeComparison: NudgeFeeComparison;
  onCallToAction: () => void;
}) => {
  const { currentFeePercent, currentFeeAmount, tulevaFeeAmount, savingsAmount } = feeComparison;
  const { data: sourceFunds } = useSourceFunds();
  const currentFundCount = (sourceFunds ?? []).filter(
    (fund) => fund.pillar === 2 && !isTulevaIsin(fund.isin) && fund.price > 0,
  ).length;
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
      <ComparisonFigure
        costs
        left={{
          segments: [{ amount: tulevaFeeAmount, tone: 'positive' }],
          title: cost(tulevaFeeAmount),
          subtitle: <FormattedMessage id="thirdPillarSuccess.ourFund" />,
        }}
        right={{
          segments: [{ amount: currentFeeAmount, tone: 'negative' }],
          title: cost(currentFeeAmount),
          subtitle: (
            <FormattedMessage
              id="thirdPillarSuccess.currentFund"
              values={{ count: currentFundCount }}
            />
          ),
        }}
      />
    </NudgeNotice>
  );
};
