import { FormattedMessage } from 'react-intl';

type Props = {
  className?: string;
};

export const Recommended = ({ className = '' }: Props) => (
  <span className={`badge rounded-pill text-bg-primary align-text-bottom ${className}`.trim()}>
    <FormattedMessage id="common.recommended" />
  </span>
);
