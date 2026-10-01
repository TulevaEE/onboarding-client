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

describe('the period a preset put in effect', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-08-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('is the one a screen reader is told is pressed', () => {
    renderWrapped(<PeriodSelector from={undefined} to="2025-08-15" onPeriodChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'All time' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'This year' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});

describe('the dates in the period boxes', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-08-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('read day, month and year whatever the browser is set to', () => {
    renderWrapped(<PeriodSelector from="2025-01-01" to="2025-08-15" onPeriodChange={() => {}} />);

    expect(screen.getByLabelText('From')).toHaveValue('01.01.2025');
    expect(screen.getByLabelText('To')).toHaveValue('15.08.2025');
  });

  it('show the format they expect', () => {
    renderWrapped(<PeriodSelector from={undefined} to="2025-08-15" onPeriodChange={() => {}} />);

    expect(screen.getByLabelText('From')).toHaveAttribute('placeholder', 'dd.mm.yyyy');
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

  const type = (label: string, value: string) =>
    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.change(screen.getByLabelText(label), { target: { value } });

  const waitForQuiet = () =>
    act(() => {
      jest.advanceTimersByTime(500);
    });

  it('asks for nothing while the year is still half typed', () => {
    renderSelector();

    type('From', '15.01.2');
    type('From', '15.01.20');
    type('From', '15.01.201');

    waitForQuiet();

    expect(onPeriodChange).not.toHaveBeenCalled();
  });

  it('asks for nothing for a year before 1900', () => {
    renderSelector();

    type('From', '15.01.0201');

    waitForQuiet();

    expect(onPeriodChange).not.toHaveBeenCalled();
  });

  it('asks once, for the whole date, after the typing stops', () => {
    renderSelector();

    type('From', '15.01.2');
    type('From', '15.01.20');
    type('From', '15.01.201');
    type('From', '15.01.2013');

    waitForQuiet();

    expect(onPeriodChange).toHaveBeenCalledTimes(1);
    expect(onPeriodChange).toHaveBeenCalledWith('2013-01-15', '2025-08-15');
  });

  it('waits out a day still being typed', () => {
    renderSelector();

    type('From', '1.01.2025');
    type('From', '15.01.2025');

    waitForQuiet();

    expect(onPeriodChange).toHaveBeenCalledTimes(1);
    expect(onPeriodChange).toHaveBeenCalledWith('2025-01-15', '2025-08-15');
  });

  it('asks for nothing when the typing pauses on a day still one digit short', () => {
    renderSelector();

    type('From', '1.01.2025');

    waitForQuiet();

    expect(onPeriodChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('From')).toHaveValue('1.01.2025');
  });

  it('takes a date typed without leading zeros once Enter is pressed', () => {
    renderSelector();

    type('From', '5.3.2025');
    userEvent.type(screen.getByLabelText('From'), '{enter}');

    expect(onPeriodChange).toHaveBeenCalledTimes(1);
    expect(onPeriodChange).toHaveBeenCalledWith('2025-03-05', '2025-08-15');
  });

  it('takes a date pasted with spaces around it', () => {
    renderSelector();

    type('From', ' 15.01.2013 ');

    waitForQuiet();

    expect(onPeriodChange).toHaveBeenCalledWith('2013-01-15', '2025-08-15');
  });

  it('takes a date typed without leading zeros', () => {
    renderSelector();

    type('From', '5.3.2025');
    fireEvent.blur(screen.getByLabelText('From'));

    expect(onPeriodChange).toHaveBeenCalledWith('2025-03-05', '2025-08-15');
  });

  it('shows what was typed while it waits', () => {
    renderSelector();

    type('From', '15.01.2013');

    expect(screen.getByLabelText('From')).toHaveValue('15.01.2013');
  });

  it('does not wait once the field is left', () => {
    renderSelector();

    type('From', '15.01.2013');
    fireEvent.blur(screen.getByLabelText('From'));

    expect(onPeriodChange).toHaveBeenCalledWith('2013-01-15', '2025-08-15');
  });

  it('drops a half typed date when the field is left', () => {
    renderSelector();

    type('From', '15.01.20');
    fireEvent.blur(screen.getByLabelText('From'));

    expect(onPeriodChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('From')).toHaveValue('01.01.2025');
  });

  it('drops a date written month first when the field is left', () => {
    renderSelector();

    type('From', '03/15/2025');
    fireEvent.blur(screen.getByLabelText('From'));

    expect(onPeriodChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('From')).toHaveValue('01.01.2025');
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

    fireEvent.blur(screen.getByLabelText('From'));

    expect(onPeriodChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('From')).toHaveValue('14.03.2005');
  });

  it('leaves a half typed date on screen, with the cursor in it, while it is still being typed', () => {
    renderSelector();

    userEvent.click(screen.getByLabelText('From'));
    type('From', '15.01.20');

    waitForQuiet();

    expect(screen.getByLabelText('From')).toHaveFocus();
    expect(screen.getByLabelText('From')).toHaveValue('15.01.20');
    expect(onPeriodChange).not.toHaveBeenCalled();
  });

  it('asks for the date once when the typing stops and the field is then left', () => {
    renderSelector();

    type('From', '15.01.2013');

    waitForQuiet();

    fireEvent.blur(screen.getByLabelText('From'));

    expect(onPeriodChange).toHaveBeenCalledTimes(1);
  });

  it('drops a date being typed when the period changes from elsewhere first', () => {
    const { rerender } = renderSelector();

    type('From', '15.01.2013');

    rerender(<PeriodSelector from="2005-03-14" to="2025-08-15" onPeriodChange={onPeriodChange} />);

    waitForQuiet();

    expect(onPeriodChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('From')).toHaveValue('14.03.2005');
  });

  it('reads a cleared start date as all time once the field is left', () => {
    renderSelector();

    type('From', '');
    fireEvent.blur(screen.getByLabelText('From'));

    expect(onPeriodChange).toHaveBeenCalledWith(undefined, '2025-08-15');
  });

  it('keeps the period while the start date is cleared to be typed again', () => {
    renderSelector();

    type('From', '');

    waitForQuiet();

    expect(onPeriodChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('From')).toHaveValue('');
  });

  it('drops a start date typed after the end of the period', () => {
    renderSelector();

    type('From', '01.06.2030');

    waitForQuiet();

    expect(onPeriodChange).not.toHaveBeenCalled();

    fireEvent.blur(screen.getByLabelText('From'));

    expect(onPeriodChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('From')).toHaveValue('01.01.2025');
  });

  it('drops an end date typed before the start of the period', () => {
    renderSelector();

    type('To', '01.06.2019');

    waitForQuiet();

    expect(onPeriodChange).not.toHaveBeenCalled();

    fireEvent.blur(screen.getByLabelText('To'));

    expect(onPeriodChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('To')).toHaveValue('15.08.2025');
  });

  it('asks once for an end date typed inside the period', () => {
    renderSelector();

    type('To', '01.06.2025');

    waitForQuiet();

    fireEvent.blur(screen.getByLabelText('To'));

    expect(onPeriodChange).toHaveBeenCalledTimes(1);
    expect(onPeriodChange).toHaveBeenCalledWith('2025-01-01', '2025-06-01');
  });

  it('puts the end date back when its box is emptied and left', () => {
    renderSelector();

    type('To', '');
    fireEvent.blur(screen.getByLabelText('To'));

    expect(onPeriodChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText('To')).toHaveValue('15.08.2025');
  });
});

describe('picking a date from the calendar', () => {
  const onPeriodChange = jest.fn();
  const showPicker = jest.fn();

  const renderSelector = () =>
    renderWrapped(
      <PeriodSelector from="2025-01-01" to="2025-08-15" onPeriodChange={onPeriodChange} />,
    );

  const browserWithCalendar = () => {
    HTMLInputElement.prototype.showPicker = showPicker;
  };

  const browserWithoutCalendar = () => {
    HTMLInputElement.prototype.showPicker = () => {
      throw new DOMException('The picker cannot be shown here', 'NotSupportedError');
    };
  };

  const openedCalendar = (): HTMLInputElement => {
    const [calendar] = showPicker.mock.instances;
    if (!calendar) {
      throw new Error('No calendar was opened');
    }
    return calendar;
  };

  const pick = (date: string) =>
    // eslint-disable-next-line testing-library/prefer-user-event
    fireEvent.change(openedCalendar(), { target: { value: date } });

  const originalShowPicker = HTMLInputElement.prototype.showPicker;

  beforeEach(() => {
    onPeriodChange.mockClear();
    showPicker.mockClear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-08-15T12:00:00Z'));
  });

  afterEach(() => {
    HTMLInputElement.prototype.showPicker = originalShowPicker;
    jest.useRealTimers();
  });

  it('asks at once for the start date picked', () => {
    browserWithCalendar();
    renderSelector();

    userEvent.click(screen.getByRole('button', { name: 'Choose start date from calendar' }));
    pick('2025-03-05');

    expect(onPeriodChange).toHaveBeenCalledTimes(1);
    expect(onPeriodChange).toHaveBeenCalledWith('2025-03-05', '2025-08-15');
  });

  it('asks for nothing for a year before 1900 picked from the calendar', () => {
    browserWithCalendar();
    renderSelector();

    userEvent.click(screen.getByRole('button', { name: 'Choose start date from calendar' }));
    pick('0005-03-05');

    expect(onPeriodChange).not.toHaveBeenCalled();
  });

  it('asks at once for the end date picked', () => {
    browserWithCalendar();
    renderSelector();

    userEvent.click(screen.getByRole('button', { name: 'Choose end date from calendar' }));
    pick('2025-06-30');

    expect(onPeriodChange).toHaveBeenCalledWith('2025-01-01', '2025-06-30');
  });

  it('takes a tap on the calendar icon on the browser date field itself, which opens its own calendar', () => {
    browserWithCalendar();
    renderSelector();

    const tappedField = screen.getByDisplayValue('2025-01-01');
    userEvent.click(tappedField);

    expect(openedCalendar()).toBe(tappedField);
    pick('2025-03-05');
    expect(onPeriodChange).toHaveBeenCalledWith('2025-03-05', '2025-08-15');
  });

  it('leaves the cursor where it is when a tapped browser cannot show its calendar on request', () => {
    browserWithoutCalendar();
    renderSelector();

    userEvent.click(screen.getByDisplayValue('2025-01-01'));

    expect(screen.getByLabelText('From')).not.toHaveFocus();
  });

  it('opens on the date in effect and offers only the days inside the period', () => {
    browserWithCalendar();
    renderSelector();

    userEvent.click(screen.getByRole('button', { name: 'Choose end date from calendar' }));

    expect(openedCalendar()).toHaveValue('2025-08-15');
    expect(openedCalendar()).toHaveAttribute('min', '2025-01-01');
    expect(openedCalendar()).toHaveAttribute('max', '2025-08-15');
  });

  it('puts the cursor in the box when the browser cannot show a calendar', () => {
    browserWithoutCalendar();
    renderSelector();

    userEvent.click(screen.getByRole('button', { name: 'Choose start date from calendar' }));

    expect(screen.getByLabelText('From')).toHaveFocus();
  });

  it('puts the cursor in the box when the browser has no calendar at all', () => {
    renderSelector();

    userEvent.click(screen.getByRole('button', { name: 'Choose start date from calendar' }));

    expect(screen.getByLabelText('From')).toHaveFocus();
  });
});
