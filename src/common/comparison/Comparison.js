import React, { PropTypes as Types } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Message } from 'retranslate';

import { InfoTooltip, Loader } from '../';

import {
  changeSalary,
  changeRate,
} from '../../comparison/actions';

import './Comparison.scss';

export const Comparison = ({ overlayed, comparison, rate, salary, loading,
                              onSalaryChange, onRateChange, onCancel }) => {
  if (loading) {
    return <Loader className="align-middle" />;
  }
  const content = (
    <div>
      <div className="px-col mb-4">
        <div>
          <p className="mb-4 mt-5 header"><Message>comparison.header</Message></p>
          <p><Message>comparison.intro</Message></p>
          <p><Message>comparison.call.to.action</Message></p>
        </div>
        <div className="calculator-from">
          <div className="row form-inline">
            <div className="col-md-6 form-header">
              <span><Message>comparison.your.gross.salary.today</Message></span>
            </div>
            <div className="col-md-6 form-header">
              <span><Message>comparison.expected.index.return</Message>
                <InfoTooltip
                  name="TODO:comparison.expected.index.return.tooltip.header"
                >
                  <Message>comparison.expected.index.return.tooltip.content</Message>
                </InfoTooltip>
              </span>
            </div>
          </div>
          <div className="row form-inline">
            <div className="col-md-6 form-group">
              <input
                onChange={event => onSalaryChange(event.target.value)}
                type="number" required="true" className="form-control"
                placeholder="1500" id="salary" name="salary" value={salary}
              />
            </div>
            <div className="col-md-6 form-group">
              <input
                onChange={event => onRateChange(event.target.value)}
                type="text" required="true" className="form-control"
                placeholder="8" id="return" name="return" value={rate}
              />
            </div>
          </div>
        </div>
        <div className="row" />
        <div>
          <table className="table">
            <thead>
              <tr>
                <th><Message>comparison.output.calculation</Message></th>
                <th><Message>comparison.output.old.funds</Message></th>
                <th><Message>comparison.output.new.funds</Message></th>
              </tr>
            </thead>
            {
              comparison ? (
                <tbody>
                  <tr>
                    <td>
                      <Message>comparison.output.calculation.first.row</Message>
                      <InfoTooltip
                        name="TODO: comparison.output.calculation.first.row.tooltip.header"
                      >
                        <Message>comparison.output.calculation.first.row.tooltip.content</Message>
                      </InfoTooltip>
                    </td>
                    <td className="output-amount old-fund-fees">{comparison.currentFundFee}€</td>
                    <td className="output-amount">{comparison.newFundFee}€</td>
                  </tr>
                  <tr>
                    <td><Message>comparison.output.calculation.second.row</Message></td>
                    <td className="output-amount">{comparison.currentFundFutureValue}€</td>
                    <td className="output-amount new-fund-total">
                      {comparison.newFundFutureValue}€
                    </td>
                  </tr>
                </tbody>
              ) : ''
            }
          </table>
        </div>
      </div>
    </div>
  );

  if (overlayed) {
    return (
      <div className="tv-modal">
        <div className="container">
          <div className="row mt-4 pt-4 justify-content-center">
            {content}
            <div className="row">
              <button className="btn btn-secondary mt-4" onClick={onCancel}>
                <Message>comparison.close</Message>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="row mt-4 pt-4 justify-content-center">
      {content}
    </div>
  );
};

const noop = () => null;

Comparison.defaultProps = {
  overlayed: false,
  comparison: null,
  loading: false,
  onSalaryChange: noop,
  onRateChange: noop,
  onCancel: noop,
  rate: null,
  salary: null,
};

Comparison.propTypes = {
  overlayed: Types.bool,
  comparison: Types.shape({}),
  rate: Types.number,
  salary: Types.number,
  loading: Types.bool,
  onSalaryChange: Types.func,
  onRateChange: Types.func,
  onCancel: Types.func,
};

const mapStateToProps = state => ({
  comparison: state.comparison ? state.comparison.comparison : null,
  error: state.comparison ? state.comparison.error : null,
  rate: state.comparison.rate,
  salary: state.comparison.salary,
  loading: state.comparison.loadingComparison,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onSalaryChange: changeSalary,
  onRateChange: changeRate,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(Comparison);
