export const HIGH_FEE_FROM = 0.003;

export const isLowFee = (ongoingChargesFigure: number) => ongoingChargesFigure < HIGH_FEE_FROM;

export const wholeEuros = (amount: number) => Math.round(Number(amount.toPrecision(12)));
