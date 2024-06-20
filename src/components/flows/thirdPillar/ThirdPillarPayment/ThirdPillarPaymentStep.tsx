import React from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { State } from '../../../../types';
import { Payment } from './Payment';

export const ThirdPillarPaymentStep: React.FunctionComponent<{
  previousPath: string;
  signedMandateId: number;
  isUserConverted: boolean;
}> = ({ previousPath, signedMandateId, isUserConverted }) => (
  <>
    {!signedMandateId && !isUserConverted && <Redirect to={previousPath} />}
    <Payment />
  </>
);

const mapStateToProps = (state: State) => ({
  signedMandateId: state.thirdPillar.signedMandateId,
  isUserConverted:
    state.thirdPillar.exchangeableSourceFunds &&
    !state.thirdPillar.exchangeableSourceFunds.length &&
    state.login.userConversion &&
    state.login.userConversion.thirdPillar.selectionComplete,
});
export default connect(mapStateToProps)(ThirdPillarPaymentStep);
