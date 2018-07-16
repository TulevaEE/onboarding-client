import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Message } from 'retranslate';

import { utils } from '../../';

import './MiniComparison.scss';

import {
  debouncedSalaryChange,
} from '../../../comparison/actions';

export const MiniComparison = ({ salary, onSalaryChange }) => (
  <p className="mb-5">
    <span className="mr-1">
      <Message>new.user.flow.mini.comparison.if.your</Message>
      <strong><Message>new.user.flow.mini.comparison.gross.wage</Message></strong>
      <Message>new.user.flow.mini.comparison.is</Message>
    </span>
    <span className="input-group col-xs-1" id="salary-group">
      <input
        onChange={event => onSalaryChange(Number(event.target.value))}
        type="text"
        required="true"
        className="form-control"
        placeholder="1500"
        id="salary"
        name="salary"
        value={salary}
        aria-describedby="salary-euro"
      />
      <span className="input-group-addon" id="salary-euro">&euro;</span>
    </span>
  </p>
);

const noop = () => null;

MiniComparison.defaultProps = {
  comparison: null,
  loading: false,
  onSalaryChange: noop,
  salary: null,
  activeSourceFund: null,
};

MiniComparison.propTypes = {
  salary: Types.number,
  onSalaryChange: Types.func,
};

const mapStateToProps = state => ({
  comparison: state.comparison ? state.comparison.comparison : null,
  error: state.comparison ? state.comparison.error : null,
  salary: state.comparison.salary,
  loading: state.comparison.loadingComparison,
  activeSourceFund: utils.findWhere(state.exchange.sourceFunds || [],
    element => element.activeFund),
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onSalaryChange: debouncedSalaryChange,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(MiniComparison);
