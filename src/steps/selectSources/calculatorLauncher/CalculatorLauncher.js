import React, { PropTypes as Types } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, ModalBody } from 'reactstrap';
import { Message } from 'retranslate';
import Calculator from '../calculator';
import closeButton from './close-button.svg';

import './CalculatorLauncher.scss';

import {
  toggleCalculatorModal,
} from '../../../exchange/actions';

export const CalculatorLauncher = ({
  isCalculatorModalOpen,
  onToggleCalculatorModal,
}) => (
  <div>
    <h2 className="mt-2">
      <Message>select.sources.calc.launcher.title</Message>
    </h2>
    <button
      className="btn btn-secondary mt-4"
      onClick={() => onToggleCalculatorModal()}
    >
      <Message>select.sources.calc.launcher.button</Message>
    </button>

    <Modal
      isOpen={isCalculatorModalOpen}
      toggle={onToggleCalculatorModal} size="xlg" wrapClassName="calculator-modal"
    >
      <ModalBody>
        <div className="tv-calc-launcher">
          <img
            src={closeButton}
            alt="close"
            className="tv-calc-launcher__close"
          />
          <Calculator />
        </div>
      </ModalBody>
    </Modal>
  </div>
);

const noop = () => null;

CalculatorLauncher.defaultProps = {
  isCalculatorModalOpen: false,
  onToggleCalculatorModal: noop,
};

CalculatorLauncher.propTypes = {
  isCalculatorModalOpen: Types.bool,
  onToggleCalculatorModal: Types.func,
};

const mapStateToProps = state => ({
  isCalculatorModalOpen: state.exchange.isCalculatorModalOpen,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  onToggleCalculatorModal: toggleCalculatorModal,
}, dispatch);

const connectToRedux = connect(mapStateToProps, mapDispatchToProps);

export default connectToRedux(CalculatorLauncher);
