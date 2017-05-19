import React, { PropTypes as Types } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Message } from 'retranslate';

import { InfoTooltip, utils } from '../../';

import './MiniComparison.scss';

import {
  debouncedSalaryChange,
} from '../../../comparison/actions';

export const MiniComparison = ({ comparison, salary, loading, onSalaryChange,
  activeSourceFund }) => (
    <p className="mb-5">
      <span className="mr-1"><Message>Kui sinu </Message>
        <strong><Message>brutopalk</Message></strong><Message> on</Message></span>
      <span className="input-group col-xs-1" id="salary-group">
        <input
          onChange={event => onSalaryChange(Number(event.target.value))}
          type="text" required="true" className="form-control"
          placeholder="1500" id="salary" name="salary" value={salary}
          aria-describedby="salary-euro"
        />
        <span className="input-group-addon" id="salary-euro">&euro;</span>
      </span>
      <span className="ml-1"><Message>ja sa jätkad oma raha kogumist</Message>
        <span> &quot;<strong>{activeSourceFund.name}</strong>&quot; </span>
        <Message>fondis, maksad oma tööelu jooksul </Message>
        <strong>{activeSourceFund.managerName}</strong>&apos;le<Message> tasudena </Message></span>
      {
        loading ? (
          ''
        ) : <span>
          {
            comparison ? (
              <span>
                <strong className="red">
                  <span>{Math.round(comparison.currentFundFee).toLocaleString('et-EE')}&nbsp;&euro;</span>
                </strong>
                <span>. </span>
                <InfoTooltip name="comparison.mini.tooltip">
                  <Message>Selgitus miks...</Message></InfoTooltip>
              </span>
            ) : ''
          }
        </span>
      }
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
  comparison: Types.shape({}),
  salary: Types.number,
  loading: Types.bool,
  onSalaryChange: Types.func,
  activeSourceFund: Types.shape({}),
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
