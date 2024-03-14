import React from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { State } from '../../../../types';
import Payment from './Payment'; // eslint-disable-line import/no-named-as-default
import { getAuthentication } from '../../../common/authenticationManager';

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

const mapStateToProps = (state: State) => {
  const isAuthenticated = getAuthentication().isAuthenticated();
  const { user } = state.login;
  const noThirdPillar = isAuthenticated && user && !user.thirdPillarActive;

  return { noThirdPillar };
};

export default connect(mapStateToProps)(PaymentPage);
