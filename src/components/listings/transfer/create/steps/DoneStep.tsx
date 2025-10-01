import { Redirect, useHistory } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { StatusAlert } from '../../../../common/statusAlert';
import { useCreateCapitalTransferContext } from '../hooks';

export const DoneStep = () => {
  const history = useHistory();
  const { buyer, bookValue, totalPrice, sellerIban, createdCapitalTransferContract } =
    useCreateCapitalTransferContext();

  if (!bookValue || !totalPrice || !sellerIban || !buyer) {
    return <Redirect to="/capital/transfer/create" />;
  }

  if (!createdCapitalTransferContract) {
    // eslint-disable-next-line no-console
    console.error('No capital contract present in done step');
    return <Redirect to="/capital/listings" />;
  }

  return (
    <StatusAlert
      title={<FormattedMessage id="capital.transfer.create.success.signedTitle" />}
      actions={
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={() => {
            history.push(`/capital/transfer/${createdCapitalTransferContract.id}`);
          }}
        >
          <FormattedMessage id="capital.transfer.details.button.seeStatus" />
        </button>
      }
    >
      <p>
        <FormattedMessage id="capital.transfer.create.success.signedDescription" />
      </p>
    </StatusAlert>
  );
};
