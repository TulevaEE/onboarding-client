import { render, screen, fireEvent, act } from '@testing-library/react';
import TomSelect from 'tom-select';
import userEvent from '@testing-library/user-event';
import { SelectWithAutocomplete, SelectOption } from './SelectWithAutocomplete';

const lookup = jest.fn();
const onChange = jest.fn();

describe('SelectWithAutocomplete', () => {
  beforeEach(() => {
    lookup.mockResolvedValue([]);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders a single-select combobox', () => {
    render(
      <SelectWithAutocomplete<SelectOption>
        lookup={lookup}
        onChange={onChange}
        ariaLabel="Test select"
      />,
    );

    const select = screen.getByRole('combobox', { name: 'Test select' });
    expect(select).toBeInTheDocument();
    expect(select).not.toHaveAttribute('multiple');
  });

  test('applies default className', () => {
    render(
      <SelectWithAutocomplete<SelectOption>
        lookup={lookup}
        onChange={onChange}
        ariaLabel="Test select"
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Test select' })).toHaveClass(
      'form-select',
      'form-select-lg',
    );
  });

  test('applies custom className', () => {
    render(
      <SelectWithAutocomplete<SelectOption>
        lookup={lookup}
        onChange={onChange}
        className="custom-class"
        ariaLabel="Test select"
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Test select' })).toHaveClass('custom-class');
  });

  test('sets aria-label', () => {
    render(
      <SelectWithAutocomplete<SelectOption>
        lookup={lookup}
        onChange={onChange}
        ariaLabel="Search companies"
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Search companies' })).toBeInTheDocument();
  });

  test('renders provided options', async () => {
    const options: SelectOption[] = [
      { value: 'opt1', text: 'Option One' },
      { value: 'opt2', text: 'Option Two' },
    ];

    render(
      <SelectWithAutocomplete<SelectOption>
        lookup={lookup}
        onChange={onChange}
        options={options}
        ariaLabel="Test select"
        placeholder="Search..."
      />,
    );

    const input = screen.getByPlaceholderText('Search...');
    userEvent.type(input, 'Option');

    await act(async () => {
      jest.runAllTimers();
    });

    expect(screen.getByRole('option', { name: 'Option One' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option Two' })).toBeInTheDocument();
  });

  test('calls onBlur handler', () => {
    const onBlur = jest.fn();
    render(
      <SelectWithAutocomplete<SelectOption>
        lookup={lookup}
        onChange={onChange}
        onBlur={onBlur}
        ariaLabel="Test select"
      />,
    );

    fireEvent.blur(screen.getByRole('combobox', { name: 'Test select' }));

    expect(onBlur).toHaveBeenCalled();
  });

  test('calls lookup via TomSelect load callback', async () => {
    const results: SelectOption[] = [{ value: 'acme', text: 'Acme Inc' }];
    lookup.mockResolvedValue(results);

    render(
      <SelectWithAutocomplete<SelectOption>
        lookup={lookup}
        onChange={onChange}
        ariaLabel="Test select"
        placeholder="Search..."
      />,
    );

    const input = screen.getByPlaceholderText('Search...');
    userEvent.type(input, 'acme');

    await act(async () => {
      jest.runAllTimers();
    });

    expect(lookup).toHaveBeenCalledWith('acme');
  });

  test('calls onChange with selected option', async () => {
    const options: SelectOption[] = [
      { value: 'opt1', text: 'Option One' },
      { value: 'opt2', text: 'Option Two' },
    ];

    render(
      <SelectWithAutocomplete<SelectOption>
        lookup={lookup}
        onChange={onChange}
        options={options}
        ariaLabel="Test select"
        placeholder="Search..."
      />,
    );

    const input = screen.getByPlaceholderText('Search...');
    userEvent.type(input, 'One');

    await act(async () => {
      jest.runAllTimers();
    });

    const option = await screen.findByRole('option', { name: /Option One/ });
    userEvent.click(option);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'opt1', text: 'Option One' }),
    );
  });

  test('renders placeholder text', () => {
    render(
      <SelectWithAutocomplete<SelectOption>
        lookup={lookup}
        onChange={onChange}
        ariaLabel="Test select"
        placeholder="Search here"
      />,
    );

    expect(screen.getByPlaceholderText('Search here')).toBeInTheDocument();
  });

  test('pre-selects defaultValue', () => {
    const options: SelectOption[] = [
      { value: 'opt1', text: 'Option One' },
      { value: 'opt2', text: 'Option Two' },
    ];

    render(
      <SelectWithAutocomplete<SelectOption>
        lookup={lookup}
        onChange={onChange}
        options={options}
        defaultValue="opt1"
        ariaLabel="Test select"
      />,
    );

    const selectedItem = screen.getByText('Option One', { selector: '[data-ts-item]' });
    expect(selectedItem).toBeInTheDocument();
  });

  test('destroys TomSelect on unmount', () => {
    const destroySpy = jest.spyOn(TomSelect.prototype, 'destroy');
    const { unmount } = render(
      <SelectWithAutocomplete<SelectOption> lookup={lookup} onChange={onChange} />,
    );

    unmount();

    expect(destroySpy).toHaveBeenCalled();
    destroySpy.mockRestore();
  });
});
