import { PropsWithChildren } from 'react';
import { FormattedMessage } from 'react-intl';
import { TranslationKey } from '../translations';

type Props = PropsWithChildren<{
  titleId: TranslationKey;
  lead?: boolean;
}>;

export const SectionHeading = ({ titleId, lead, children }: Props): React.ReactNode => (
  <div className="mt-5 mb-4 d-flex flex-wrap column-gap-4 row-gap-2 justify-content-between align-items-baseline">
    {lead ? (
      <h2 className="m-0">
        <FormattedMessage id={titleId} />
      </h2>
    ) : (
      <h3 className="m-0">
        <FormattedMessage id={titleId} />
      </h3>
    )}
    {children && <div>{children}</div>}
  </div>
);
