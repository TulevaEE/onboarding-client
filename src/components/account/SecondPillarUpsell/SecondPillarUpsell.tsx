import React from 'react';
import './SecondPillarUpsell.scss';
import { useConversion, useMe } from '../../common/apiHooks';
import SecondPillarUpsellCard from './SecondPillarUpsellCard';

const SecondPillarUpsell: React.FC = () => {
  const { data: user } = useMe();
  const { data: conversion } = useConversion();

  const isPartiallyConverted =
    conversion?.secondPillar?.selectionPartial || conversion?.secondPillar?.transfersPartial;
  const hasHighFee = conversion?.secondPillar?.weightedAverageFee || 0 > 0.005;
  const isBeforeRetirementAge = (user?.age || 65) < 65;

  return (
    <>
      {!isPartiallyConverted && hasHighFee && isBeforeRetirementAge ? (
        <SecondPillarUpsellCard />
      ) : (
        <></>
      )}
    </>
  );
};

export default SecondPillarUpsell;
