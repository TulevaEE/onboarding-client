import React, { RefObject } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import { euro } from './amountFormat';
import { ChapterHead } from './ChapterHead';
import { needMonthly } from './expensesAnswers';
import { ResultAdvice } from './ResultAdvice';
import { ResultAssumptions } from './ResultAssumptions';
import { ResultChart } from './ResultChart';
import { nominalReturnsOf } from './nominal';
import { ResultDecisions } from './ResultDecisions';
import { ResultLegacy } from './ResultLegacy';
import { ResultRules } from './ResultRules';
import {
  coverageKind,
  incomeAtStart,
  IncomeSource,
  MAX_AGE_SHOWN,
  Result,
  ResultContext,
  resultOf,
} from './resultAnswers';
import { FutureMeStep, StepId } from './steps';
import { strong } from './richText';

interface Props {
  context: ResultContext;
  headingRef: RefObject<HTMLHeadingElement>;
  onGoTo: (step: StepId) => void;
}

const INCOME_LABELS: Record<IncomeSource, TranslationKey> = {
  firstPillar: 'futureMe.result.income.firstPillar',
  specialPension: 'futureMe.result.income.specialPension',
  secondPillar: 'futureMe.result.income.secondPillar',
  thirdPillar: 'futureMe.result.income.thirdPillar',
  deposit: 'futureMe.result.income.deposit',
};

const AnswerText = ({ result, need }: { result: Result; need: number }) => {
  const kind = coverageKind(result);
  const until = result.coversNeedUntil ?? MAX_AGE_SHOWN;
  const gapEnd = result.gapEnd ?? until;
  return (
    <>
      <FormattedMessage
        id="futureMe.result.answer.costs"
        values={{
          kind,
          need: euro(need),
          until,
          from: until,
          to: gapEnd,
          next: gapEnd + 1,
          isRange: gapEnd > until ? 'yes' : 'no',
          isBeforeStatePension: until < result.p1StartAge ? 'yes' : 'no',
          stateStart: result.p1StartAge,
          strong,
        }}
      />{' '}
      <FormattedMessage
        id="futureMe.result.answer.money"
        values={{
          endAge: result.moneyEndAge ?? 'never',
          income: euro(result.incomeAfterMoney ?? 0),
        }}
      />{' '}
      <FormattedMessage
        id="futureMe.result.answer.sustainable"
        values={{
          age: result.horizonAge,
          amount: euro(result.sustainable),
          strong,
        }}
      />
    </>
  );
};

const Tiles = ({ result }: { result: Result }) => {
  const kind = coverageKind(result);
  const until = result.coversNeedUntil ?? MAX_AGE_SHOWN;
  const endAge = result.moneyEndAge ?? 'never';
  return (
    <ul
      className="result-tiles"
      aria-label={useIntl().formatMessage({ id: 'futureMe.result.tiles.label' })}
    >
      <li>
        <strong>
          <FormattedMessage
            id="futureMe.result.tile.covers.value"
            values={{ kind, until, from: until, to: result.gapEnd ?? until }}
          />
        </strong>{' '}
        <span>
          <FormattedMessage id="futureMe.result.tile.covers.label" values={{ kind }} />
        </span>
      </li>
      <li>
        <strong>
          <FormattedMessage id="futureMe.result.tile.moneyEnd.value" values={{ endAge }} />
        </strong>{' '}
        <span>
          <FormattedMessage id="futureMe.result.tile.moneyEnd.label" />
        </span>
      </li>
      <li>
        <strong>{euro(result.spendAt90)}</strong>{' '}
        <span>
          <FormattedMessage id="futureMe.result.tile.spendAt90.label" />
        </span>
      </li>
      <li>
        <strong>{euro(result.sustainable)}</strong>{' '}
        <span>
          <FormattedMessage
            id="futureMe.result.tile.sustainable.label"
            values={{ age: result.horizonAge }}
          />
        </span>
      </li>
    </ul>
  );
};

const IncomeAtPensionAge = ({ result, need }: { result: Result; need: number }) => {
  const intl = useIntl();
  const age = result.pensionStartAge;
  const row = result.rows.find((candidate) => candidate.age === age) ?? result.rows[0];
  const { lines: sources, total } = incomeAtStart(row);
  return (
    <>
      <h3 className="h5 section-title">
        <FormattedMessage id="futureMe.result.income.title" />
      </h3>
      <p className="text-pretty">
        <FormattedMessage id="futureMe.result.income.intro" values={{ age }} />
      </p>
      <ul
        className="result-income"
        aria-label={intl.formatMessage({ id: 'futureMe.result.income.list' }, { age })}
      >
        {sources.map(({ id, amount }) => (
          <li key={id}>
            <span>
              <FormattedMessage id={INCOME_LABELS[id]} />
            </span>
            <span>{euro(amount)}</span>
          </li>
        ))}
        <li className="result-income-total">
          <span>
            <FormattedMessage id="futureMe.result.income.total" />
          </span>
          <span>{euro(total)}</span>
        </li>
        <li>
          <span>
            <FormattedMessage id="futureMe.result.income.costs" />
          </span>
          <span>{euro(need)}</span>
        </li>
      </ul>
    </>
  );
};

export const ResultStep = ({ context, headingRef, onGoTo }: Props) => {
  const result = resultOf(context);
  return (
    <section className="chapter card p-4" aria-labelledby="future-me-result-heading">
      <ChapterHead step={FutureMeStep.RESULT}>
        <p className="chapter-kicker">
          <FormattedMessage id="futureMe.result.kicker" />
        </p>
        <h2 id="future-me-result-heading" className="text-balance" tabIndex={-1} ref={headingRef}>
          <FormattedMessage id="futureMe.result.title" />
        </h2>
      </ChapterHead>
      <p
        role="status"
        aria-labelledby="future-me-result-heading"
        className="result-answer text-pretty"
      >
        <AnswerText result={result} need={needMonthly(context.expenses)} />
      </p>
      <ResultAdvice context={context} result={result} />
      <Tiles result={result} />
      <IncomeAtPensionAge result={result} need={needMonthly(context.expenses)} />
      <ResultChart
        result={result}
        need={needMonthly(context.expenses)}
        nominalReturns={nominalReturnsOf(context)}
      />
      <ResultLegacy context={context} result={result} onGoTo={onGoTo} />
      <ResultDecisions context={context} />
      <ResultAssumptions context={context} />
      <ResultRules context={context} />
    </section>
  );
};
