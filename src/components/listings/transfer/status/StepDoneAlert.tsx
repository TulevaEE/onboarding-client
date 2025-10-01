import { Children, PropsWithChildren } from 'react';
import { FormattedMessage } from 'react-intl';
import { StatusAlert } from '../../../common/statusAlert';

export const StepDoneAlert = ({
  onClick,
  children,
}: PropsWithChildren<{ onClick: () => unknown }>) => {
  const [title, ...body] = Children.toArray(children);

  return (
    <StatusAlert
      title={title}
      actions={
        <button type="button" className="btn btn-outline-primary" onClick={onClick}>
          <FormattedMessage id="capital.transfer.details.button.seeStatus" />
        </button>
      }
    >
      {body}
    </StatusAlert>
  );
};
