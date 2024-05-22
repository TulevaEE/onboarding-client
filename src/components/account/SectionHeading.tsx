import { PropsWithChildren } from 'react';
import { FormattedMessage } from 'react-intl';
import { TranslationKey } from '../translations';

type Props = PropsWithChildren<{
  titleId: TranslationKey;
}>;

export const SectionHeading = ({ titleId, children }: Props): React.ReactNode => (
  <div className="mb-4 d-flex flex-row align-items-sm-end justify-content-between">
    <h2 className="lead">
      <FormattedMessage id={titleId} />
    </h2>
    <div className="mb-2 ml-md-2 text-nowrap">{children}</div>
  </div>
);
