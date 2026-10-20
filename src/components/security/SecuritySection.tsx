import React, { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { TranslationKey } from '../translations';

export const SecuritySection: FC<{
  id: string;
  title: TranslationKey;
  description: TranslationKey;
}> = ({ id, title, description, children }) => (
  <section aria-labelledby={id}>
    <h2 id={id} className="h4 m-0 text-balance">
      <FormattedMessage id={title} />
    </h2>
    <p className="m-0 mt-1 text-body-secondary text-pretty">
      <FormattedMessage id={description} />
    </p>
    <div className="mt-3">{children}</div>
  </section>
);
