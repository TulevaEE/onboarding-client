import React from 'react';
import { Message } from 'retranslate';

const CalculatorLauncher = () => (
  <div>
    <h2 className="mt-2">
      <Message>select.sources.calc.launcher.title</Message>
    </h2>
    <button className="btn btn-secondary mt-4">
      <Message>select.sources.calc.launcher.button</Message>
    </button>
  </div>
);

// const noop = () => null;

CalculatorLauncher.defaultProps = {
};

CalculatorLauncher.propTypes = {
};

export default CalculatorLauncher;
