import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect, useSelector } from 'react-redux';
import { finish as finishProcedure } from '../../../TriggerProcedure/utils';
import { State } from '../../../../types';
import pig from './pig.svg';
import { SuccessNotice2 } from '../../common/SuccessNotice2/SuccessNotice2';
import { Notice } from '../../common/Notice/Notice';
import { BackToInternetBankButton } from './BackToInternetBankButton';

interface Props {
  recurringPaymentCount: number;
}

export const BackToPartner: React.FC<Props> = ({ recurringPaymentCount }) => {
  const personalCode = useSelector<State, string>((state) => state.login.user?.personalCode);

  return (
    <>
      <SuccessNotice2>
        <h2 className="mt-3">
          <FormattedMessage id="thirdPillarBackToPartner.opened" />
        </h2>
        <div className="d-flex justify-content-center mt-4">
          <a className="btn btn-outline-primary flex-grow-1 flex-md-grow-0" href="/account">
            <FormattedMessage id="thirdPillarBackToPartner.account" />
          </a>
        </div>
        <BackToInternetBankButton />
      </SuccessNotice2>

      <Notice>
        <img src={pig} alt="" />

        {recurringPaymentCount < 1 ? (
          <>
            <h2 className="mt-3">
              <FormattedMessage id="thirdPillarBackToPartner.automateNext" />
            </h2>
            <p className="mt-3">
              <FormattedMessage id="thirdPillarBackToPartner.automateNext.subtitle" />
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-3">
              <FormattedMessage id="thirdPillarBackToPartner.automated" />
            </h2>
            <p className="mt-3">
              <FormattedMessage id="thirdPillarBackToPartner.automated.subtitle" />
            </p>
          </>
        )}
        {recurringPaymentCount < 1 ? (
          <div className="d-flex justify-content-center mt-4">
            <button
              type="button"
              className="btn btn-primary btn-default flex-grow-1 flex-md-grow-0"
              onClick={() => finishProcedure('newRecurringPayment', undefined, personalCode)}
            >
              <FormattedMessage id="thirdPillarBackToPartner.recurringPayment.button" />
            </button>
          </div>
        ) : (
          ''
        )}
        <div className="d-flex justify-content-center mt-2">
          <button
            type="button"
            className="btn btn-outline-primary flex-grow-1 flex-md-grow-0"
            onClick={() => finishProcedure('newPayment', undefined, personalCode)}
          >
            <FormattedMessage id="thirdPillarBackToPartner.singlePayment.button" />
          </button>
        </div>
        <p className="mt-2 mb-0">
          <small className="text-body-secondary">
            <FormattedMessage id="thirdPillarBackToPartner.payment.subtitle" />
          </small>
        </p>
      </Notice>
    </>
  );
};

const mapStateToProps = (state: State) => ({
  recurringPaymentCount: state.thirdPillar.recurringPaymentCount,
});

export default connect(mapStateToProps)(BackToPartner);
