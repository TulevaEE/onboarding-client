import React, { PropTypes as Types } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Message } from 'retranslate';

import { InfoTooltip } from '../';

import { getComparison } from '../../comparison/actions';

import './Comparison.scss';

export const Comparison = ({ overlayed, comparison, onCancel }) => {
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
                  name={<Message>comparison.expected.index.return.tooltip.header</Message>}
                >
                  <Message>comparison.expected.index.return.tooltip.content</Message>
                </InfoTooltip>
              </span>
            </div>
          </div>
          <div className="row form-inline">
            <div className="col-md-6 form-group">
              <input
                type="number" required="true" className="form-control"
                placeholder="2500" id="salary" name="salary"
              />
            </div>
            <div className="col-md-6 form-group">
              <input
                type="text" required="true" className="form-control"
                placeholder="8" id="return" name="return"
              />
            </div>
          </div>
        </div>

        <div className="row">
          <br />
        </div>

        <div>
          <table className="table">
            <thead>
              <tr>
                <th><Message>comparison.output.calculation</Message></th>
                <th><Message>comparison.output.old.funds</Message></th>
                <th><Message>comparison.output.new.funds</Message></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <Message>comparison.output.calculation.first.row</Message>
                  <InfoTooltip
                    name={<Message>comparison.output.calculation.first.row.tooltip.header</Message>}
                  >
                    <Message>comparison.output.calculation.first.row.tooltip.content</Message>
                  </InfoTooltip>
                </td>
                <td className="output-amount old-fund-fees">44500€</td>
                <td className="output-amount">12873€</td>
              </tr>
              <tr>
                <td><Message>comparison.output.calculation.second.row</Message></td>
                <td className="output-amount">127857€</td>
                {
                  comparison ? (
                    <td className="output-amount new-fund-total">{comparison.amount}</td>
                  ) : ''
                }
              </tr>
            </tbody>
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
  onCancel: noop,
};

Comparison.propTypes = {
  overlayed: Types.bool,
  comparison: Types.shape({}),
  onCancel: Types.func,
};

const mapStateToProps = state => ({
  comparison: state.comparison ? state.comparison.comparison : null,
  error: state.comparison ? state.comparison.error : null,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onSelect: getComparison,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(Comparison);
