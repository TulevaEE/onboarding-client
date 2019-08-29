import React, { FC } from 'react';
import { withTranslations } from 'retranslate';
import Select from './Select';

interface Option {
  value: any;
  label: string;
}

interface ReturnComparisonDateSelectProps {
  options: Option[];
  selectedDate: string;
  translations: {
    translate: Function;
  };
  onChange: (...args: any[]) => void;
}

export const ReturnComparisonDateSelect: FC<ReturnComparisonDateSelectProps> = ({
  options,
  selectedDate,
  translations: { translate },
  onChange,
}) => (
  <Select
    options={options.map(option => ({
      ...option,
      label: translate(option.label),
    }))}
    selected={selectedDate}
    onChange={onChange}
  />
);

export default withTranslations(ReturnComparisonDateSelect);
