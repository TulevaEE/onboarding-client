import { Currency } from '.';

export type Listing = {
  id: number; // TODO UUID?
  type: ListingType;
  units: number;
  pricePerUnit: number;
  currency: Currency;
  expiryTime: string;
  createdTime: string;
};

export type ListingType = 'BUY' | 'SELL';
