import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Age60Answers, ReducedPay } from './age60Answers';
import { euro } from './amountFormat';
import { ChoiceCard } from './ChoiceCard';
import { amountOf } from './youAnswers';

const WORKLOAD_CHOICES = ['same', 'less'] as const;

interface Props {
  answers: Age60Answers;
  age: number;
  currentPay: Required<ReducedPay>;
  hasThirdPillar: boolean;
  onChange: (answers: Age60Answers) => void;
}

const PayField = ({
  id,
  labelId,
  value,
  onChange,
}: {
  id: string;
  labelId: 'futureMe.age60.workload.gross' | 'futureMe.age60.workload.thirdPillar';
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="narrow-field mt-2">
    <label className="form-label" htmlFor={id}>
      <FormattedMessage id={labelId} />
    </label>
    <input
      id={id}
      type="number"
      className="form-control"
      min={0}
      step={50}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
);

export const Age60Workload = ({ answers, age, currentPay, hasThirdPillar, onChange }: Props) => {
  const { reducedPay } = answers;
  const changePay = (changes: ReducedPay) =>
    onChange({ ...answers, reducedPay: { ...reducedPay, ...changes } });
  return (
    <fieldset className="payout-fieldset mt-3 mb-3">
      <legend className="h6 text-navy">
        <FormattedMessage id="futureMe.age60.workload.legend" values={{ age }} />
      </legend>
      <p className="text-secondary mb-2 text-pretty">
        <FormattedMessage id="futureMe.age60.workload.intro" />
      </p>
      <div className="payout-choices">
        {WORKLOAD_CHOICES.map((value) => (
          <ChoiceCard
            key={value}
            idPrefix="future-me-age60-workload"
            name="future-me-age60-workload"
            value={value}
            checked={(reducedPay ? 'less' : 'same') === value}
            title={<FormattedMessage id={`futureMe.age60.workload.${value}.title`} />}
            text={
              <FormattedMessage
                id={`futureMe.age60.workload.${value}.text`}
                values={{ gross: euro(amountOf(currentPay.gross)) }}
              />
            }
            onChange={() =>
              value === 'less' ? changePay({}) : onChange({ ...answers, reducedPay: undefined })
            }
          />
        ))}
      </div>
      {reducedPay && (
        <>
          <PayField
            id="future-me-age60-gross"
            labelId="futureMe.age60.workload.gross"
            value={reducedPay.gross ?? currentPay.gross}
            onChange={(gross) => changePay({ gross })}
          />
          {hasThirdPillar && (
            <PayField
              id="future-me-age60-third-pillar"
              labelId="futureMe.age60.workload.thirdPillar"
              value={reducedPay.thirdPillarMonthly ?? currentPay.thirdPillarMonthly}
              onChange={(thirdPillarMonthly) => changePay({ thirdPillarMonthly })}
            />
          )}
          <p className="text-secondary mt-2 mb-0 text-pretty">
            <FormattedMessage id="futureMe.age60.workload.note" values={{ age }} />
          </p>
        </>
      )}
    </fieldset>
  );
};
