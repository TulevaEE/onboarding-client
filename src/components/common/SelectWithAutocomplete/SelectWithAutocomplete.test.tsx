import { render, screen, fireEvent, act } from '@testing-library/react';
import TomSelect from 'tom-select';
import { SelectWithAutocomplete, SelectOption } from './SelectWithAutocomplete';

const lookup = jest.fn();
const onChange = jest.fn();

describe('SelectWithAutocomplete', () => {
  beforeEach(() => {
    lookup.mockResolvedValue([]);
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

  test('renders provided options', () => {
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
      />,
    );

    const select = screen.getByRole('combobox', { name: 'Test select' }) as any;
    const tomSelectOptions = select.tomselect.options;
    expect(tomSelectOptions.opt1).toEqual(
      expect.objectContaining({ value: 'opt1', text: 'Option One' }),
    );
    expect(tomSelectOptions.opt2).toEqual(
      expect.objectContaining({ value: 'opt2', text: 'Option Two' }),
    );
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
      />,
    );

    jest.useFakeTimers();
    const select = screen.getByRole('combobox', { name: 'Test select' }) as any;
    const tomSelectInstance = select.tomselect;
    const cb = jest.fn();
    tomSelectInstance.settings.load.call(tomSelectInstance, 'acme', cb);

    await act(async () => {
      jest.runAllTimers();
    });

    expect(lookup).toHaveBeenCalledWith('acme');
    jest.useRealTimers();
  });

  test('calls onChange with selected option', () => {
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
      />,
    );

    const select = screen.getByRole('combobox', { name: 'Test select' }) as any;
    act(() => {
      select.tomselect.setValue('opt1');
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'opt1', text: 'Option One' }),
    );
  });

  test('passes placeholder to TomSelect', () => {
    render(
      <SelectWithAutocomplete<SelectOption>
        lookup={lookup}
        onChange={onChange}
        ariaLabel="Test select"
        placeholder="Search here"
      />,
    );

    const select = screen.getByRole('combobox', { name: 'Test select' }) as any;
    expect(select.tomselect.settings.placeholder).toBe('Search here');
  });

  test('pre-selects defaultValue in TomSelect', () => {
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

    const select = screen.getByRole('combobox', { name: 'Test select' }) as any;
    expect(select.tomselect.items).toContain('opt1');
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
