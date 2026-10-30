import React from 'react';
import { FormattedMessage } from 'react-intl';
import {
  childSupplement,
  earlyYears,
  PensionInput,
  rescueIncrease,
  rescueUntil,
} from './engine/pension';
import { strong } from './richText';

interface Props {
  input: PensionInput;
  age: number;
  pensionAge: number;
}

const percentOf = (increase: number) => Math.round(increase * 100);

const increaseWhen = (until: number | null, age: number, pensionAge: number) => {
  if (until !== null && until > age) {
    return 'allowance';
  }
  return age < pensionAge ? 'early' : 'atPensionAge';
};

export const RescueNotes = ({ input, age, pensionAge }: Props) => {
  const rescueYears = input.rescueYears || 0;
  if (rescueYears <= 0) {
    return null;
  }
  const until = input.flexEarly ? null : rescueUntil(input);
  const isAllowancePaid = until !== null && until > age && (input.soodus || 0) > 0;
  const retirementYear = input.birthYear + age;
  const increase = rescueIncrease(rescueYears, retirementYear);
  const increaseInLaw = rescueIncrease(rescueYears);
  const hasKidsRight = earlyYears({ kids: input.kids }) > 0;
  const isKidsPension =
    hasKidsRight && input.kids?.earlyUser === 'me' && input.rescueBasis !== 'toetus';

  return (
    <ul className="payout-note">
      {isAllowancePaid && (
        <li>
          <FormattedMessage
            id="futureMe.age65.rescue.payer"
            values={{ strong, until, hasKidsSupplement: childSupplement(input) > 0 }}
          />
        </li>
      )}
      {increase > 0 && (
        <li>
          <FormattedMessage
            id="futureMe.age65.rescue.increase"
            values={{
              strong,
              years: rescueYears,
              percent: percentOf(increase),
              when: increaseWhen(until, age, pensionAge),
              age,
              pensionAge,
            }}
          />
        </li>
      )}
      {increase === 0 && increaseInLaw > 0 && (
        <li>
          <FormattedMessage
            id="futureMe.age65.rescue.increaseEnded"
            values={{ strong, percent: percentOf(increaseInLaw), year: retirementYear }}
          />
        </li>
      )}
      <li>
        <FormattedMessage
          id="futureMe.age65.rescue.work"
          values={{ strong, hasSecondPillar: (input.p2 || 0) > 0, isKidsPension }}
        />
      </li>
    </ul>
  );
};
