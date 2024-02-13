import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import secondPillarTransferDate from '../secondPillarTransferDate';
import { SuccessNotice2 } from '../../common/SuccessNotice2/SuccessNotice2';
import { State } from '../../../../types';
import { Notice } from '../../common/Notice/Notice';
import whatshot from './whatshot.svg';

interface Props {
  userContributingFuturePayments: boolean;
  userHasTransferredFunds: boolean;
}

export const Success: React.FC<Props> = ({
  userContributingFuturePayments,
  userHasTransferredFunds,
}) => (
  <>
    <SuccessNotice2>
      <h2 className="my-3">
        <FormattedMessage id="success.done" />
      </h2>
      {userHasTransferredFunds && (
        <p>
          <FormattedMessage
            id="success.shares.switched"
            values={{
              b: (chunks: string) => <b>{chunks}</b>,
              transferDate: secondPillarTransferDate().format('DD.MM.YYYY'),
            }}
          />
        </p>
      )}
      {userContributingFuturePayments && (
        <p>
          <FormattedMessage
            id="success.your.payments"
            values={{
              b: (chunks: string) => <b>{chunks}</b>,
            }}
          />
        </p>
      )}

      <div className="d-flex justify-content-center mt-4">
        <a className="btn btn-outline-primary flex-grow-1 flex-md-grow-0" href="/account">
          <FormattedMessage id="thirdPillarBackToPartner.account" />
        </a>
      </div>
    </SuccessNotice2>
    <Notice>
      <img src={whatshot} alt="" />
      <h2 className="my-3">
        <FormattedMessage id="success.2ndPillarPaymentUpsell.title" />
      </h2>
      <p className="mt-3">
        <FormattedMessage
          id="success.2ndPillarPaymentUpsell.content"
          values={{
            b: (chunks: string) => <b>{chunks}</b>,
          }}
        />
      </p>
      <div className="mt-3 small">
        <FormattedMessage id="success.2ndPillarPaymentUpsell.small" />
      </div>
      <div className="d-flex justify-content-center mt-4">
        <Link
          to="/2nd-pillar-payment-rate"
          className="btn btn-primary btn-lg flex-grow-1 flex-md-grow-0"
        >
          <FormattedMessage id="success.2ndPillarPaymentUpsell.button" />
        </Link>
      </div>
      <div className="mt-2 small text-muted">
        <FormattedMessage id="success.2ndPillarPaymentUpsell.disclaimer" />
      </div>
    </Notice>
  </>
);

const mapStateToProps = (state: State) => ({
  userContributingFuturePayments: !!state.exchange.selectedFutureContributionsFundIsin,
  userHasTransferredFunds: !!state.exchange.sourceSelection,
});

const connectToRedux = connect(mapStateToProps);

export default connectToRedux(Success);
