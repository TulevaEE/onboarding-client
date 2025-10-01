import { PropsWithChildren, ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { StatusAlert } from '../../../common/statusAlert';

type StepDoneAlertProps = PropsWithChildren<{
  onClick: () => unknown;
  title: ReactNode;
}>;

export const StepDoneAlert = ({ onClick, title, children }: StepDoneAlertProps) => (
  <StatusAlert
    title={title}
    actions={
      <button type="button" className="btn btn-outline-primary" onClick={onClick}>
        <FormattedMessage id="capital.transfer.details.button.seeStatus" />
      </button>
    }
  >
    {children}
  </StatusAlert>
);
