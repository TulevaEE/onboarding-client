import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWrapped } from '../../../test/utils';
import { PeriodSelector } from './PeriodSelector';

describe('the periods someone can ask for by name', () => {
  const onPeriodChange = jest.fn();

  const clickPreset = (name: string) => {
    renderWrapped(
      <PeriodSelector from={undefined} to="2025-08-15" onPeriodChange={onPeriodChange} />,
    );

    userEvent.click(screen.getByRole('button', { name }));
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-08-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('asks for this year from its first day up to today', () => {
    clickPreset('This year');

    expect(onPeriodChange).toHaveBeenCalledWith('2025-01-01', '2025-08-15');
  });

  it('asks for last year from its first day to its last', () => {
    clickPreset('Last year');

    expect(onPeriodChange).toHaveBeenCalledWith('2024-01-01', '2024-12-31');
  });

  it('asks for the twelve months behind today', () => {
    clickPreset('12 months');

    expect(onPeriodChange).toHaveBeenCalledWith('2024-08-15', '2025-08-15');
  });

  it('asks for all time without naming a start the client would have to guess', () => {
    clickPreset('All time');

    expect(onPeriodChange).toHaveBeenCalledWith(undefined, '2025-08-15');
  });
});
