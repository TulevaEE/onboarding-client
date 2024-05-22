import { PropsWithChildren } from 'react';
import { FormattedMessage } from 'react-intl';
import { TranslationKey } from '../translations';

type Props = PropsWithChildren<{
  titleId: TranslationKey;
  lead?: boolean;
}>;

export const SectionHeading = ({ titleId, lead, children }: Props): React.ReactNode => (
  <div className="mb-3 d-flex flex-row justify-content-between">
    {lead ? (
      <h2 className="lead">
        <FormattedMessage id={titleId} />
      </h2>
    ) : (
      <div>
        <FormattedMessage id={titleId} />
      </div>
    )}
    {children && <div className="ml-md-2 text-nowrap">{children}</div>}
  </div>
);
