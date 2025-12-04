import { FC, useEffect, useRef } from 'react';
import TomSelect from 'tom-select';
import 'tom-select/dist/css/tom-select.bootstrap5.css';
import 'tom-select/dist/js/plugins/remove_button';

export type MultiSelectOption = {
  value: string;
  label: string;
};

export type MultiSelectOptionGroup = {
  label: string;
  options: MultiSelectOption[];
};

type MultiSelectProps = {
  options: (MultiSelectOption | MultiSelectOptionGroup)[];
  placeholder?: string;
  selected?: string[];
  deleteButtonTitle?: string;
  onChange?: (values: string[]) => void;
  onBlur?: () => void;
  ariaLabel?: string;
  size?: number;
  className?: string;
};

export const MultiSelect: FC<MultiSelectProps> = ({
  options,
  selected = [],
  placeholder,
  deleteButtonTitle,
  onChange,
  onBlur,
  ariaLabel,
  size = 10,
  className = 'form-select form-select-lg',
}) => {
  const selectRef = useRef<HTMLSelectElement>(null);
  const tomSelectRef = useRef<TomSelect | null>(null);

  useEffect(() => {
    const selectElement = selectRef.current;
    if (!selectElement) {
      return undefined;
    }

    tomSelectRef.current = new TomSelect(selectElement, {
      plugins: {
        ...(deleteButtonTitle
          ? {
              remove_button: {
                title: deleteButtonTitle,
              },
            }
          : {}),
      },
      placeholder,
      maxItems: null,
      maxOptions: 200,
      items: selected,
      closeAfterSelect: true,
      onChange: (values: string | string[]) => {
        const valuesArray = Array.isArray(values) ? values : [values];
        onChange?.(valuesArray);
      },
    });

    return () => {
      if (tomSelectRef.current) {
        tomSelectRef.current.destroy();
        tomSelectRef.current = null;
      }
    };
  }, []); // Only run once on mount

  useEffect(() => {
    if (tomSelectRef.current) {
      tomSelectRef.current.setValue(selected, true); // silent = true to avoid triggering onChange
    }
  }, [selected]);

  const isOptionGroup = (
    option: MultiSelectOption | MultiSelectOptionGroup,
  ): option is MultiSelectOptionGroup => 'options' in option;

  return (
    <select
      onBlur={onBlur}
      ref={selectRef}
      className={className}
      aria-label={ariaLabel}
      multiple
      size={size}
    >
      {options.map((option) =>
        isOptionGroup(option) ? (
          <optgroup key={option.label} label={option.label}>
            {option.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </optgroup>
        ) : (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ),
      )}
    </select>
  );
};
