import React, { ReactNode, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, Redirect } from 'react-router-dom';
import { useThirdPillarTaxHeadroom } from '../../common/apiHooks';
import { ThirdPillarTaxHeadroom } from '../../common/apiModels/taxHeadroom';
import { Loader } from '../../common/loader/Loader';
import { usePageTitle } from '../../common/usePageTitle';
import { Amount } from './Amount';
import {
  awaitsExpectedIncome,
  HeadroomFigures,
  headroomFiguresOf,
  monthNumberOf,
} from './headroomFigures';
import { HeadroomMeter } from './HeadroomMeter';
import { paymentLocationFor, recurringPaymentLocationFor, TAX_HEADROOM_PATH } from './paths';
import { useExpectedIncomeCorrection } from './useExpectedIncome';
import { TaxHeadroomBreakdown } from './TaxHeadroomBreakdown';
import { TranslationKey } from '../../translations';

type HeadroomProps = { headroom: ThirdPillarTaxHeadroom; figures: HeadroomFigures };

type Message = { title: TranslationKey; body: TranslationKey };

const NO_DATA: Message = {
  title: 'thirdPillarTaxHeadroom.result.noData.title',
  body: 'thirdPillarTaxHeadroom.result.noData.body',
};
const NO_TAX_WIN: Message = {
  title: 'thirdPillarTaxHeadroom.result.noTaxWin.title',
  body: 'thirdPillarTaxHeadroom.result.noTaxWin.body',
};
const USED_UP: Message = {
  title: 'thirdPillarTaxHeadroom.result.usedUp.title',
  body: 'thirdPillarTaxHeadroom.result.usedUp.body',
};

const nothingRemainingMessageOf = ({ headroom, figures }: HeadroomProps): Message => {
  if (awaitsExpectedIncome(headroom)) {
    return NO_DATA;
  }
  return figures.hasNoTaxWin ? NO_TAX_WIN : USED_UP;
};

const titleIdOf = ({ headroom, figures }: HeadroomProps): TranslationKey => {
  if (headroom.expectedIncomeBasis === 'LAST_YEAR' && !figures.expectedIncomeIsOwn) {
    return 'thirdPillarTaxHeadroom.result.lastYearTitle';
  }
  return figures.limitIsEstimate
    ? 'thirdPillarTaxHeadroom.result.estimateTitle'
    : 'thirdPillarTaxHeadroom.result.title';
};

const RemainingHeadroom = ({ headroom, figures }: HeadroomProps) => (
  <>
    <h1 className="h3 fw-medium mb-2 text-balance">
      <FormattedMessage id={titleIdOf({ headroom, figures })} values={{ year: headroom.year }} />
    </h1>
    <p className="display-3 fw-bold mb-3 lh-1">
      <Amount amount={figures.remaining} />
    </p>
    <p className="lead text-body-secondary mb-0 text-pretty">
      <FormattedMessage
        id={
          figures.limitIsEstimate
            ? 'thirdPillarTaxHeadroom.result.refundEstimate'
            : 'thirdPillarTaxHeadroom.result.refund'
        }
        values={{
          refund: <Amount amount={figures.refund} className="text-body fw-medium" />,
        }}
      />
    </p>
  </>
);

const NothingRemaining = ({ headroom, figures }: HeadroomProps) => {
  const { title, body } = nothingRemainingMessageOf({ headroom, figures });
  return (
    <>
      <h1 className="h3 fw-medium mb-2 text-balance">
        <FormattedMessage id={title} values={{ year: headroom.year }} />
      </h1>
      <p className="lead text-body-secondary mb-0 text-pretty">
        <FormattedMessage id={body} />
      </p>
    </>
  );
};

const GuessedIncomeNote = ({
  headroom,
  figures,
  onChange,
}: HeadroomProps & {
  onChange: () => void;
}) => {
  const { formatDate } = useIntl();
  const monthName = (month: number) =>
    formatDate(new Date(headroom.year, month - 1, 1), { month: 'long' });
  const monthlyValues = {
    monthly: <Amount amount={figures.expectedMonthlyIncome} />,
    kind: figures.expectedMonthsDiffer ? 'average' : 'same',
  };
  const note: ReactNode =
    headroom.expectedIncomeBasis === 'LAST_YEAR' || !headroom.incomeKnownThrough ? (
      <FormattedMessage id="thirdPillarTaxHeadroom.result.lastYearNote" values={monthlyValues} />
    ) : (
      <FormattedMessage
        id="thirdPillarTaxHeadroom.result.recentMonthsNote"
        values={{
          from: monthName(1),
          through: monthName(monthNumberOf(headroom.incomeKnownThrough)),
          ...monthlyValues,
        }}
      />
    );

  return (
    <p className="text-body-secondary mt-3 mb-0 text-pretty">
      {note}{' '}
      <button type="button" className="btn btn-link p-0 align-baseline" onClick={onChange}>
        <FormattedMessage id="thirdPillarTaxHeadroom.result.changeExpectedIncome" />
      </button>
    </p>
  );
};

const PaymentCallToAction = ({
  figures,
  saving,
}: {
  figures: HeadroomFigures;
  saving: boolean;
}) => {
  if (figures.remaining <= 0) {
    return null;
  }
  const className = saving ? 'btn btn-primary disabled' : 'btn btn-primary';
  if (figures.suggestsRecurringPayment) {
    return (
      <Link
        to={recurringPaymentLocationFor(figures.monthlyPayment)}
        className={className}
        aria-disabled={saving}
      >
        <FormattedMessage
          id="thirdPillarTaxHeadroom.result.recurring"
          values={{ monthly: <Amount amount={figures.monthlyPayment} /> }}
        />
      </Link>
    );
  }
  return (
    <Link to={paymentLocationFor(figures.remaining)} className={className} aria-disabled={saving}>
      <FormattedMessage id="thirdPillarTaxHeadroom.result.pay" />
    </Link>
  );
};

export const TaxHeadroomResult = () => {
  usePageTitle('pageTitle.thirdPillarTaxHeadroom');
  const { data: headroom, isLoading } = useThirdPillarTaxHeadroom();
  const [breakdownOpen, setBreakdownOpen] = useState<boolean | null>(null);
  const yearlyIncomeInput = useRef<HTMLInputElement>(null);
  const { correctMonth, correctYear, saving, failed } = useExpectedIncomeCorrection();

  if (isLoading) {
    return <Loader className="align-middle" />;
  }

  if (!headroom) {
    return <Redirect to={TAX_HEADROOM_PATH} />;
  }

  const figures = headroomFiguresOf(headroom);

  const changeExpectedIncome = () => {
    setBreakdownOpen(true);
    window.requestAnimationFrame(() => yearlyIncomeInput.current?.focus());
  };

  return (
    <div className="col-12 col-md-11 col-lg-8 mx-auto">
      {figures.remaining > 0 ? (
        <RemainingHeadroom headroom={headroom} figures={figures} />
      ) : (
        <NothingRemaining headroom={headroom} figures={figures} />
      )}

      {!figures.hasNoTaxWin && <HeadroomMeter className="mt-5" headroom={headroom} />}
      {figures.limitIsEstimate &&
        headroom.expectedIncomeBasis !== 'NO_DATA' &&
        !figures.expectedIncomeIsOwn && (
          <GuessedIncomeNote
            headroom={headroom}
            figures={figures}
            onChange={changeExpectedIncome}
          />
        )}

      <div className="mt-5 d-flex flex-column-reverse flex-sm-row justify-content-sm-between align-items-sm-center gap-2">
        <Link to="/account" className="btn btn-light">
          <FormattedMessage id="thirdPillarTaxHeadroom.result.account" />
        </Link>
        <PaymentCallToAction figures={figures} saving={saving} />
      </div>

      <TaxHeadroomBreakdown
        className="mt-5"
        headroom={headroom}
        figures={figures}
        open={breakdownOpen ?? headroom.expectedIncomeBasis === 'NO_DATA'}
        onToggle={setBreakdownOpen}
        onCorrectMonth={correctMonth}
        onCorrectYear={correctYear}
        correctionFailed={failed}
        yearlyIncomeInput={yearlyIncomeInput}
      />

      <p className="small text-body-secondary mt-5 mb-0 text-pretty">
        <FormattedMessage id="thirdPillarTaxHeadroom.disclaimer" />
      </p>
    </div>
  );
};
