import { useIntl } from 'react-intl';
import { User } from '../../common/apiModels';
import { getFullName } from '../../common/utils';

export type TransferRequest = {
  subject: string;
  text: string;
};

export const useTransferRequest = (user: User, pensionAccountNumber: string): TransferRequest => {
  const { formatMessage } = useIntl();
  const subject = formatMessage({ id: 'insuranceTransfer.request.subject' });
  const subjectLine = formatMessage({ id: 'insuranceTransfer.request.subjectLine' }, { subject });
  const body = formatMessage(
    { id: 'insuranceTransfer.request.body' },
    { name: getFullName(user), personalCode: user.personalCode, pensionAccountNumber },
  );
  return { subject, text: `${subjectLine}\n\n${body}` };
};
