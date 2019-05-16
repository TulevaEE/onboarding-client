import React from 'react';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

const ConfirmThirdPillarMandate = () => <div>[placeholder]</div>;

ConfirmThirdPillarMandate.propTypes = {};

ConfirmThirdPillarMandate.defaultProps = {};

const mapStateToProps = state => ({
  monthlyContribution: state.thirdPillar.monthlyContribution,
  exchangeExistingUnits: state.thirdPillar.exchangeExistingUnits,
});

const mapDispatchToProps = dispatch => bindActionCreators({}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ConfirmThirdPillarMandate);
