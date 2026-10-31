import React from 'react';
import { FormattedMessage, IntlShape, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import {
  amountOf,
  effectivePensionAge,
  hasJoinedThirdPillar,
  limitsOf,
  PENSION_AGE_OPTIONS,
  SECOND_PILLAR_RATE_OPTIONS,
  ThirdPillarJoined,
} from './youAnswers';
import { AmountField, BlockProps, ReturnField, SelectField } from './YouFields';
import { YouSection, YouSectionLabels } from './YouSection';
import { euro, signedNumber } from './amountFormat';

export const sectionLabels = (
  block: 'state' | 'secondPillar' | 'thirdPillar' | 'kids' | 'work',
): YouSectionLabels => ({
  close: `futureMe.you.${block}.close`,
  closeLabel: `futureMe.you.${block}.closeLabel`,
  edit: `futureMe.you.${block}.edit`,
  editLabel: `futureMe.you.${block}.editLabel`,
  fill: `futureMe.you.${block}.fill`,
  fillLabel: `futureMe.you.${block}.fillLabel`,
  incomplete: 'futureMe.you.me.incomplete',
});

const THIRD_PILLAR_JOIN_TIMES: ThirdPillarJoined[] = ['after', 'before', 'plan', 'never'];

const percentOf = (rate: number): number => Math.round(rate * 100);

const rateLabel = (intl: IntlShape, rate: string): string =>
  Number(rate) > 0
    ? intl.formatMessage(
        { id: 'futureMe.you.secondPillarRate.percent' },
        { percent: percentOf(Number(rate)) },
      )
    : intl.formatMessage({ id: 'futureMe.you.secondPillarRate.none' });

export const StateSection = ({
  answers,
  touched,
  isOpen,
  isComplete,
  prefilled,
  onToggle,
  onChange,
  onBlur,
}: BlockProps) => {
  const intl = useIntl();

  return (
    <YouSection
      id="future-me-state"
      icon="landmark"
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
          id="futureMe.you.state.socialInsuranceBoardCalculator"
          values={{
            ska: (chunks: React.ReactNode) => (
              <a href="https://iseteenindus.sotsiaalkindlustusamet.ee/self-service/pension-calculator">
                {chunks}
              </a>
            ),
            eesti: (chunks: React.ReactNode) => (
              <a href="https://www.eesti.ee/et/artikkel/pension/pensionikalkulaator">{chunks}</a>
            ),
          }}
        />
      </p>
      <div className="row g-3">
        <SelectField
          id="future-me-pension-age"
          label="futureMe.you.pensionAge.label"
          help="pensionAge"
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
          help="p1"
          isPrefilled={prefilled.has('firstPillarMonthly')}
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
  prefilled,
  onToggle,
  onChange,
  onBlur,
}: BlockProps) => {
  const intl = useIntl();

  return (
    <YouSection
      id="future-me-second-pillar"
      icon="briefcase"
      title={<FormattedMessage id="futureMe.you.secondPillar.title" />}
      help="pillars"
      summary={
        <FormattedMessage
          id="futureMe.you.secondPillar.summary"
          values={{
            gross: euro(amountOf(answers.grossMonthly)),
            amount: euro(amountOf(answers.secondPillarAmount)),
            paysIn: Number(answers.secondPillarRate) > 0 ? 'yes' : 'no',
            rate: rateLabel(intl, answers.secondPillarRate),
            returnRate: signedNumber(answers.secondPillarReturnPercent),
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
          isPrefilled={prefilled.has('grossMonthly')}
          answers={answers}
          touched={touched}
          label="futureMe.you.grossMonthly.label"
          help="gross"
          unit="futureMe.you.grossMonthly.unit"
          name="futureMe.you.grossMonthly.name"
          step={100}
          onChange={onChange}
          onBlur={onBlur}
        />
        <SelectField
          id="future-me-second-pillar-rate"
          label="futureMe.you.secondPillarRate.label"
          isPrefilled={prefilled.has('secondPillarRate')}
          help="p2Rate"
          value={answers.secondPillarRate}
          options={SECOND_PILLAR_RATE_OPTIONS.map((rate) => ({
            value: rate,
            label: rateLabel(intl, rate),
          }))}
          onChange={(secondPillarRate) => onChange({ secondPillarRate })}
        />
        <AmountField
          field="secondPillarAmount"
          isPrefilled={prefilled.has('secondPillarAmount')}
          answers={answers}
          touched={touched}
          label="futureMe.you.secondPillarAmount.label"
          unit="futureMe.you.secondPillarAmount.unit"
          name="futureMe.you.secondPillarAmount.name"
          step={1000}
          onChange={onChange}
          onBlur={onBlur}
        />
        <ReturnField
          id="future-me-second-pillar-return"
          label="futureMe.you.secondPillarFund.label"
          help="fundCur"
          value={answers.secondPillarReturnPercent}
          onChange={(secondPillarReturnPercent) => onChange({ secondPillarReturnPercent })}
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
  prefilled,
  onToggle,
  onChange,
  onBlur,
}: BlockProps) => {
  const intl = useIntl();
  const hasNotJoined = !hasJoinedThirdPillar(answers);
  const isPlanning = answers.thirdPillarJoined === 'plan';
  const willNotJoin = answers.thirdPillarJoined === 'never';
  const isOpeningPlanned =
    isPlanning && amountOf(answers.thirdPillarMonthly) > 0 && !!answers.thirdPillarOpenAge;

  return (
    <YouSection
      id="future-me-third-pillar"
      icon="tree"
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
            returnRate: signedNumber(answers.thirdPillarReturnPercent),
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
          isPrefilled={prefilled.has('thirdPillarJoined')}
          help="p3Joined"
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
          isPrefilled={prefilled.has('thirdPillarAmount')}
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
          isPrefilled={prefilled.has('thirdPillarMonthly')}
          answers={answers}
          touched={touched}
          label={
            isPlanning
              ? 'futureMe.you.thirdPillarMonthly.planLabel'
              : 'futureMe.you.thirdPillarMonthly.label'
          }
          help="p3Monthly"
          unit="futureMe.you.thirdPillarMonthly.unit"
          name="futureMe.you.thirdPillarMonthly.name"
          step={10}
          disabled={willNotJoin}
          shownValue={willNotJoin ? '0' : undefined}
          onChange={onChange}
          onBlur={onBlur}
        />
        {isPlanning && (
          <AmountField
            field="thirdPillarOpenAge"
            answers={answers}
            touched={touched}
            label="futureMe.you.thirdPillarOpenAge.label"
            help="p3OpenAge"
            unit="futureMe.you.thirdPillarOpenAge.hint"
            unitValues={limitsOf('thirdPillarOpenAge', answers)}
            name="futureMe.you.thirdPillarOpenAge.name"
            step={1}
            inputMode="numeric"
            onChange={onChange}
            onBlur={onBlur}
          />
        )}
        {!willNotJoin && (
          <ReturnField
            id="future-me-third-pillar-return"
            label="futureMe.you.thirdPillarFund.label"
            help="fundCur"
            value={answers.thirdPillarReturnPercent}
            onChange={(thirdPillarReturnPercent) => onChange({ thirdPillarReturnPercent })}
          />
        )}
      </div>
    </YouSection>
  );
};
