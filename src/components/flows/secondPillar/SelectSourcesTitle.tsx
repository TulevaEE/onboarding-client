import { FormattedMessage } from 'react-intl';
import { useConversion } from '../../common/apiHooks';
import { Conversion } from '../../common/apiModels';

const contributesToTulevaWithSavingsElsewhere = (conversion: Conversion) =>
  conversion.selectionComplete && !conversion.transfersComplete;

export const SelectSourcesTitle = () => {
  const { data: conversion, isLoading } = useConversion();
  if (isLoading) {
    return null;
  }
  return conversion && contributesToTulevaWithSavingsElsewhere(conversion.secondPillar) ? (
    <FormattedMessage id="steps.select-sources.rest" />
  ) : (
    <FormattedMessage id="steps.select-sources" />
  );
};
