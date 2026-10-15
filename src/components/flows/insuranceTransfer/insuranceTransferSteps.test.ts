import { insuranceTransferSteps } from './insuranceTransferSteps';

describe('insuranceTransferSteps', () => {
  test('asks for contact details and the selection before the request when both are missing', () => {
    expect(
      insuranceTransferSteps({ contactDetailsMissing: true, selectionComplete: false }),
    ).toEqual(['contact-details', 'selection', 'request', 'done']);
  });

  test('asks only for the selection when contact details are up to date', () => {
    expect(
      insuranceTransferSteps({ contactDetailsMissing: false, selectionComplete: false }),
    ).toEqual(['selection', 'request', 'done']);
  });

  test('asks only for contact details when Tuleva III pillar is already selected', () => {
    expect(
      insuranceTransferSteps({ contactDetailsMissing: true, selectionComplete: true }),
    ).toEqual(['contact-details', 'request', 'done']);
  });

  test('goes straight to the request when nothing is missing', () => {
    expect(
      insuranceTransferSteps({ contactDetailsMissing: false, selectionComplete: true }),
    ).toEqual(['request', 'done']);
  });
});
