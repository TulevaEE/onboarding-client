import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect, useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { finish as finishProcedure } from '../../../TriggerProcedure/utils';
import { State } from '../../../../types';
import pig from './pig.svg';
import { SuccessNotice2 } from '../../common/SuccessNotice2/SuccessNotice2';
import { Notice } from '../../common/Notice/Notice';
import { AuthenticationPrincipal } from '../../../common/apiModels';

import { withUpdatableAuthenticationPrincipal } from '../../../common/updatableAuthenticationPrincipal';

interface Props {
  recurringPaymentCount: number;
}

export const BackToPartner: React.FC<Props> = ({ recurringPaymentCount }) => {
  const authenticationPrincipal = withUpdatableAuthenticationPrincipal(
    useSelector<State, AuthenticationPrincipal>((state) => state.login.authenticationPrincipal),
    useDispatch(),
  );
  const personalCode = useSelector<State, string>((state) => state.login.user?.personalCode);

  return (
    <>
      <SuccessNotice2>
        <h2 className="mt-3">
          <FormattedMessage id="thirdPillarBackToPartner.opened" />
        </h2>
        <Link to="/account">
          <FormattedMessage id="thirdPillarBackToPartner.account" />
        </Link>
      </SuccessNotice2>

      <Notice>
        <img src={pig} alt="" />

        {recurringPaymentCount >= 1 ? (
          <>
            <h2 className="mt-3">
              <FormattedMessage id="thirdPillarBackToPartner.automated" />
            </h2>
            <p className="mt-3">
              <FormattedMessage id="thirdPillarBackToPartner.automated.subtitle" />
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-3">
              <FormattedMessage id="thirdPillarBackToPartner.automateNext" />
            </h2>
            <p className="mt-3">
              <FormattedMessage id="thirdPillarBackToPartner.automateNext.subtitle" />
            </p>
            <div className="d-flex justify-content-center mt-4">
              <button
                type="button"
                className="btn btn-primary flex-grow-1 flex-md-grow-0"
                onClick={() =>
                  finishProcedure(
                    'newRecurringPayment',
                    undefined,
                    personalCode,
                    authenticationPrincipal,
                  )
                }
              >
                <FormattedMessage id="thirdPillarBackToPartner.recurringPayment.button" />
              </button>
            </div>
          </>
        )}
        <div className="d-flex justify-content-center mt-2">
          <button
            type="button"
            className="btn btn-outline-primary flex-grow-1 flex-md-grow-0"
            onClick={() =>
              finishProcedure('newPayment', undefined, personalCode, authenticationPrincipal)
            }
          >
            <FormattedMessage id="thirdPillarBackToPartner.singlePayment.button" />
          </button>
        </div>

        <p className="mt-2 mb-0">
          <small className="text-muted">
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
