import React from 'react';
import { PropTypes as Types } from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Message } from 'retranslate';
import Comparison from '../';

import { show as showComparison, hide as hideComparison } from '../../../comparison/actions';

import './ComparisonWidget.css';

export const ComparisonWidget = ({ comparisonVisible, onShowComparison, onHideComparison }) => (
  <div>
    {comparisonVisible ? <Comparison overlayed onClose={onHideComparison} /> : ''}
    <div className="comparison-widget text-center">
      <div className="comparison-widget-message mt-3">
        <Message>select.sources.comparison.intro</Message>
      </div>
      <button className="btn btn-primary mt-3 mb-3" onClick={onShowComparison}>
        <Message>select.sources.show.comparison</Message>
      </button>
    </div>
  </div>
);

const noop = () => null;

ComparisonWidget.defaultProps = {
  comparisonVisible: false,
  onShowComparison: noop,
  onHideComparison: noop,
};

ComparisonWidget.propTypes = {
  comparisonVisible: Types.bool,
  onShowComparison: Types.func,
  onHideComparison: Types.func,
};

const mapStateToProps = state => ({
  comparisonVisible: state.comparison.visible,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onShowComparison: showComparison,
      onHideComparison: hideComparison,
    },
    dispatch,
  );

const connectToRedux = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default connectToRedux(ComparisonWidget);
