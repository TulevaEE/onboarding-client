import React, { RefObject, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import { euro } from './amountFormat';
import { ChapterHead } from './ChapterHead';
import { DecisionId } from './decisions';
import { SimulationRow } from './engine/pension';
import { needMonthly } from './expensesAnswers';
import { HelpButton } from './HelpButton';
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
import { FutureMeStep } from './steps';
import { strong } from './richText';
import { specialPensionStartAge } from './specialPensionAnswers';

interface Props {
  context: ResultContext;
  headingRef: RefObject<HTMLHeadingElement>;
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

const isPastPensionAge = ({ rows, pensionStartAge }: Result): boolean =>
  rows[0].age > pensionStartAge;

const savingsAtPensionStartOrToday = ({ rows, pensionStartAge }: Result): SimulationRow =>
  rows.find(({ age }) => age === pensionStartAge) ?? rows[0];

const paidFromAge = ({ rows }: Result, firstPaid: SimulationRow, startAge: number): number =>
  firstPaid === rows[0] ? startAge : firstPaid.age;

const fullAfterHalfValues = (result: Result, firstPaid: SimulationRow) => {
  const fullPaid = result.rows.find((row) => row.age === result.p1FullAge);
  return fullPaid && fullPaid.age > firstPaid.age
    ? {
        isHalfFirst: 'yes',
        statePensionFull: euro(fullPaid.i1g),
        statePensionFullAge: fullPaid.age,
      }
    : { isHalfFirst: 'no' };
};

const statePensionValues = (result: Result) => {
  const firstPaid = result.rows.find((row) => row.i1g > 0.5);
  return firstPaid
    ? {
        hasStatePension: 'yes',
        statePension: euro(firstPaid.i1g),
        statePensionAge: paidFromAge(result, firstPaid, result.p1StartAge),
        ...fullAfterHalfValues(result, firstPaid),
      }
    : { hasStatePension: 'no' };
};

const specialPensionValues = ({ plan }: ResultContext, result: Result) => {
  const paid = result.rows.filter((row) => row.ispg > 0.5);
  if (paid.length === 0) {
    return { hasSpecialPension: 'no' };
  }
  const lastPaid = paid[paid.length - 1];
  return {
    hasSpecialPension: 'yes',
    specialPension: euro(paid[0].ispg),
    specialPensionAge: paidFromAge(result, paid[0], specialPensionStartAge(plan)),
    isSpecialPensionForLife: lastPaid === result.rows[result.rows.length - 1] ? 'yes' : 'no',
    specialPensionUntil: lastPaid.age,
  };
};

const sustainableHelpValues = (context: ResultContext, result: Result) => {
  const savings = savingsAtPensionStartOrToday(result);
  return {
    sustainable: euro(result.sustainable),
    horizonAge: result.horizonAge,
    ...specialPensionValues(context, result),
    ...statePensionValues(result),
    isPastPensionAge: isPastPensionAge(result) ? 'yes' : 'no',
    pot: euro(savings.pot),
    hasDeposit: savings.deposit > 0.5 ? 'yes' : 'no',
    deposit: euro(savings.deposit),
    need: euro(needMonthly(context.expenses)),
  };
};

const Tiles = ({ context, result }: { context: ResultContext; result: Result }) => {
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
          <HelpButton topic="sustainable" values={sustainableHelpValues(context, result)} />
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

export const ResultStep = ({ context, headingRef }: Props) => {
  const result = resultOf(context);
  const [openDecision, setOpenDecision] = useState<DecisionId | null>(null);
  const [focusRequests, setFocusRequests] = useState(0);
  const openAndFocusDecision = (id: DecisionId) => {
    setOpenDecision(id);
    setFocusRequests((count) => count + 1);
  };
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
      <ResultAdvice context={context} result={result} onOpenDecision={openAndFocusDecision} />
      <Tiles context={context} result={result} />
      <IncomeAtPensionAge result={result} need={needMonthly(context.expenses)} />
      <ResultChart
        result={result}
        need={needMonthly(context.expenses)}
        nominalReturns={nominalReturnsOf(context)}
      />
      <ResultLegacy context={context} result={result} />
      <ResultDecisions
        context={context}
        openId={openDecision}
        onOpen={setOpenDecision}
        focusRequests={focusRequests}
      />
      <ResultAssumptions context={context} />
      <ResultRules context={context} />
    </section>
  );
};
