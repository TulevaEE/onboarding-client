import debounce from 'lodash/debounce';
import React, { PropTypes as Types } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Message } from 'retranslate';

import { InfoTooltip, Loader } from '../';

import {
  changeSalary,
  changeRate,
  getComparison,
} from '../../comparison/actions';

import './Comparison.scss';

import closeImage from './btn-close.svg';

const debounceTime = 500;

function debouncedSalaryChange(salary) {
  return (dispatch) => {
    dispatch(changeSalary(salary));
    const debouncedDispatch = debounce(dispatch, debounceTime);
    debouncedDispatch(getComparison());
  };
}

function debouncedRateChange(rate) {
  return (dispatch) => {
    dispatch(changeRate(rate));
    const debouncedDispatch = debounce(dispatch, debounceTime);
    debouncedDispatch(getComparison());
  };
}

export const Comparison = ({ overlayed, comparison, rate, salary, loading,
                              onSalaryChange, onRateChange, onClose }) => {
  const content = (
    <div>
      <div className="px-col mb-4">
        <div>
          <p className="mb-4"><Message>comparison.header</Message></p>
          <p><Message>comparison.intro</Message></p>
          <p><Message>comparison.call.to.action</Message></p>
        </div>
        <div>
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
                  onChange={event => onSalaryChange(Number(event.target.value))}
                  type="number" required="true" className="form-control"
                  placeholder="1500" id="salary" name="salary" value={salary}
                />
              </div>
              <div className="col-md-6 form-group">
                <input
                  onChange={event => onRateChange(Number(event.target.value) / 100)}
                  type="number" required="true" className="form-control"
                  placeholder="8" id="return" name="return" value={Math.round(rate * 100)}
                />
              </div>
            </div>
          </div>
          <div className="row" />
          {
            loading ? (
              <Loader className="align-middle mt-4" />
            ) : (
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
                              <Message>
                              comparison.output.calculation.first.row.tooltip.content
                            </Message>
                            </InfoTooltip>
                          </td>
                          <td className="output-amount old-fund-fees">
                            {Math.round(comparison.currentFundFee)}
                          </td>
                          <td className="output-amount">{Math.round(comparison.newFundFee)}</td>
                        </tr>
                        <tr>
                          <td><Message>comparison.output.calculation.second.row</Message></td>
                          <td className="output-amount">
                            {Math.round(comparison.currentFundFutureValue)}
                          </td>
                          <td className="output-amount new-fund-total">
                            {Math.round(comparison.newFundFutureValue)}
                          </td>
                        </tr>
                      </tbody>
                    ) : ''
                  }
                </table>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );

  if (overlayed) {
    return (
      <div className="tv-modal">
        <div className="container">
          <div className="row justify-content-end align-items-center mt-4">
            <div className="col-3">
              <button className="btn comparison-close" onClick={onClose}>
                <span className="mr-2"><Message>comparison.close</Message></span>
                <img src={closeImage} alt="Close" className="comparison-close__image" />
              </button>
            </div>
          </div>
          <div className="row mt-4 pt-4 justify-content-center">
            {content}
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
  onClose: noop,
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
  onClose: Types.func,
};

const mapStateToProps = state => ({
  comparison: state.comparison ? state.comparison.comparison : null,
  error: state.comparison ? state.comparison.error : null,
  rate: state.comparison.rate,
  salary: state.comparison.salary,
  loading: state.comparison.loadingComparison,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onSalaryChange: debouncedSalaryChange,
  onRateChange: debouncedRateChange,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(Comparison);
