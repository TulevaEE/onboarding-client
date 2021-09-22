export interface UserConversion {
  secondPillar: Conversion;
  thirdPillar: Conversion;
}

export interface Amount {
  yearToDate: number;
  total: number;
}

export interface Conversion {
  selectionComplete: boolean;
  transfersComplete: boolean;
  paymentComplete: boolean;
  pendingWithdrawal: boolean;
  contribution: Amount;
  subtraction: Amount;
}

export interface Fund {
  fundManager: { name: string };
  activeFund: boolean;
  name: string;
  pillar: number;
}
