import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
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

describe('typing a date rather than picking it', () => {
  const onPeriodChange = jest.fn();

  const renderSelector = () =>
    renderWrapped(
      <PeriodSelector from="2025-01-01" to="2025-08-15" onPeriodChange={onPeriodChange} />,
    );

  beforeEach(() => {
    onPeriodChange.mockClear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-08-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // userEvent cannot drive a native date input's segments, so the value is set directly.
  const type = (label: string, value: string) =>
    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.change(screen.getByLabelText(label), { target: { value } });

  const waitForQuiet = () =>
    act(() => {
      jest.advanceTimersByTime(500);
    });

  it('asks for nothing while the year is still half typed', () => {
    renderSelector();

    type('from', '0002-01-15');
    type('from', '0020-01-15');
    type('from', '0201-01-15');

    waitForQuiet();

    expect(onPeriodChange).not.toHaveBeenCalled();
  });

  it('asks once, for the whole date, after the typing stops', () => {
    renderSelector();

    type('from', '0002-01-15');
    type('from', '0020-01-15');
    type('from', '2013-01-15');

    waitForQuiet();

    expect(onPeriodChange).toHaveBeenCalledTimes(1);
    expect(onPeriodChange).toHaveBeenCalledWith('2013-01-15', '2025-08-15');
  });

  it('shows what was typed while it waits', () => {
    renderSelector();

    type('from', '2013-01-15');

    expect(screen.getByLabelText('from')).toHaveValue('2013-01-15');
  });

  it('does not wait once the field is left', () => {
    renderSelector();

    type('from', '2013-01-15');
    fireEvent.blur(screen.getByLabelText('from'), { target: { value: '2013-01-15' } });

    expect(onPeriodChange).toHaveBeenCalledWith('2013-01-15', '2025-08-15');
  });

  it('drops a half typed date when the field is left', () => {
    renderSelector();

    type('from', '0002-01-15');
    fireEvent.blur(screen.getByLabelText('from'), { target: { value: '0002-01-15' } });

    expect(onPeriodChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('from')).toHaveValue('2025-01-01');
  });

  it('leaves the start date alone when the box is only looked at', () => {
    renderWrapped(
      <PeriodSelector
        from={undefined}
        allTimeStartDate="2005-03-14"
        to="2025-08-15"
        onPeriodChange={onPeriodChange}
      />,
    );

    fireEvent.blur(screen.getByLabelText('from'));

    expect(onPeriodChange).not.toHaveBeenCalled();
  });

  it('leaves a half typed date on screen, with the cursor in it, while it is still being typed', () => {
    renderSelector();

    userEvent.click(screen.getByLabelText('from'));
    type('from', '0002-01-15');

    waitForQuiet();

    expect(screen.getByLabelText('from')).toHaveFocus();
    expect(screen.getByLabelText('from')).toHaveValue('0002-01-15');
    expect(onPeriodChange).not.toHaveBeenCalled();
  });

  it('asks for the date once when the typing stops and the field is then left', () => {
    renderSelector();

    type('from', '2013-01-15');

    waitForQuiet();

    fireEvent.blur(screen.getByLabelText('from'));

    expect(onPeriodChange).toHaveBeenCalledTimes(1);
  });

  it('drops a date being typed when the period changes from elsewhere first', () => {
    const { rerender } = renderSelector();

    type('from', '2013-01-15');

    rerender(<PeriodSelector from="2005-03-14" to="2025-08-15" onPeriodChange={onPeriodChange} />);

    waitForQuiet();

    expect(onPeriodChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('from')).toHaveValue('2005-03-14');
  });

  it('reads a cleared start date as all time once the field is left', () => {
    renderSelector();

    type('from', '');
    fireEvent.blur(screen.getByLabelText('from'));

    expect(onPeriodChange).toHaveBeenCalledWith(undefined, '2025-08-15');
  });

  it('keeps the period while the start date is cleared to be typed again', () => {
    renderSelector();

    type('from', '');

    waitForQuiet();

    expect(onPeriodChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('from')).toHaveValue('');
  });

  it('drops a start date typed after the end of the period', () => {
    renderSelector();

    type('from', '2030-06-01');

    waitForQuiet();

    expect(onPeriodChange).not.toHaveBeenCalled();

    fireEvent.blur(screen.getByLabelText('from'));

    expect(onPeriodChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('from')).toHaveValue('2025-01-01');
  });

  it('drops an end date typed before the start of the period', () => {
    renderSelector();

    type('to', '2019-06-01');

    waitForQuiet();

    expect(onPeriodChange).not.toHaveBeenCalled();

    fireEvent.blur(screen.getByLabelText('to'));

    expect(onPeriodChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('to')).toHaveValue('2025-08-15');
  });

  it('asks once for an end date picked inside the period', () => {
    renderSelector();

    type('to', '2025-06-01');

    waitForQuiet();

    fireEvent.blur(screen.getByLabelText('to'));

    expect(onPeriodChange).toHaveBeenCalledTimes(1);
    expect(onPeriodChange).toHaveBeenCalledWith('2025-01-01', '2025-06-01');
  });

  it('puts the end date back when its box is emptied and left', () => {
    renderSelector();

    type('to', '');
    fireEvent.blur(screen.getByLabelText('to'));

    expect(onPeriodChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('to')).toHaveValue('2025-08-15');
  });
});
