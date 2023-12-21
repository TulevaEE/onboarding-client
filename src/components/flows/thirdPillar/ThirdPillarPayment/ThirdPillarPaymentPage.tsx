import React from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { State } from '../../../../types';
import Payment from './Payment'; // eslint-disable-line import/no-named-as-default

export const PaymentPage: React.FunctionComponent<{
  noThirdPillar: boolean;
}> = ({ noThirdPillar }) => {
  return (
    <>
      {noThirdPillar && <Redirect to="/3rd-pillar-flow" />}
      <Payment />
    </>
  );
};

const mapStateToProps = (state: State) => ({
  noThirdPillar: !!(state.login.token && state.login.user && !state.login.user.thirdPillarActive),
});
export default connect(mapStateToProps)(PaymentPage);
