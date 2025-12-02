import { render, screen } from '@testing-library/react';
import { MultiSelect, MultiSelectOption, MultiSelectOptionGroup } from './MultiSelect';

const mockOptions: MultiSelectOption[] = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

const mockGroupedOptions: MultiSelectOptionGroup[] = [
  {
    label: 'Group 1',
    options: [
      { value: 'g1-opt1', label: 'Group 1 Option 1' },
      { value: 'g1-opt2', label: 'Group 1 Option 2' },
    ],
  },
  {
    label: 'Group 2',
    options: [
      { value: 'g2-opt1', label: 'Group 2 Option 1' },
      { value: 'g2-opt2', label: 'Group 2 Option 2' },
    ],
  },
];

describe('MultiSelect', () => {
  test('renders select element with options', () => {
    render(<MultiSelect options={mockOptions} />);

    const select = screen.getByRole('listbox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveClass('form-select', 'form-select-lg');
  });

  test('renders all options', () => {
    render(<MultiSelect options={mockOptions} />);

    mockOptions.forEach((option) => {
      expect(screen.getByRole('option', { name: option.label })).toBeInTheDocument();
    });
  });

  test('renders grouped options', () => {
    render(<MultiSelect options={mockGroupedOptions} />);

    expect(screen.getByRole('option', { name: 'Group 1 Option 1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Group 1 Option 2' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Group 2 Option 1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Group 2 Option 2' })).toBeInTheDocument();
  });

  test('applies custom className', () => {
    const customClass = 'custom-select-class';
    render(<MultiSelect options={mockOptions} className={customClass} />);

    const select = screen.getByRole('listbox');
    expect(select).toHaveClass(customClass);
  });

  test('sets aria-label', () => {
    const ariaLabel = 'test-aria-label';
    render(<MultiSelect options={mockOptions} ariaLabel={ariaLabel} />);

    const select = screen.getByRole('listbox', { name: ariaLabel });
    expect(select).toBeInTheDocument();
  });

  test('sets size attribute', () => {
    render(<MultiSelect options={mockOptions} size={5} />);

    const select = screen.getByRole('listbox');
    expect(select).toHaveAttribute('size', '5');
  });

  test('has multiple attribute', () => {
    render(<MultiSelect options={mockOptions} />);

    const select = screen.getByRole('listbox');
    expect(select).toHaveAttribute('multiple');
  });
});
