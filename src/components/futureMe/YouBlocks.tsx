import React from 'react';
import { FormattedMessage, IntlShape, useIntl } from 'react-intl';
import { formatAmountForCurrency } from '../common/utils';
import { TranslationKey } from '../translations';
import {
  amountOf,
  effectivePensionAge,
  FUND_RETURNS,
  FundKey,
  PENSION_AGE_OPTIONS,
  SECOND_PILLAR_RATE_OPTIONS,
  ThirdPillarJoined,
} from './youAnswers';
import { AmountField, BlockProps, SelectField } from './YouFields';
import { YouSection, YouSectionLabels } from './YouSection';

const sectionLabels = (block: 'state' | 'secondPillar' | 'thirdPillar'): YouSectionLabels => ({
  close: `futureMe.you.${block}.close`,
  closeLabel: `futureMe.you.${block}.closeLabel`,
  edit: `futureMe.you.${block}.edit`,
  editLabel: `futureMe.you.${block}.editLabel`,
  fill: `futureMe.you.${block}.fill`,
  fillLabel: `futureMe.you.${block}.fillLabel`,
  incomplete: 'futureMe.you.me.incomplete',
});

const FUND_KEYS = Object.keys(FUND_RETURNS) as FundKey[];
const THIRD_PILLAR_JOIN_TIMES: ThirdPillarJoined[] = ['after', 'before', 'none'];
const MAX_OPEN_AGE_DIGITS = 2;

const percentOf = (rate: number): number => Math.round(rate * 100);

const euro = (value: number): string => formatAmountForCurrency(Math.round(value), 0);

const rateLabel = (intl: IntlShape, rate: string): string =>
  Number(rate) > 0
    ? intl.formatMessage(
        { id: 'futureMe.you.secondPillarRate.percent' },
        { percent: percentOf(Number(rate)) },
      )
    : intl.formatMessage({ id: 'futureMe.you.secondPillarRate.none' });

const fundOptions = (intl: IntlShape) =>
  FUND_KEYS.map((fund) => ({
    value: fund,
    label: intl.formatMessage(
      { id: `futureMe.you.fund.${fund}` as TranslationKey },
      { percent: percentOf(FUND_RETURNS[fund]) },
    ),
  }));

export const StateSection = ({
  answers,
  touched,
  isOpen,
  isComplete,
  onToggle,
  onChange,
  onBlur,
}: BlockProps) => {
  const intl = useIntl();

  return (
    <YouSection
      id="future-me-state"
      title={<FormattedMessage id="futureMe.you.state.title" />}
      summary={
        <FormattedMessage
          id="futureMe.you.state.summary"
          values={{
            age: effectivePensionAge(answers),
            amount: euro(amountOf(answers.firstPillarMonthly)),
          }}
        />
      }
      labels={sectionLabels('state')}
      isOpen={isOpen}
      isComplete={isComplete}
      onToggle={onToggle}
    >
      <p className="form-text mt-0">
        <FormattedMessage
          id="futureMe.you.state.ska"
          values={{
            link: (chunks: React.ReactNode) => (
              <a
                href="https://iseteenindus.sotsiaalkindlustusamet.ee/self-service/pension-calculator"
                target="_blank"
                rel="noopener noreferrer"
              >
                {chunks}
              </a>
            ),
          }}
        />
      </p>
      <div className="row g-3">
        <SelectField
          id="future-me-pension-age"
          label="futureMe.you.pensionAge.label"
          value={String(effectivePensionAge(answers))}
          options={PENSION_AGE_OPTIONS.map((years) => ({
            value: String(years),
            label: intl.formatMessage({ id: 'futureMe.you.pensionAge.option' }, { years }),
          }))}
          onChange={(pensionAgeYears) => onChange({ pensionAgeYears })}
        />
        <AmountField
          field="firstPillarMonthly"
          answers={answers}
          touched={touched}
          label="futureMe.you.firstPillarMonthly.label"
          unit="futureMe.you.firstPillarMonthly.unit"
          name="futureMe.you.firstPillarMonthly.name"
          step={10}
          onChange={onChange}
          onBlur={onBlur}
        />
      </div>
    </YouSection>
  );
};

export const SecondPillarSection = ({
  answers,
  touched,
  isOpen,
  isComplete,
  onToggle,
  onChange,
  onBlur,
}: BlockProps) => {
  const intl = useIntl();

  return (
    <YouSection
      id="future-me-second-pillar"
      title={<FormattedMessage id="futureMe.you.secondPillar.title" />}
      summary={
        <FormattedMessage
          id="futureMe.you.secondPillar.summary"
          values={{
            gross: euro(amountOf(answers.grossMonthly)),
            amount: euro(amountOf(answers.secondPillarAmount)),
            paysIn: Number(answers.secondPillarRate) > 0 ? 'yes' : 'no',
            rate: rateLabel(intl, answers.secondPillarRate),
            returnRate: percentOf(FUND_RETURNS[answers.secondPillarFund]),
            nowrap: (chunks: React.ReactNode) => <span className="text-nowrap">{chunks}</span>,
          }}
        />
      }
      labels={sectionLabels('secondPillar')}
      isOpen={isOpen}
      isComplete={isComplete}
      onToggle={onToggle}
    >
      <div className="row g-3">
        <AmountField
          field="grossMonthly"
          answers={answers}
          touched={touched}
          label="futureMe.you.grossMonthly.label"
          unit="futureMe.you.grossMonthly.unit"
          name="futureMe.you.grossMonthly.name"
          step={100}
          onChange={onChange}
          onBlur={onBlur}
        />
        <SelectField
          id="future-me-second-pillar-rate"
          label="futureMe.you.secondPillarRate.label"
          value={answers.secondPillarRate}
          options={SECOND_PILLAR_RATE_OPTIONS.map((rate) => ({
            value: rate,
            label: rateLabel(intl, rate),
          }))}
          onChange={(secondPillarRate) => onChange({ secondPillarRate })}
        />
        <AmountField
          field="secondPillarAmount"
          answers={answers}
          touched={touched}
          label="futureMe.you.secondPillarAmount.label"
          unit="futureMe.you.secondPillarAmount.unit"
          name="futureMe.you.secondPillarAmount.name"
          step={1000}
          onChange={onChange}
          onBlur={onBlur}
        />
        <SelectField
          id="future-me-second-pillar-fund"
          label="futureMe.you.secondPillarFund.label"
          value={answers.secondPillarFund}
          options={fundOptions(intl)}
          onChange={(secondPillarFund) =>
            onChange({ secondPillarFund: secondPillarFund as FundKey })
          }
        />
      </div>
    </YouSection>
  );
};

export const ThirdPillarSection = ({
  answers,
  touched,
  isOpen,
  isComplete,
  onToggle,
  onChange,
  onBlur,
}: BlockProps) => {
  const intl = useIntl();
  const hasNotJoined = answers.thirdPillarJoined === 'none';
  const isOpeningPlanned =
    hasNotJoined && amountOf(answers.thirdPillarMonthly) > 0 && !!answers.thirdPillarOpenAge;

  return (
    <YouSection
      id="future-me-third-pillar"
      title={<FormattedMessage id="futureMe.you.thirdPillar.title" />}
      summary={
        <FormattedMessage
          id="futureMe.you.thirdPillar.summary"
          values={{
            joined: answers.thirdPillarJoined,
            isPlanned: isOpeningPlanned ? 'yes' : 'no',
            openAge: answers.thirdPillarOpenAge,
            amount: euro(amountOf(answers.thirdPillarAmount)),
            monthly: euro(amountOf(answers.thirdPillarMonthly)),
            returnRate: percentOf(FUND_RETURNS[answers.thirdPillarFund]),
          }}
        />
      }
      labels={sectionLabels('thirdPillar')}
      isOpen={isOpen}
      isComplete={isComplete}
      onToggle={onToggle}
    >
      <div className="row g-3">
        <SelectField
          id="future-me-third-pillar-joined"
          label="futureMe.you.thirdPillarJoined.label"
          value={answers.thirdPillarJoined}
          options={THIRD_PILLAR_JOIN_TIMES.map((when) => ({
            value: when,
            label: intl.formatMessage({
              id: `futureMe.you.thirdPillarJoined.${when}` as TranslationKey,
            }),
          }))}
          onChange={(thirdPillarJoined) =>
            onChange({ thirdPillarJoined: thirdPillarJoined as ThirdPillarJoined })
          }
        />
        <AmountField
          field="thirdPillarAmount"
          answers={answers}
          touched={touched}
          label="futureMe.you.thirdPillarAmount.label"
          unit="futureMe.you.thirdPillarAmount.unit"
          name="futureMe.you.thirdPillarAmount.name"
          step={1000}
          disabled={hasNotJoined}
          shownValue={hasNotJoined ? '0' : undefined}
          onChange={onChange}
          onBlur={onBlur}
        />
        <AmountField
          field="thirdPillarMonthly"
          answers={answers}
          touched={touched}
          label="futureMe.you.thirdPillarMonthly.label"
          unit="futureMe.you.thirdPillarMonthly.unit"
          name="futureMe.you.thirdPillarMonthly.name"
          step={10}
          onChange={onChange}
          onBlur={onBlur}
        />
        {hasNotJoined && (
          <div className="col-12 col-sm-6">
            <label className="form-label text-balance" htmlFor="future-me-third-pillar-open-age">
              <FormattedMessage id="futureMe.you.thirdPillarOpenAge.label" />
            </label>
            <input
              id="future-me-third-pillar-open-age"
              className="form-control"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={MAX_OPEN_AGE_DIGITS}
              autoComplete="off"
              value={answers.thirdPillarOpenAge}
              aria-describedby="future-me-third-pillar-open-age-hint"
              onChange={(event) => onChange({ thirdPillarOpenAge: event.target.value })}
            />
            <div className="form-text" id="future-me-third-pillar-open-age-hint">
              <FormattedMessage id="futureMe.you.thirdPillarOpenAge.hint" />
            </div>
          </div>
        )}
        <SelectField
          id="future-me-third-pillar-fund"
          label="futureMe.you.thirdPillarFund.label"
          value={answers.thirdPillarFund}
          options={fundOptions(intl)}
          onChange={(thirdPillarFund) => onChange({ thirdPillarFund: thirdPillarFund as FundKey })}
        />
      </div>
    </YouSection>
  );
};
