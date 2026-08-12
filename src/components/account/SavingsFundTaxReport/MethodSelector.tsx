import React from 'react';
import { FormattedMessage } from 'react-intl';
import { PillButton } from '../../common/PillButton';
import { CostBasisMethod } from '../../common/apiModels';

const METHODS: CostBasisMethod[] = ['FIFO', 'WEIGHTED_AVERAGE'];

export const MethodSelector: React.FunctionComponent<{
  method: CostBasisMethod;
  onMethodChange: (method: CostBasisMethod) => void;
}> = ({ method, onMethodChange }) => (
  <div className="d-flex flex-wrap gap-2 align-items-center">
    <span className="text-body-secondary me-1">
      <FormattedMessage id="savingsFund.statement.tax.method" />
    </span>
    {METHODS.map((option) => (
      <PillButton
        key={option}
        selected={method === option}
        pressed={method === option}
        onClick={() => onMethodChange(option)}
      >
        {option === 'FIFO' ? (
          <FormattedMessage id="savingsFund.statement.tax.methodFifo" />
        ) : (
          <FormattedMessage id="savingsFund.statement.tax.methodAverage" />
        )}
      </PillButton>
    ))}
  </div>
);
