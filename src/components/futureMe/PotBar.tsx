import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { TranslationKey } from '../translations';
import { euro } from './amountFormat';
import { potAtPensionOf, ResultContext } from './resultAnswers';

const MIN_SHOWN_AMOUNT = 1;

export const PotBar = ({ context }: { context: ResultContext }) => {
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
              <strong>{euro(amount)}</strong>
              <small>
                <FormattedMessage
                  id={`futureMe.potBar.${key}` as TranslationKey}
                  values={{ age }}
                />
              </small>
            </li>
          ))}
      </ul>
    </aside>
  );
};
