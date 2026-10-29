import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChoiceCard } from './ChoiceCard';

const renderCard = (onChange = jest.fn(), checked = false) =>
  render(
    <ChoiceCard
      idPrefix="test"
      name="test-choice"
      value="defer"
      checked={checked}
      title="Lükkan edasi"
      text="Pension on eluks ajaks suurem."
      extra={
        <>
          <label htmlFor="test-years">Mitu aastat edasi</label>
          <select id="test-years" defaultValue="1">
            <option value="1">1 aasta</option>
            <option value="2">2 aastat</option>
          </select>
        </>
      }
      onChange={onChange}
    />,
  );

const renderCardWithNote = (onChange = jest.fn()) =>
  render(
    <ChoiceCard
      idPrefix="test"
      name="test-choice"
      value="work"
      checked={false}
      title="Töötan edasi"
      text="Palk katab kulud."
      note="Brutopalgaga 2 000 € tõstab iga tööaasta pensioni u 12 € kuus."
      onChange={onChange}
    />,
  );

describe('ChoiceCard', () => {
  it('names the radio by its title and describes it by its text', () => {
    renderCard();

    expect(screen.getByRole('radio', { name: 'Lükkan edasi' })).toHaveAccessibleDescription(
      'Pension on eluks ajaks suurem.',
    );
  });

  it('chooses the card when its title is clicked', () => {
    const onChange = jest.fn();
    renderCard(onChange);

    userEvent.click(screen.getByText('Lükkan edasi'));

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('chooses the card when its note is clicked', () => {
    const onChange = jest.fn();
    renderCardWithNote(onChange);

    userEvent.click(screen.getByText(/tõstab iga tööaasta pensioni/));

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('describes the radio by its text and its note', () => {
    renderCardWithNote();

    expect(screen.getByRole('radio', { name: 'Töötan edasi' })).toHaveAccessibleDescription(
      'Palk katab kulud. Brutopalgaga 2 000 € tõstab iga tööaasta pensioni u 12 € kuus.',
    );
  });

  it('does not choose the card when the label of its extra field is clicked', () => {
    const onChange = jest.fn();
    renderCard(onChange);

    userEvent.click(screen.getByText('Mitu aastat edasi'));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('combobox', { name: 'Mitu aastat edasi' })).toHaveFocus();
  });

  it('keeps its extra field outside the card label, where HTML allows another field and label', () => {
    renderCard();

    const field = screen.getByRole('combobox', { name: 'Mitu aastat edasi' });

    // eslint-disable-next-line testing-library/no-node-access
    expect(field.closest('label')).toBeNull();
  });

  it('does not choose the card when its extra field is used', () => {
    const onChange = jest.fn();
    renderCard(onChange);

    userEvent.selectOptions(screen.getByRole('combobox', { name: 'Mitu aastat edasi' }), '2');

    expect(onChange).not.toHaveBeenCalled();
  });
});
