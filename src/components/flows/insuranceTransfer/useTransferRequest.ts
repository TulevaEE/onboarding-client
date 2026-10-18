import { useIntl } from 'react-intl';
import { User } from '../../common/apiModels';
import { getFullName } from '../../common/utils';

export type TransferRequest = {
  subject: string;
  text: string;
};

export const useTransferRequest = (
  user: User,
  endDate: string | null,
  contractNumber: string | null,
): TransferRequest => {
  const { formatMessage, formatDate } = useIntl();
  const subject = formatMessage({ id: 'insuranceTransfer.request.subject' });
  const subjectLine = formatMessage({ id: 'insuranceTransfer.request.subjectLine' }, { subject });
  const termination = contractNumber
    ? formatMessage({ id: 'insuranceTransfer.request.termination.oneContract' }, { contractNumber })
    : formatMessage({ id: 'insuranceTransfer.request.termination.allContracts' });
  const body = formatMessage(
    { id: 'insuranceTransfer.request.body' },
    {
      termination,
      name: getFullName(user),
      personalCode: user.personalCode,
      endDate: endDate
        ? formatDate(endDate, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
        : formatMessage({ id: 'insuranceTransfer.request.endDate.asap' }),
      pensionAccountNumber: user.pensionAccountNumber,
    },
  );
  return { subject, text: `${subjectLine}\n\n${body}` };
};
