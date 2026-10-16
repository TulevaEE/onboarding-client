import { insuranceTransferSteps, skipsAStepToDo } from './insuranceTransferSteps';

describe('insuranceTransferSteps', () => {
  test('asks for contact details and the selection before the request when both are missing', () => {
    expect(
      insuranceTransferSteps({ contactDetailsMissing: true, selectionComplete: false }),
    ).toEqual(['contact-details', 'selection', 'request']);
  });

  test('asks only for the selection when contact details are up to date', () => {
    expect(
      insuranceTransferSteps({ contactDetailsMissing: false, selectionComplete: false }),
    ).toEqual(['selection', 'request']);
  });

  test('asks only for contact details when Tuleva III pillar is already selected', () => {
    expect(
      insuranceTransferSteps({ contactDetailsMissing: true, selectionComplete: true }),
    ).toEqual(['contact-details', 'request']);
  });

  test('goes straight to the request when nothing is missing', () => {
    expect(
      insuranceTransferSteps({ contactDetailsMissing: false, selectionComplete: true }),
    ).toEqual(['request']);
  });
});

describe('skipsAStepToDo', () => {
  test('is true when the request is opened before the selection is signed', () => {
    expect(skipsAStepToDo(['selection', 'request'], 'request')).toBe(true);
  });

  test('is true when the selection is opened before the contact details are saved', () => {
    expect(skipsAStepToDo(['contact-details', 'selection', 'request'], 'selection')).toBe(true);
  });

  test('is false when opened at the first step to do', () => {
    expect(skipsAStepToDo(['selection', 'request'], 'selection')).toBe(false);
  });

  test('is false when nothing is to do before the request', () => {
    expect(skipsAStepToDo(['request'], 'request')).toBe(false);
  });
});
