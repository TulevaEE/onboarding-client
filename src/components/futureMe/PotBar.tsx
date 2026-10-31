import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import { euro } from './amountFormat';
import { isLevelEdited, needMonthly } from './expensesAnswers';
import { LineIcon } from './FutureMeIcon';
import { potAtPensionOf, ResultContext } from './resultAnswers';

const MIN_SHOWN_AMOUNT = 1;

const POT_ICONS = {
  secondPillar: 'landmark',
  thirdPillar: 'landmark',
  deposit: 'piggyBank',
} as const;

const CostsItem = ({ context, isChosen }: { context: ResultContext; isChosen: boolean }) => {
  const intl = useIntl();
  const { expenses } = context;

  return (
    <li>
      <LineIcon name="cart" />
      <span>
        <strong>
          {isChosen ? (
            <FormattedMessage
              id="futureMe.potBar.perMonth"
              values={{ amount: euro(needMonthly(expenses)) }}
            />
          ) : (
            <FormattedMessage id="futureMe.potBar.costsNotChosen" />
          )}
        </strong>
        <small>
          <FormattedMessage
            id="futureMe.potBar.costs"
            values={{
              isChosen,
              level: intl.formatMessage({
                id: `futureMe.expenses.level.${expenses.level}.name` as TranslationKey,
              }),
              isEdited: isLevelEdited(expenses, expenses.level),
            }}
          />
        </small>
      </span>
    </li>
  );
};

export const PotBar = ({
  context,
  isCostsChosen,
}: {
  context: ResultContext;
  isCostsChosen: boolean;
}) => {
  const intl = useIntl();
  const { age, p2, p3, deposit } = potAtPensionOf(context);
  const items: { key: 'secondPillar' | 'thirdPillar' | 'deposit'; amount: number }[] = [
    { key: 'secondPillar', amount: p2 },
    { key: 'thirdPillar', amount: p3 },
    { key: 'deposit', amount: deposit },
  ];

  return (
    <aside className="pot-bar" aria-label={intl.formatMessage({ id: 'futureMe.potBar.ariaLabel' })}>
      <ul>
        {items
          .filter(({ key, amount }) => key === 'secondPillar' || amount >= MIN_SHOWN_AMOUNT)
          .map(({ key, amount }) => (
            <li key={key}>
              <LineIcon name={POT_ICONS[key]} />
              <span>
                <strong>{euro(amount)}</strong>
                <small>
                  <FormattedMessage
                    id={`futureMe.potBar.${key}` as TranslationKey}
                    values={{ age }}
                  />
                </small>
              </span>
            </li>
          ))}
        <CostsItem context={context} isChosen={isCostsChosen} />
      </ul>
    </aside>
  );
};
