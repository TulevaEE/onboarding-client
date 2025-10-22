import React from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import config from 'react-global-configuration';
import secondPillarTransferDate from '../secondPillarTransferDate';
import { SuccessNotice2 } from '../../common/SuccessNotice2/SuccessNotice2';
import { State } from '../../../../types';
import { BackToInternetBankButton } from '../../partner/BackToPartner/BackToInternetBankButton';
import { useMe } from '../../../common/apiHooks';

interface Props {
  userContributingFuturePayments: boolean;
  userHasTransferredFunds: boolean;
}

export const Success: React.FC<Props> = ({
  userContributingFuturePayments,
  userHasTransferredFunds,
}) => {
  const { data: user, isLoading } = useMe();

  if (isLoading) {
    return null;
  }

  const currentRate = user?.secondPillarPaymentRates.current || 2;
  const pendingRate = user?.secondPillarPaymentRates.pending || null;

  const isMax = pendingRate === 6 || (currentRate === 6 && pendingRate == null);
  const showUpsell = !isMax;

  return (
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

        {showUpsell && (
          <>
            <p>
              <FormattedMessage
                id="success.2ndPillarPaymentUpsell.content"
                values={{
                  b: (chunks: string) => <b>{chunks}</b>,
                }}
              />
            </p>
            <div className="d-flex justify-content-center mt-4">
              <Link
                className="btn btn-primary flex-grow-1 flex-md-grow-0"
                to="/2nd-pillar-payment-rate"
              >
                <FormattedMessage id="success.2ndPillarPaymentUpsell.button" />
              </Link>
            </div>
          </>
        )}

        {!showUpsell && (
          <div className="d-flex justify-content-center mt-4">
            <a
              className="btn btn-outline-primary flex-grow-1 flex-md-grow-0"
              href={`/account${config.get('language') === 'en' ? '?language=en' : ''}`}
            >
              <FormattedMessage id="success.backToAccount" />
            </a>
          </div>
        )}
        <BackToInternetBankButton />
      </SuccessNotice2>
    </>
  );
};

const mapStateToProps = (state: State) => ({
  userContributingFuturePayments: !!state.exchange.selectedFutureContributionsFundIsin,
  userHasTransferredFunds:
    state.exchange.sourceSelection && state.exchange.sourceSelection.length > 0,
});

const connectToRedux = connect(mapStateToProps);

export default connectToRedux(Success);
