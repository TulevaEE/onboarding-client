import React from 'react';
import { FormattedMessage } from 'react-intl';
import { connect, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { finish as finishProcedure } from '../../../TriggerProcedure/utils';
import { State } from '../../../../types';
import success from './success.svg';
import pig from './pig.svg';

interface Props {
  recurringPaymentCount: number;
}

export const BackToPartner: React.FC<Props> = ({ recurringPaymentCount }) => {
  const token = useSelector<State, string>((state) => state.login.token);
  const personalCode = useSelector<State, string>((state) => state.login.user?.personalCode);

  return (
    <>
      <div className="row mt-5">
        <div className="col-12 px-0">
          <div className="alert text-center py-5 bg-very-light-blue border-0">
            <img src={success} alt="" />
            <h2 className="mt-3">
              <FormattedMessage id="thirdPillarBackToPartner.opened" />
            </h2>
            <Link to="/account">
              <FormattedMessage id="thirdPillarBackToPartner.account" />
            </Link>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-12 px-0">
          <div className="alert text-center py-5">
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
                      finishProcedure('newRecurringPayment', undefined, personalCode, token)
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
                onClick={() => finishProcedure('newPayment', undefined, personalCode, token)}
              >
                <FormattedMessage id="thirdPillarBackToPartner.singlePayment.button" />
              </button>
            </div>

            <p className="mt-2 mb-0">
              <small className="text-muted">
                <FormattedMessage id="thirdPillarBackToPartner.payment.subtitle" />
              </small>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

const mapStateToProps = (state: State) => ({
  recurringPaymentCount: state.thirdPillar.recurringPaymentCount,
});

export default connect(mapStateToProps)(BackToPartner);
