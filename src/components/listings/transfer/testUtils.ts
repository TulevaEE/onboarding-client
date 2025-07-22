// eslint-disable-next-line import/no-extraneous-dependencies
import { screen } from '@testing-library/react';

export const getBuyerDetailsSection = async () => screen.findByTestId('buyer-details');
export const getSellerDetailsSection = async () => screen.findByTestId('seller-details');
