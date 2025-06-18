import { Currency } from '.';

export type Listing = {
  id: number; // TODO UUID?
  type: 'BUY' | 'SELL';
  units: number;
  pricePerUnit: number;
  currency: Currency;
  expiryTime: string;
  createdTime: string;
};
