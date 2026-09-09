import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import config from 'react-global-configuration';
import secondPillarTransferDate from '../secondPillarTransferDate';
import { SuccessNotice2 } from '../../common/SuccessNotice2/SuccessNotice2';
import { State } from '../../../../types';
import { BackToInternetBankButton } from '../../partner/BackToPartner/BackToInternetBankButton';
import { Nudge } from '../../../common/nudge/Nudge';

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
      <p>
        {userContributingFuturePayments && (
          <FormattedMessage
            id="success.your.payments"
            values={{
              b: (chunks: string) => <b>{chunks}</b>,
            }}
          />
        )}{' '}
        <br className="d-none d-md-block" />
        {userHasTransferredFunds && (
          <FormattedMessage
            id="success.shares.switched"
            values={{
              b: (chunks: string) => <b>{chunks}</b>,
              transferDate: secondPillarTransferDate().format('DD.MM.YYYY'),
            }}
          />
        )}
      </p>

      <div className="d-flex justify-content-center mt-4">
        <a
          className="btn btn-outline-primary flex-grow-1 flex-md-grow-0"
          href={`/account${config.get('language') === 'en' ? '?language=en' : ''}`}
        >
          <FormattedMessage id="success.backToAccount" />
        </a>
      </div>
      <BackToInternetBankButton />
    </SuccessNotice2>
    <Nudge context="SECOND_PILLAR_MANDATE" />
  </>
);

const mapStateToProps = (state: State) => ({
  userContributingFuturePayments: !!state.exchange.selectedFutureContributionsFundIsin,
  userHasTransferredFunds:
    state.exchange.sourceSelection && state.exchange.sourceSelection.length > 0,
});

const connectToRedux = connect(mapStateToProps);

export default connectToRedux(Success);
